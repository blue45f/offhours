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

// use case 별 고유 hue (OKLCH 색상환). 정보 나열식 동일 카드 대신 시나리오별 색을 부여.
const HUE: Record<UseCase, number> = {
  BIRTHDAY: 25,
  WEDDING_SMALL: 350,
  TEAM_BUILDING: 45,
  CORPORATE_WORKSHOP: 255,
  GATHERING: 130,
  BABYSHOWER: 320,
  CLASS: 200,
  NETWORKING: 280,
  PHOTOSHOOT: 80,
  FILMING: 230,
  POPUP_EXHIBIT: 10,
  REHEARSAL: 160,
}

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
          const h = HUE[key]
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
                className="group relative flex h-full flex-col items-start gap-2 overflow-hidden rounded-[var(--radius-xl)] p-4 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
                style={{
                  background: `linear-gradient(150deg, oklch(0.96 0.04 ${h}), oklch(0.93 0.07 ${h}))`,
                  border: `1px solid oklch(0.85 0.06 ${h})`,
                }}
              >
                {/* 우하단 발광 블롭 */}
                <span
                  aria-hidden
                  className="absolute -bottom-6 -right-6 size-20 rounded-full opacity-50 blur-xl transition-opacity group-hover:opacity-80"
                  style={{ background: `oklch(0.8 0.13 ${h})` }}
                />
                <span
                  aria-hidden
                  className="relative inline-flex size-11 items-center justify-center rounded-full text-2xl shadow-[var(--shadow-sm)] transition-transform group-hover:scale-110"
                  style={{ background: `oklch(0.99 0.01 ${h})` }}
                >
                  {meta.emoji}
                </span>
                <div className="relative text-left">
                  <div className="font-semibold text-sm" style={{ color: `oklch(0.35 0.09 ${h})` }}>
                    {meta.label}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: `oklch(0.45 0.06 ${h})` }}>
                    {meta.hint}
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
