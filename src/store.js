import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { detectFileType } from './constants'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

let auth = null
let db = null

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  console.info('[pe-portal] Firebase connected — live mode (Firestore + Auth).')
} else {
  console.warn(
    '[pe-portal] Firebase env vars missing — running in local demo mode. ' +
      'Set VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID / VITE_FIREBASE_APP_ID ' +
      'in .env and restart the dev server.',
  )
}

const WRITE_TIMEOUT = 60_000

// Firestore writes can hang silently while offline — bound them so the UI
// never spins forever.
function withTimeout(promise, ms = WRITE_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ])
}

/* ------------------------------------------------------------------ */
/* File handling                                                        */
/* Files ≤ ~700KB are stored inline as Base64 data URLs (Firestore docs  */
/* are capped at 1 MiB). Larger files — up to 20MB — are split into      */
/* ~900KB Base64 chunks inside a `chunks` subcollection and reassembled  */
/* on demand. Images above the inline limit are compressed first and     */
/* only chunked if compression can't get them under the inline limit.    */
/* ------------------------------------------------------------------ */

export const MAX_FILE_BYTES = 20 * 1024 * 1024 // 20MB hard client limit
const MAX_INLINE_BYTES = 700_000
const CHUNK_SIZE = 900_000 // base64 chars per chunk doc (safely under 1 MiB)

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function compressImage(file) {
  const img = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let maxDim = 1400
  let quality = 0.85
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    canvas.width = Math.max(1, Math.round(img.width * scale))
    canvas.height = Math.max(1, Math.round(img.height * scale))
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_INLINE_BYTES) return blob
    maxDim = Math.round(maxDim * 0.7)
    quality = Math.max(0.4, quality - 0.15)
  }
  return null
}

// Returns { payload, chunks } — chunks is a string[] of raw base64 when the
// file exceeds the inline limit, otherwise null.
async function filePayload(file) {
  if (!file) return { payload: {}, chunks: null }
  if (file.size > MAX_FILE_BYTES) throw new Error('file-too-large')

  let blob = file
  if (file.type.startsWith('image/') && file.size > MAX_INLINE_BYTES) {
    const compressed = await compressImage(file).catch(() => null)
    if (compressed) blob = compressed
  }

  const fileType = detectFileType(file)

  if (blob.size <= MAX_INLINE_BYTES) {
    const fileUrl = await fileToDataUrl(blob)
    return { payload: { fileUrl, fileType, fileName: file.name, chunked: false }, chunks: null }
  }

  const dataUrl = await fileToDataUrl(blob)
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const chunks = []
  for (let i = 0; i < b64.length; i += CHUNK_SIZE) {
    chunks.push(b64.slice(i, i + CHUNK_SIZE))
  }
  return {
    payload: {
      chunked: true,
      fileType,
      fileName: file.name,
      fileSize: blob.size,
      mime: blob.type || file.type,
    },
    chunks,
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 0x8000) {
    bytes.set(Uint8Array.from(bin.slice(i, i + 0x8000), (c) => c.charCodeAt(0)), i)
  }
  return bytes
}

/* ------------------------------------------------------------------ */
/* Local demo backend (localStorage) — used when Firebase env is unset */
/* ------------------------------------------------------------------ */

const LS_KEYS = { posts: 'pe_portal_posts', strategies: 'pe_portal_strategies' }
const LS_TEACHER = 'pe_portal_teacher'

const listeners = { posts: new Set(), strategies: new Set() }

function readLS(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded — keep going, items stay readable for this session
  }
  listeners[key].forEach((cb) => cb(sortByDate(readLS(key))))
}

function sortByDate(items) {
  return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function subscribeLS(key, cb) {
  const handler = (e) => {
    if (e.key === LS_KEYS[key]) cb(sortByDate(readLS(key)))
  }
  window.addEventListener('storage', handler)
  listeners[key].add(cb)
  cb(sortByDate(readLS(key)))
  return () => {
    listeners[key].delete(cb)
    window.removeEventListener('storage', handler)
  }
}

async function localFilePayload(file) {
  if (!file) return {}
  if (file.size > MAX_FILE_BYTES) throw new Error('file-too-large')
  let blob = file
  if (file.type.startsWith('image/') && file.size > MAX_INLINE_BYTES) {
    const compressed = await compressImage(file).catch(() => null)
    if (compressed) blob = compressed
  }
  const fileType = detectFileType(file)
  if (blob.size <= 3_500_000) {
    const fileUrl = await fileToDataUrl(blob)
    return { fileUrl, fileType, fileName: file.name }
  }
  // too big for localStorage — session-only object URL (demo mode only)
  return { fileUrl: URL.createObjectURL(blob), fileType, fileName: file.name }
}

function localAdd(key, data, payload) {
  const items = readLS(key)
  const item = {
    id: crypto.randomUUID(),
    ...data,
    ...payload,
    createdAt: new Date().toISOString(),
  }
  items.push(item)
  writeLS(key, items)
  return item
}

function localUpdate(key, id, data, payload) {
  const items = readLS(key).map((it) =>
    it.id === id ? { ...it, ...data, ...(payload || {}) } : it,
  )
  writeLS(key, items)
}

function localDelete(key, id) {
  writeLS(key, readLS(key).filter((it) => it.id !== id))
}

/* ------------------------------------------------------------------ */
/* Firestore backend                                                    */
/* ------------------------------------------------------------------ */

function subscribeCollection(name, cb, onErr) {
  const q = query(collection(db, name), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    },
    (err) => {
      console.error(`[pe-portal] Firestore listener failed on "${name}":`, err)
      onErr?.(err)
    },
  )
}

