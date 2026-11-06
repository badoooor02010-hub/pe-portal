import { useEffect, useState } from 'react'
import { FILE_TYPE_META, GRADES, categoryLabel, formatDate, openFileUrl } from '../constants'
import { store } from '../store'

function ChunkedPreview({ item, coll, title }) {
  const meta = FILE_TYPE_META[item.fileType] || FILE_TYPE_META.other
  const isImage = item.fileType === 'image'
  const renderable = /^(image\/|video\/|application\/pdf)/.test(item.mime || '')
  const { id: itemId, mime, fileUrl } = item
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(isImage)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!isImage) return
    let alive = true
    let objectUrl = null
    store
      .fetchFileUrl({ id: itemId, mime, fileUrl }, coll)
      .then((u) => {
        if (!alive) return
        objectUrl = u
        setUrl(u)
      })
      .catch(() => alive && setFailed(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [itemId, mime, fileUrl, coll, isImage])

  async function handleOpen() {
    if (loading) return
    // Open the tab synchronously inside the tap — async window.open()
    // after an awaited fetch gets blocked by mobile popup blockers.
    const win = renderable && !url ? window.open('', '_blank') : null
    setLoading(true)
    setFailed(false)
    try {
      const u = url || (await store.fetchFileUrl(item, coll))
      if (!u) throw new Error('file-missing')
      setUrl(u)
      if (win) {
        win.location.href = u
      } else {
        openFileUrl(u, item.fileName, item.mime)
      }
    } catch (err) {
      console.error('[pe-portal] file load failed:', err)
      if (win) win.close()
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  if (isImage && url) {
    return (
      <button type="button" onClick={handleOpen} className="block w-full" title="فتح الصورة">
        <img
          src={url}
          alt={title || item.fileName || 'صورة'}
          className="h-44 w-full object-cover transition duration-300 hover:scale-[1.03]"
          loading="lazy"
        />
      </button>
    )
  }

  const actionLabel =
    item.fileType === 'pdf'
      ? 'عرض / تحميل ملف PDF ↗'
      : item.fileType === 'word'
        ? 'تحميل ملف Word ↓'
        : item.fileType === 'video'
          ? 'عرض / تحميل الفيديو ↗'
          : 'فتح الملف ↗'

  return (
    <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-50 to-rose-100/60 px-3 text-center">
      <span className={`p-1 text-5xl leading-[1.3] drop-shadow-sm ${loading ? 'animate-pulse' : ''}`}>
        {loading ? '⏳' : meta.icon}
      </span>
      <span className="max-w-full truncate text-xs font-semibold text-pink-700/80">
        {item.fileName ? item.fileName : meta.label}
        {item.fileSize ? ` · ${(item.fileSize / 1024 / 1024).toFixed(1)}MB` : ''}
      </span>
      {failed ? (
        <>
          <button
            type="button"
            onClick={handleOpen}
            className="rounded-full bg-rose-500 px-4 py-1.5 text-[11px] font-bold text-white shadow transition hover:bg-rose-600"
          >
            إعادة المحاولة
          </button>
          <span className="text-[11px] font-semibold text-rose-500">
            عذراً، تعذر فتح الملف، يرجى المحاولة مرة أخرى
          </span>
        </>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          disabled={loading}
          className="rounded-full bg-pink-400 px-4 py-1.5 text-[11px] font-bold text-white shadow transition hover:bg-pink-500 disabled:opacity-70"
        >
          {loading ? 'جارٍ تحميل الملف...' : actionLabel}
        </button>
      )}
    </div>
  )
}

function FilePreview({ item, coll, title }) {
  if (item.chunked) return <ChunkedPreview item={item} coll={coll} title={title} />
  const { fileUrl, fileType, fileName } = item
  if (fileUrl && fileType === 'image') {
    return (
      <button
        type="button"
        onClick={() => openFileUrl(fileUrl, fileName)}
        className="block w-full"
        title="فتح الصورة"
      >
        <img
          src={fileUrl}
          alt={title || fileName || 'صورة'}
          className="h-44 w-full object-cover transition duration-300 hover:scale-[1.03]"
          loading="lazy"
        />
      </button>
    )
  }
  if (fileUrl && fileType === 'video') {
    return (
      <video src={fileUrl} controls preload="metadata" className="h-44 w-full bg-black object-contain" />
    )
  }
  const meta = FILE_TYPE_META[fileType] || FILE_TYPE_META.other
  return (
    <button
      type="button"
      onClick={() => openFileUrl(fileUrl, fileName)}
      disabled={!fileUrl}
      className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-pink-50 to-rose-100/60 text-center transition hover:from-pink-100 hover:to-rose-100"
    >
      <span className="p-1 text-5xl leading-[1.3] drop-shadow-sm">{meta.icon}</span>
      <span className="px-3 text-xs font-semibold text-pink-700/80">
        {fileName ? fileName : meta.label}
      </span>
      {fileUrl && (
        <span className="rounded-full bg-pink-400 px-3 py-1 text-[11px] font-bold text-white">
          فتح الملف ↗
        </span>
      )}
    </button>
  )
}

function TeacherActions({ onEdit, onDelete }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onEdit}
        className="rounded-lg bg-pink-50 px-2.5 py-1 text-xs font-bold text-pink-700 ring-1 ring-pink-200 transition hover:bg-pink-100"
      >
        ✏️ تعديل
      </button>
      <button
        onClick={onDelete}
        className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
      >
        🗑️ حذف
      </button>
    </div>
  )
}

export function PostCard({ post, isTeacher, onEdit, onDelete }) {
  return (
    <article className="board-card overflow-hidden rounded-2xl border border-pink-100 bg-white shadow-md shadow-pink-100/60">
      <FilePreview item={post} coll="posts" title={post.studentName} />
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-base font-extrabold text-gray-800">
            {post.studentName}
          </h4>
          {isTeacher && (
            <TeacherActions onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <span className="rounded-full bg-pink-100 px-2.5 py-1 text-pink-700">
            {categoryLabel(post.grade, post.sportCategory)}
          </span>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
            {GRADES[post.grade]?.label || post.grade}
          </span>
        </div>
        <p className="text-[11px] font-medium text-gray-400">
          🗓️ {formatDate(post.createdAt)}
        </p>
      </div>
    </article>
  )
}

export function StrategyCard({ item, isTeacher, onEdit, onDelete }) {
  const hasFile = item.fileUrl || item.chunked
  return (
    <article className="board-card overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-md shadow-purple-100/60">
      {hasFile && <FilePreview item={item} coll="strategies" title={item.title} />}
      <div className="space-y-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-display text-base font-extrabold text-purple-900">
            {item.title}
          </h4>
          {isTeacher && (
            <TeacherActions onEdit={onEdit} onDelete={onDelete} />
          )}
        </div>
        {item.content && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {item.content}
          </p>
        )}
        <p className="text-[11px] font-medium text-gray-400">
          🗓️ {formatDate(item.createdAt)}
        </p>
      </div>
    </article>
  )
}
