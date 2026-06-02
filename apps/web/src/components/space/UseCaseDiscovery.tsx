import { Link } from 'react-router-dom'
import { USE_CASE_META, type UseCase } from '@offhours/shared'
import { motion } from 'framer-motion'

const ORDER: UseCase[] = [
  'BIRTHDAY',
  'WEDDING_SMALL',
  'TEAM_BUILDING',
  'CORPORATE_WORKSHOP',
  'GATHERING',
  'BABYSHOWER',
  'CLASS',
  'NETWORKING',
  'PHOTOSHOOT',
  'FILMING',
  'POPUP_EXHIBIT',
  'REHEARSAL',
]

export function UseCaseDiscovery() {
  return (
    <section className="container-page py-12 md:py-16">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-accent)]">
            For Your Moment
          </span>
          <h2 className="mt-2 text-headline serif">어떤 모임이세요?</h2>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            "친구 생일 30명"·"사내 워크샵 20명" — 그날의 시나리오로 바로 공간을 찾아보세요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {ORDER.map((key, i) => {
          const meta = USE_CASE_META[key]
          const median = Math.round((meta.typicalCapacity.min + meta.typicalCapacity.max) / 2)
          const num = String(i + 1).padStart(2, '0')
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
            >
              <Link
                to={`/spaces?useCases=${key}&capacity=${median}`}
                className="group flex h-full flex-col items-start gap-2 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-4 transition-all hover:-translate-y-1 hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex w-full items-center justify-between">
                  <span
                    aria-hidden
                    className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-2xl transition-transform group-hover:scale-105"
                  >
                    {meta.emoji}
                  </span>
                  <span className="font-mono text-[11px] tracking-wide text-[var(--color-fg-subtle)]">
                    {num}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
                    {meta.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-fg-muted)]">{meta.hint}</div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