// 5 chunks ≈ 4.5MB per commit — a single batch for a 20MB file would exceed
// Firestore's 10 MiB write limit. Three commits run in parallel; onProgress
// reports chunks written so the UI can show a percentage.
const CHUNK_BATCH = 5
const CHUNK_CONCURRENCY = 3

async function writeChunks(docRef, chunks, onProgress) {
  const colRef = collection(docRef, 'chunks')
  const jobs = []
  for (let start = 0; start < chunks.length; start += CHUNK_BATCH) {
    const batch = writeBatch(db)
    chunks.slice(start, start + CHUNK_BATCH).forEach((data, idx) => {
      batch.set(doc(colRef), { i: start + idx, data })
    })
    jobs.push(batch)
  }
  let done = 0
  for (let i = 0; i < jobs.length; i += CHUNK_CONCURRENCY) {
    await Promise.all(
      jobs.slice(i, i + CHUNK_CONCURRENCY).map((batch) =>
        withTimeout(batch.commit()).then(() => {
          done += CHUNK_BATCH
          onProgress?.(Math.min(done, chunks.length), chunks.length)
        }),
      ),
    )
  }
}

async function deleteChunks(name, id) {
  const snap = await withTimeout(getDocs(collection(db, name, id, 'chunks')))
  if (snap.empty) return
  for (let start = 0; start < snap.docs.length; start += 400) {
    const batch = writeBatch(db)
    snap.docs.slice(start, start + 400).forEach((d) => batch.delete(d.ref))
    await withTimeout(batch.commit())
  }
}

async function fbAdd(name, data, file, onProgress) {
  const { payload, chunks } = await filePayload(file)
  const docRef = doc(collection(db, name))
  // Chunks first, parent doc last: subcollection writes don't require the
  // parent to exist, and public users can't delete posts — so a failed
  // upload must never leave a parent doc pointing at missing chunks.
  if (chunks) await writeChunks(docRef, chunks, onProgress)
  await withTimeout(
    setDoc(docRef, { ...data, ...payload, createdAt: serverTimestamp() }),
  )
  return { id: docRef.id, ...data, ...payload }
}

async function fbUpdate(name, id, data, file, oldItem, onProgress) {
  const { payload, chunks } = file
    ? await filePayload(file)
    : { payload: {}, chunks: null }
  if (file && (chunks || oldItem?.chunked)) {
    await deleteChunks(name, id)
    if (chunks) await writeChunks(doc(db, name, id), chunks, onProgress)
  }
  await withTimeout(updateDoc(doc(db, name, id), { ...data, ...payload }))
}

async function fbDelete(name, item) {
  if (item.chunked) await deleteChunks(name, item.id)
  await withTimeout(deleteDoc(doc(db, name, item.id)))
}

/* ------------------------------------------------------------------ */
/* Unified API                                                          */
/* ------------------------------------------------------------------ */

export const store = {
  get mode() {
    return isFirebaseConfigured ? 'firebase' : 'demo'
  },

  subscribePosts(cb, onErr) {
    return isFirebaseConfigured
      ? subscribeCollection('posts', cb, onErr)
      : subscribeLS('posts', cb)
  },

  subscribeStrategies(cb, onErr) {
    return isFirebaseConfigured
      ? subscribeCollection('strategies', cb, onErr)
      : subscribeLS('strategies', cb)
  },

  // Reassembles a chunked file into a blob URL on demand.
  async fetchFileUrl(item, coll) {
    if (!isFirebaseConfigured) return item.fileUrl || null
    const snap = await withTimeout(
      getDocs(query(collection(db, coll, item.id, 'chunks'), orderBy('i'))),
    )
    if (snap.empty) {
      if (item.fileUrl) return item.fileUrl
      throw new Error('file-missing')
    }
    const b64 = snap.docs.map((d) => d.data().data).join('')
    const bytes = base64ToBytes(b64)
    return URL.createObjectURL(new Blob([bytes], { type: item.mime || 'application/octet-stream' }))
  },

  async addPost(data, file, onProgress) {
    if (isFirebaseConfigured) return fbAdd('posts', data, file, onProgress)
    return localAdd('posts', data, await localFilePayload(file))
  },

  async updatePost(post, data, file, onProgress) {
    if (isFirebaseConfigured) return fbUpdate('posts', post.id, data, file, post, onProgress)
    const payload = file ? await localFilePayload(file) : null
    return localUpdate('posts', post.id, data, payload)
  },

  async deletePost(post) {
    if (isFirebaseConfigured) return fbDelete('posts', post)
    return localDelete('posts', post.id)
  },

  async addStrategy(data, file, onProgress) {
    if (isFirebaseConfigured) return fbAdd('strategies', data, file, onProgress)
    return localAdd('strategies', data, await localFilePayload(file))
  },

  async updateStrategy(item, data, file, onProgress) {
    if (isFirebaseConfigured) return fbUpdate('strategies', item.id, data, file, item, onProgress)
    const payload = file ? await localFilePayload(file) : null
    return localUpdate('strategies', item.id, data, payload)
  },

  async deleteStrategy(item) {
    if (isFirebaseConfigured) return fbDelete('strategies', item)
    return localDelete('strategies', item.id)
  },

  onAuth(cb) {
    if (isFirebaseConfigured) return onAuthStateChanged(auth, (u) => cb(Boolean(u)))
    cb(localStorage.getItem(LS_TEACHER) === '1')
    return () => {}
  },

  async signIn(email, password) {
    if (isFirebaseConfigured) {
      await signInWithEmailAndPassword(auth, email, password)
      return
    }
    if (!email || !password || password.length < 4) {
      throw new Error('invalid')
    }
    localStorage.setItem(LS_TEACHER, '1')
  },

  async signOut() {
    if (isFirebaseConfigured) return firebaseSignOut(auth)
    localStorage.removeItem(LS_TEACHER)
  },
}
