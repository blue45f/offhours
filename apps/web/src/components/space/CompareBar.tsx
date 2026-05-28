import { Link } from 'react-router-dom'
import { ArrowRight, GitCompare, X } from 'lucide-react'

import { COMPARE_MAX, useCompareStore } from '../../store/compare'

export function CompareBar() {
  const slugs = useCompareStore((s) => s.slugs)
  const remove = useCompareStore((s) => s.remove)
  const clear = useCompareStore((s) => s.clear)

  if (slugs.length === 0) return null

  return (
    <div className="fixed bottom-16 md:bottom-6 inset-x-0 z-[var(--z-sticky)] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-[var(--radius-pill)] bg-[var(--color-fg)] text-[var(--color-bg)] pl-4 pr-2 py-2 shadow-[var(--shadow-lg)]">
        <GitCompare size={16} className="text-[var(--color-accent)]" />
        <span className="text-sm font-semibold">
          비교 {slugs.length}
          <span className="opacity-60">/{COMPARE_MAX}</span>
        </span>
        <ul className="hidden md:flex items-center gap-1.5">
          {slugs.map((s) => (
            <li
              key={s}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-white/10 pl-2.5 pr-1 py-0.5 text-xs"
            >
              <span className="max-w-[120px] truncate font-mono">{s}</span>
              <button
                type="button"
                onClick={() => remove(s)}
                aria-label={`${s} 제거`}
                className="size-4 rounded-full hover:bg-white/20 inline-flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => clear()}
          className="text-xs opacity-60 hover:opacity-100"
        >
          모두 지우기
        </button>
        <Link
          to={`/compare?spaces=${slugs.join(',')}`}
          className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-accent)] text-white pl-3.5 pr-3 py-1.5 text-sm font-semibold"
        >
          비교하기 <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
