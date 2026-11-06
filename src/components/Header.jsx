import { useState } from 'react'
import { GraduationCap } from 'lucide-react'

function MinistryLogo() {
  const [imgOk, setImgOk] = useState(true)
  if (imgOk) {
    return (
      <img
        src="/moe-logo.png"
        alt="وزارة التعليم - Ministry of Education"
        className="h-24 w-auto object-contain drop-shadow-sm sm:h-28"
        onError={() => setImgOk(false)}
      />
    )
  }
  return (
    <svg viewBox="0 0 64 64" className="h-24 w-24 sm:h-28 sm:w-28" aria-label="شعار وزارة التعليم">
      <circle cx="32" cy="32" r="30" fill="#ffffff" stroke="#0a6c37" strokeWidth="2.5" />
      <circle cx="32" cy="32" r="25" fill="none" stroke="#0a6c37" strokeWidth="1" opacity="0.5" />
      <path d="M30 46 C31 38 31 33 30.5 27 L33.5 27 C33 33 33 38 34 46 Z" fill="#7a5230" />
      <g fill="none" stroke="#0a6c37" strokeWidth="2.4" strokeLinecap="round">
        <path d="M31 27 C26 22 20 20 14 22" />
        <path d="M31.5 26 C28 19 23 16 17 16" />
        <path d="M32 25 C32 18 30 14 26 11" />
        <path d="M33 27 C38 22 44 20 50 22" />
        <path d="M32.5 26 C36 19 41 16 47 16" />
        <path d="M32 25 C32.5 18 34.5 14 38 11" />
      </g>
      <g stroke="#c9a227" strokeWidth="2.6" strokeLinecap="round">
        <path d="M18 44 L44 50" />
        <path d="M46 44 L20 50" />
      </g>
      <circle cx="18" cy="44" r="2" fill="#c9a227" />
      <circle cx="46" cy="44" r="2" fill="#c9a227" />
    </svg>
  )
}

function TeacherAvatar({ interactive, onClick }) {
  const [imgOk, setImgOk] = useState(true)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={`group rounded-full transition-transform duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-400/60 ${
        interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'
      }`}
      title={interactive ? 'دخول المعلمة' : 'الأستاذة بدرية المالكي'}
      aria-label={interactive ? 'دخول المعلمة' : 'الأستاذة بدرية المالكي'}
    >
      {imgOk ? (
        <img
          src="/teacher-avatar.png"
          alt="الأستاذة بدرية المالكي"
          className={`h-20 w-20 rounded-full object-cover shadow-lg shadow-pink-300/50 ring-4 ring-white/80 transition duration-300 sm:h-24 sm:w-24 ${
            interactive ? 'group-hover:ring-pink-300 group-hover:shadow-pink-400/60' : ''
          }`}
          onError={() => setImgOk(false)}
        />
      ) : (
        <div
          className={`grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-rose-300 shadow-lg ring-4 ring-white/80 transition duration-300 sm:h-24 sm:w-24 ${
            interactive ? 'group-hover:ring-pink-300' : ''
          }`}
        >
          <GraduationCap className="h-9 w-9 text-white" strokeWidth={2.2} />
        </div>
      )}
    </button>
  )
}

export default function Header({ isTeacher, onLogin, onLogout }) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-l from-pink-200 via-rose-100 to-pink-200 shadow-lg shadow-pink-200/40">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-white/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-6 sm:px-6">
        {/* اليمين: شعار الوزارة */}
        <div className="flex items-center">
          <MinistryLogo />
        </div>

        {/* المنتصف: العنوان (أسفل الشعارين على الجوال) */}
        <div className="order-last w-full text-center sm:order-none sm:w-auto sm:flex-1">
          <h1 className="text-balance font-display text-xl font-black leading-snug tracking-tight text-rose-800 drop-shadow-sm sm:text-3xl sm:leading-tight">
            أبحاث ومشاريع التربية البدنية - المتوسطة الثانية
          </h1>
          <div className="mt-2 space-y-0.5">
            <p className="text-sm font-bold leading-relaxed text-pink-700">
              إشراف الأستاذة: بدرية المالكي
            </p>
            <p className="text-xs font-medium leading-relaxed text-pink-600/80">
              مديرة المدرسة: شمعة فرهود
            </p>
          </div>
        </div>

        {/* اليسار: صورة المعلمة (زر دخول خفي) */}
        <div className="flex flex-col items-center gap-2.5">
          <TeacherAvatar interactive={!isTeacher} onClick={onLogin} />
          {isTeacher && (
            <button
              onClick={onLogout}
              className="rounded-full bg-white px-5 py-2 font-display text-sm font-bold text-pink-700 shadow-md ring-1 ring-pink-200 transition hover:scale-105 hover:bg-pink-50"
            >
              � تسجيل الخروج
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
