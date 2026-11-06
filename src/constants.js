export const GRADES = {
  grade2: { id: 'grade2', label: 'ثاني متوسط', emoji: '🔵', color: 'sky' },
  grade3: { id: 'grade3', label: 'ثالث متوسط', emoji: '🟢', color: 'emerald' },
}

export const TABS = {
  grade2: { id: 'grade2', label: 'ثاني متوسط', emoji: '🔵' },
  grade3: { id: 'grade3', label: 'ثالث متوسط', emoji: '🟢' },
  strategies: { id: 'strategies', label: 'الاستراتيجيات', emoji: '🟣' },
}

export const CATEGORIES = {
  grade2: [
    { id: 'health', label: 'الصحة واللياقة البدنية', icon: '💪' },
    { id: 'football', label: 'كرة القدم', icon: '⚽' },
    { id: 'volleyball', label: 'كرة الطائرة', icon: '🏐' },
    { id: 'basketball', label: 'كرة السلة', icon: '🏀' },
    { id: 'handball', label: 'كرة اليد', icon: '🤾' },
    { id: 'tennis', label: 'التنس', icon: '🎾' },
    { id: 'tabletennis', label: 'كرة الطاولة', icon: '🏓' },
    { id: 'gymnastics', label: 'الجمباز', icon: '🤸' },
  ],
  grade3: [
    { id: 'health', label: 'الصحة واللياقة البدنية', icon: '💪' },
    { id: 'football', label: 'كرة القدم', icon: '⚽' },
    { id: 'volleyball', label: 'كرة الطائرة', icon: '🏐' },
    { id: 'basketball', label: 'كرة السلة', icon: '🏀' },
    { id: 'handball', label: 'كرة اليد', icon: '🤾' },
  ],
}

export function categoryLabel(grade, categoryId) {
  const found = (CATEGORIES[grade] || []).find((c) => c.id === categoryId)
  return found ? `${found.icon} ${found.label}` : categoryId
}

export const FILE_TYPE_META = {
  image: { label: 'صورة', icon: '🖼️' },
  video: { label: 'فيديو', icon: '🎬' },
  pdf: { label: 'PDF', icon: '📕' },
  word: { label: 'مستند Word', icon: '📘' },
  other: { label: 'ملف', icon: '📎' },
  none: { label: 'بدون ملف', icon: '📝' },
}

export function detectFileType(file) {
  const t = file.type || ''
  if (t.startsWith('image/')) return 'image'
  if (t.startsWith('video/')) return 'video'
  if (t === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  if (t.includes('word') || /\.(doc|docx)$/i.test(file.name)) return 'word'
  return 'other'
}

function downloadUrl(url, fileName) {
  const a = document.createElement('a')
  a.href = url
  a.download = fileName || 'file'
  a.click()
}

export function openFileUrl(url, fileName, mime) {
  if (!url) return
  if (!url.startsWith('data:')) {
    const renderable = !mime || /^(image\/|video\/|application\/pdf)/.test(mime)
    // Popup blockers return null — fall back to a download so the file
    // is still reachable instead of silently doing nothing.
    if (renderable && window.open(url, '_blank', 'noopener')) return
    downloadUrl(url, fileName)
    return
  }
  const [meta, b64] = url.split(',')
  const dataMime = meta.match(/data:(.*?);/)?.[1] || 'application/octet-stream'
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: dataMime }))
  const renderable = /^(image\/|video\/|application\/pdf)/.test(dataMime)
  if (!renderable || !window.open(blobUrl, '_blank', 'noopener')) {
    downloadUrl(blobUrl, fileName)
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)
}

export function formatDate(value) {
  if (!value) return ''
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
}
