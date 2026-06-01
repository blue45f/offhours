import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { RevenueSimulator } from '../components/host/RevenueSimulator'
import { useIsHost } from '../store/auth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function HostLandingPage() {
  const isHost = useIsHost()
  useDocumentTitle('호스트 되기')
  return (
    <div className="bg-[var(--color-bg)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--color-primary-soft)]/50 via-transparent to-transparent" />
        <div className="container-page pt-16 pb-12 md:pt-24 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
              <Sparkles size={12} /> For Hosts
            </span>
            <h1 className="mt-5 text-display serif">
              하루 중 비어 있던 짜투리 시간,
              <br />
              그대로 추가 수입이 됩니다.
            </h1>
            <p className="mt-5 text-lg text-[var(--color-fg-muted)] leading-relaxed max-w-xl">
              임대료는 24시간 나가는데 매출은 영업시간에만. 휴무일과 마감 후 비는 시간을
              파티·모임·촬영 공간으로 빌려주면,{' '}
              <strong className="text-[var(--color-fg)]">추가 비용 거의 없이</strong> 순수익이
              쌓여요. 슬롯 생성·청소·정산은 플랫폼이 자동 처리합니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Stat label="첫 예약까지" value="평균 48시간" />
              <Stat label="플랫폼 수수료" value="12%" />
              <Stat label="정산 주기" value="7·14일 선택" />
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to={isHost ? '/host/dashboard' : '/signup?as=host'}>
                <Button size="xl">{isHost ? '대시보드로 이동' : '호스트 시작하기'}</Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <RevenueSimulator />
          </motion.div>
        </div>
      </section>

      <section className="container-page py-16 md:py-24">
        <h2 className="text-headline mb-10">호스트 가입은 이렇게 진행돼요</h2>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { n: 1, title: '가입·인증', body: '이메일로 가입하고 사업자등록증을 인증합니다.' },
            { n: 2, title: '공간 등록', body: '영업시간·사진·룰만 입력하면 슬롯이 자동 생성돼요.' },
            {
              n: 3,
              title: '검토·게시',
              body: '24시간 이내 검토 후 게시. 곧 첫 예약을 받게 됩니다.',
            },
            { n: 4, title: '운영·정산', body: '청소 도우미·정산은 플랫폼이 자동 처리합니다.' },
          ].map((s) => (
            <li
              key={s.n}
              className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6"
            >
              <div className="text-xs font-bold text-[var(--color-primary)] mb-2">STEP {s.n}</div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[var(--color-bg-subtle)] py-16 md:py-24">
        <div className="container-page max-w-3xl">
          <h2 className="text-headline mb-8">호스트 혜택</h2>
          <ul className="space-y-3">
            {[
              '영업 외 시간 자동 슬롯 — 캘린더 관리 부담 zero',
              '청소 SLA + 제휴 업체 자동 매칭(추가 결제)',
              '주류·식자재 정책 토글 — 법규 가이드 자동 안내',
              '동적 가격 룰 — 휴무일 < 야간 < 주말 새벽 자동',
              '게스트 본인 인증 + 보증금 카드 사전 인증',
              '책임보험 파트너십(가입 호스트 보장 뱃지)',
              '카카오 알림톡 자동 발송',
              '월별 수익 리포트 + 수요 예측',
            ].map((line) => (
              <li key={line} className="flex items-start gap-3 text-[var(--color-fg)]">
                <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shrink-0">
                  <Check size={12} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[var(--color-fg-muted)]">{label}</span>
      <span className="font-semibold text-[var(--color-fg)]">{value}</span>
    </span>
  )
}
