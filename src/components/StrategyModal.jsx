import { useRef, useState } from 'react'
import Modal from './Modal'

export default function StrategyModal({ initial, onClose, onSubmit }) {
  const isEdit = Boolean(initial)
  const [title, setTitle] = useState(initial?.title || '')
  const [content, setContent] = useState(initial?.content || '')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return setError('الرجاء إدخال عنوان الاستراتيجية')
    setBusy(true)
    setProgress(0)
    setError('')
    try {
      await onSubmit(
        { title: title.trim(), content: content.trim() },
        file,
        (done, total) => setProgress(Math.round((done / total) * 100)),
      )
      setTitle('')
      setContent('')
      setFile(null)
      setError('')
    } catch (err) {
      console.error('[pe-portal] strategy submit failed:', err)
      setError(
        err?.message === 'file-too-large'
          ? 'حجم الملف كبير جداً، يرجى اختيار ملف أصغر من 20 ميجابايت'
          : err?.message === 'timeout'
            ? 'انتهت مهلة الحفظ — تحققي من اتصال الإنترنت وقواعد Firestore'
            : 'حدث خطأ أثناء الحفظ، حاولي مرة أخرى',
      )
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isEdit ? '✏️ تعديل الاستراتيجية' : '🟣 إضافة استراتيجية تدريس'}
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-700">
            عنوان الاستراتيجية
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: التعلم التعاوني في حصة التربية البدنية"
            className="w-full rounded-xl border border-pink-200 bg-pink-50/40 px-4 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-700">
            الوصف / الخطوات
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="اكتبي شرح الاستراتيجية وخطوات تطبيقها..."
            className="w-full resize-y rounded-xl border border-pink-200 bg-pink-50/40 px-4 py-2.5 text-sm leading-relaxed outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-700">
            ملف مرفق <span className="font-normal text-gray-400">(اختياري — صورة، فيديو، PDF أو Word، حتى 20 ميجابايت)</span>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-300 bg-pink-50/50 px-4 py-5 text-sm font-semibold text-pink-600 transition hover:border-pink-400 hover:bg-pink-50"
          >
            <span className="text-2xl">📎</span>
            {file ? file.name : isEdit && initial?.fileName ? `الملف الحالي: ${initial.fileName}` : 'اضغطي لإرفاق ملف'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        {busy && progress > 0 && (
          <div className="space-y-1.5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-purple-100">
              <div
                className="h-full rounded-full bg-gradient-to-l from-purple-400 to-pink-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-xs font-bold text-purple-500">
              جاري رفع الملف... {progress}%
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-l from-purple-400 to-pink-400 py-3 font-display text-base font-extrabold text-white shadow-lg shadow-purple-200/70 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {busy
            ? progress > 0
              ? `جارٍ الحفظ... ${progress}%`
              : 'جارٍ تجهيز الملف...'
            : isEdit
              ? 'حفظ التعديلات'
              : 'نشر الاستراتيجية'}
        </button>
      </form>
    </Modal>
  )
}
