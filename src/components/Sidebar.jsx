import { CATEGORIES, TABS } from '../constants'

export default function Sidebar({ tab, filter, onFilter, counts, total }) {
  if (tab === 'strategies') {
    return (
      <aside className="rounded-3xl border border-pink-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
        <h3 className="font-display text-lg font-extrabold text-pink-800">
          {TABS.strategies.emoji} الاستراتيجيات
        </h3>
        <div className="mt-4 rounded-2xl bg-purple-50 p-4 text-sm leading-relaxed text-purple-800 ring-1 ring-purple-100">
          <p className="font-bold">🔒 قسم خاص بالمعلمة</p>
          <p className="mt-1.5 text-purple-700/90">
            هذا القسم مخصص لعرض استراتيجيات التدريس التي تنشرها الأستاذة، وهو
            للقراءة فقط للطلاب والزوار.
          </p>
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-pink-500">
          {total} استراتيجية منشورة
        </p>
      </aside>
    )
  }

  const categories = CATEGORIES[tab] || []

  return (
    <aside className="rounded-3xl border border-pink-100 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
      <h3 className="font-display text-lg font-extrabold text-pink-800">
        📂 تصنيفات {TABS[tab].label}
      </h3>
      <ul className="mt-4 space-y-1.5">
        <li>
          <button
            onClick={() => onFilter('all')}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              filter === 'all'
                ? 'bg-gradient-to-l from-pink-400 to-rose-300 text-white shadow-md shadow-pink-200/60'
                : 'text-pink-900/80 hover:-translate-x-1 hover:bg-pink-50 hover:shadow-sm'
            }`}
          >
            <span>✨ الكل</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                filter === 'all' ? 'bg-white/25' : 'bg-pink-100 text-pink-600'
              }`}
            >
              {total}
            </span>
          </button>
        </li>
        {categories.map((cat) => {
          const active = filter === cat.id
          const count = counts[cat.id] || 0
          return (
            <li key={cat.id}>
              <button
                onClick={() => onFilter(cat.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-l from-pink-400 to-rose-300 text-white shadow-md shadow-pink-200/60'
                    : 'text-pink-900/80 hover:-translate-x-1 hover:bg-pink-50 hover:shadow-sm'
                }`}
              >
                <span>
                  {cat.icon} {cat.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active ? 'bg-white/25' : 'bg-pink-100 text-pink-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
