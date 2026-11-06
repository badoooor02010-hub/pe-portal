import { useState } from 'react'
import Modal from './Modal'

export default function LoginModal({ demo, onClose, onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(email.trim(), password)
    } catch {
      setError(
        demo
          ? 'أدخل أي بريد وكلمة مرور (4 أحرف فأكثر) لتجربة وضع المعلمة'
          : 'بيانات الدخول غير صحيحة، حاولي مرة أخرى',
      )
      setBusy(false)
    }
  }

  return (
    <Modal title="🔐 دخول المعلمة" onClose={onClose}>
      {demo && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold leading-relaxed text-amber-700 ring-1 ring-amber-200">
          وضع المعاينة: لم يتم ربط Firebase بعد. أدخلي أي بريد وكلمة مرور لتجربة
          صلاحيات المعلمة.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-700">
            البريد الإلكتروني
          </label>
          <input
            type={demo ? 'text' : 'email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher@example.com"
            dir="ltr"
            className="w-full rounded-xl border border-pink-200 bg-pink-50/40 px-4 py-2.5 text-left text-sm outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-gray-700">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            dir="ltr"
            className="w-full rounded-xl border border-pink-200 bg-pink-50/40 px-4 py-2.5 text-left text-sm outline-none transition focus:border-pink-400 focus:bg-white focus:ring-2 focus:ring-pink-200"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-gradient-to-l from-pink-400 to-rose-400 py-3 font-display text-base font-extrabold text-white shadow-lg shadow-pink-200/70 transition hover:scale-[1.02] disabled:opacity-60"
        >
          {busy ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
        </button>
      </form>
    </Modal>
  )
}
