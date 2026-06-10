import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * 수수료·정산 공개 안내 — docs/PRODUCT.md §8 정책 요약(호스트 12%·게스트 무료·PG 플랫폼
 * 부담·정산 7/14일·보증금 사전 인증)을 그대로 옮긴 페이지. 숫자를 바꿀 땐 문서와 함께 갱신.
 */
export default function PricingPage() {
  usePageMeta({
    title: '수수료 안내',
    description:
      '호스트 12% 단일 수수료, 게스트는 무료. 결제 PG 비용은 플랫폼이 부담하고, 정산은 이용 완료 후 7·14일에 입금됩니다.',
  })
  return (
    <div className="container-page py-16 md:py-24 max-w-3xl">
      <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)]">
        Pricing
      </span>
      <h1 className="mt-3 text-display serif">
        수수료는 단순하게,
        <br />
        정산은 투명하게.
      </h1>
      <p className="mt-6 text-lg text-[var(--color-fg-muted)] leading-relaxed">
        Offhours의 수수료는 호스트 측 12% 하나뿐입니다. 등록비·월 이용료·노출 비용은 없고,
        카드·간편결제에 드는 PG 비용까지 플랫폼이 부담해요. 게스트는 화면에 표시된 가격이 결제
        금액의 전부입니다.
      </p>

      <section className="mt-12">
        <h2 className="text-headline">수수료 구조</h2>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PlanCard
            name="게스트"
            price="무료"
            caption="예약·결제 수수료 0원"
            lines={['표시된 가격이 결제 금액의 전부', '결제 수수료는 가격에 포함']}
          />
          <PlanCard
            name="호스트"
            price="12%"
            caption="예약 금액 기준 단일 수수료"
            lines={[
              '예약이 성사될 때만 발생',
              '등록비·월 이용료·노출 비용 없음',
              '결제 PG 비용은 플랫폼 부담',
            ]}
          />
        </div>

        <div className="mt-4 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-subtle)] p-6">
          <h3 className="text-sm font-semibold">정산 예시</h3>
          <dl className="mt-3 space-y-2 text-sm tabular-nums">
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-fg-muted)]">예약 금액</dt>
              <dd>500,000원</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-fg-muted)]">플랫폼 수수료 12%</dt>
              <dd>-60,000원</dd>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 font-semibold">
              <dt>호스트 정산액</dt>
              <dd>440,000원</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-headline">12% 안에 다 들어 있어요</h2>
        <ul className="mt-6 space-y-3">
          {[
            '결제 PG 비용 — 카드·간편결제 수수료를 플랫폼이 부담',
            '영업 외 시간 자동 슬롯·캘린더 관리',
            '게스트 본인 인증 + 보증금 카드 사전 인증',
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
      </section>

      <section className="mt-16">
        <h2 className="text-headline">정산은 이렇게 진행돼요</h2>
        <p className="mt-4 text-[var(--color-fg-muted)] leading-relaxed">
          이용이 완료되면 수수료 12%를 차감한 금액이 자동으로 정산돼요. 보증금을 설정한 공간은 카드
          사전 인증 방식이라 실제 결제가 일어나지 않고, 분쟁이 없으면 7일 안에 자동 해제됩니다.
        </p>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] hairline bg-[var(--color-bg-elevated)] px-5 py-3.5">
            <dt className="text-[var(--color-fg-muted)]">부업 호스트</dt>
            <dd className="font-semibold">이용 완료 +7일 입금</dd>
          </div>
          <div className="flex items-center justify-between rounded-[var(--radius-lg)] hairline bg-[var(--color-bg-elevated)] px-5 py-3.5">
            <dt className="text-[var(--color-fg-muted)]">사업자 호스트</dt>
            <dd className="font-semibold">이용 완료 +14일 입금 · 세금계산서 발행</dd>
          </div>
        </dl>
      </section>

      <section className="mt-16">
        <h2 className="text-headline">자주 묻는 질문</h2>
        <div className="mt-6 space-y-8">
          <Faq q="게스트는 정말 수수료가 없나요?">
            네. 화면에 표시된 가격이 결제 금액의 전부예요. 결제 수수료는 가격에 이미 포함돼 있어
            별도로 청구되지 않습니다.
          </Faq>
          <Faq q="정산은 언제 받나요?">
            이용 완료 후 부업 호스트는 7일, 사업자 호스트는 14일(세금계산서 발행) 뒤에 입금돼요.
            예약별 정산 예정일은 호스트 대시보드에서 확인할 수 있습니다.
          </Faq>
          <Faq q="예약이 취소되면 어떻게 되나요?">
            공간마다 호스트가 선택한 유연/일반/엄격 취소 정책이 적용되고, 예약 시점 기준으로 동결돼
            나중에 바뀌지 않아요. 자세한 기준은{' '}
            <Link to="/cancel-policy" className="font-medium text-[var(--color-primary)] underline">
              취소·환불 정책
            </Link>
            에서 확인하세요.
          </Faq>
        </div>
      </section>

      <div className="mt-16 rounded-[var(--radius-2xl)] hairline bg-[var(--color-bg-elevated)] p-10 text-center">
        <h2 className="text-title serif">비어 있던 시간이 얼마가 되는지 확인해 보세요</h2>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          호스트 페이지의 수익 시뮬레이터로 우리 공간의 예상 순수입을 바로 계산해 볼 수 있어요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/host">
            <Button size="lg" trailing={<ArrowRight size={16} />}>
              호스트 시작하기
            </Button>
          </Link>
          <Link to="/spaces">
            <Button size="lg" variant="secondary">
              공간 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  name,
  price,
  caption,
  lines,
}: {
  name: string
  price: string
  caption: string
  lines: string[]
}) {
  return (
    <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6">
      <h3 className="text-sm font-semibold text-[var(--color-fg-muted)]">{name}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold serif">{price}</span>
        <span className="text-xs text-[var(--color-fg-muted)]">{caption}</span>
      </div>
      <ul className="mt-4 space-y-2 text-sm text-[var(--color-fg-muted)]">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check size={14} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
            {line}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{q}</h3>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">{children}</p>
    </div>
  )
}
