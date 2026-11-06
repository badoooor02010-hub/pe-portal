import { Dumbbell, Lightbulb, Medal } from 'lucide-react'
import { TABS } from '../constants'

const ICONS = {
  grade2: Dumbbell,
  grade3: Medal,
  strategies: Lightbulb,
}

const tabs = [TABS.grade2, TABS.grade3, TABS.strategies]

export default function HexNav({ active, onChange }) {
  return (
    <nav className="mx-auto -mt-2 flex max-w-4xl flex-wrap items-center justify-center gap-5 px-4 py-8 sm:gap-10">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        const Icon = ICONS[tab.id]
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`hex-btn hex-clip group h-36 w-40 sm:h-40 sm:w-48 ${
              isActive ? 'hex-active' : ''
            }`}
            aria-pressed={isActive}
          >
            <span
              className={`hex-clip absolute inset-0 ${
                isActive
                  ? 'bg-gradient-to-br from-pink-300 via-rose-400 to-pink-400'
                  : 'bg-gradient-to-br from-pink-100 via-pink-200 to-rose-200'
              }`}
            />
            <span
              className={`hex-inner hex-clip flex flex-col items-center justify-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-br from-pink-400/95 via-rose-400/95 to-rose-300/95 text-white'
                  : 'bg-white/95 text-pink-800'
              }`}
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-full transition-transform duration-300 group-hover:scale-110 ${
                  isActive
                    ? 'bg-white/25 ring-1 ring-white/50 shadow-inner'
                    : 'bg-pink-50 ring-1 ring-pink-200 shadow-sm'
                }`}
              >
                <Icon
                  className={isActive ? 'text-white' : 'text-pink-500'}
                  size={26}
                  strokeWidth={2.2}
                />
              </span>
              <span className="font-display text-base font-extrabold leading-snug sm:text-lg">
                {tab.label}
              </span>
              <span
                className={`text-[11px] font-semibold leading-none ${
                  isActive ? 'text-pink-100' : 'text-pink-400'
                }`}
              >
                {tab.id === 'strategies' ? 'للمعلمة' : 'أبحاث ومشاريع'}
              </span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}
