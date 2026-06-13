import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Compass, Moon, Sparkles } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function AboutPage() {
  useDocumentTitle('서비스 소개')
  return (
    <div>
      <AboutHero />

      <div className="container-page max-w-3xl pb-20 md:pb-28">
        <section className="mt-16 space-y-10 md:mt-20">
          <Section title="우리가 풀고 싶은 문제">
            상업 부동산의 임대료는 24시간 발생하지만, 매출은 영업시간에만 발생합니다. 주 40시간
            이상의 공간이 데드 캐피털로 남아 있고, 모임 주최자는 천편일률적인 파티룸이나 비싼
            웨딩홀에 의존하고 있어요. Offhours는 이 양쪽의 시간을 정확하게 매칭합니다.
          </Section>

          <Section title="왜 영업 외 시간 전문일까?">
            기존 공간대여 플랫폼은 전업 호스트에 최적화돼 있어, 부업으로 빌려주려는 사장님들의 진입
            장벽이 높습니다. 영업 외 시간만을 다루기 때문에 도구가 훨씬 가볍고, 청소·원상복구·주류
            정책처럼 이 시간에만 필요한 SLA를 정밀하게 설계할 수 있어요.
          </Section>

          <Section title="무엇이 다른가요?">
            호스트의 영업시간만 받으면 휴무일·마감 후 슬롯이 자동 생성되고, 청소 윈도우가 강제
            포함되며, 시간대별 동적 가격이 자동으로 적용됩니다. 게스트는 &ldquo;조용한 럭셔리&rdquo;
            큐레이션 무드 사진과 동선 영상으로 공간을 미리 느낄 수 있어요.
          </Section>
        </section>

        <section className="mt-16 md:mt-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Principles
          </span>
          <h2 className="mt-2 text-headline">우리가 지키는 원칙</h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-7"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Icon size={18} />
                </span>
                <h3 className="text-title mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 md:mt-20">
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
            How it works
          </span>
          <h2 className="mt-2 text-headline">시간이 매출이 되기까지</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span className="serif mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-fg)] text-sm font-bold text-[var(--color-bg)]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 rounded-[var(--radius-2xl)] hairline bg-[var(--color-bg-elevated)] p-10 text-center shadow-[var(--shadow-sm)] md:mt-20">
          <h2 className="text-title serif">우리와 함께해요</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-fg-muted)]">
            공간을 등록하거나, 다음 모임을 위한 공간을 찾아보세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/host">
              <Button size="lg" trailing={<ArrowRight size={16} />}>
                호스트 되기
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
    </div>
  )
}

const PRINCIPLES = [
  {
    icon: Moon,
    title: '영업 외 시간에만 집중',
    body: '본업을 방해하지 않는 시간만 다룹니다. 영업시간만 입력하면 비는 시간이 자동으로 채워져요.',
  },
  {
    icon: Clock,
    title: '청소·원상복구는 기본값',
    body: '예약 종료 뒤 청소 윈도우가 강제로 포함돼, 다음 영업 준비까지 자연스럽게 이어집니다.',
  },
  {
    icon: Sparkles,
    title: '조용한 럭셔리 큐레이션',
    body: '과장 없는 무드 사진과 동선 영상으로 공간의 분위기를 있는 그대로 전합니다.',
  },
  {
    icon: Compass,
    title: '명확한 정책, 사전 합의',
    body: '주류·케이터링·취소 규칙을 예약 전에 분명히 보여드려요. 현장에서의 분쟁을 줄입니다.',
  },
]

const STEPS = [
  {
    title: '호스트가 영업시간을 등록',
    body: '평소 영업시간만 입력하면 휴무일과 마감 후 시간이 예약 가능한 슬롯으로 자동 전환됩니다.',
  },
  {
    title: '게스트가 시간 단위로 통대관',
    body: '파티·스몰웨딩·워크샵·촬영 등 목적에 맞는 공간을 찾아 필요한 시간만큼 통째로 빌립니다.',
  },
  {
    title: '이용 후 자동 정산',
    body: '이용이 끝나면 청소 윈도우를 거쳐 정산이 진행되고, 정해진 일정에 맞춰 호스트에게 입금돼요.',
  },
]

function AboutHero() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-subtle) 70%, var(--color-bg-subtle) 100%)',
        }}
      />
      <div className="container-page max-w-3xl pt-16 pb-12 md:pt-24 md:pb-16">
        <span className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] hairline bg-[var(--color-bg-elevated)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
          <Moon size={13} />
          About Offhours
        </span>
        <h1 className="mt-6 text-display serif leading-[1.1]">
          영업이 끝난 시간,
          <br />
          가장 빛나는 시간이 되길.
        </h1>
        <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-[var(--color-fg-muted)]">
          Offhours는 카페·바·레스토랑·갤러리가 영업하지 않는 시간을 파티·스몰웨딩·모임·팝업·촬영
          같은 모임 공간으로 매칭하는 양면시장 플랫폼입니다. 호스트는 부가 수익과 본업 노출을 얻고,
          게스트는 평소엔 만날 수 없던 감성 공간을 합리적으로 통대관할 수 있어요.
        </p>
      </div>
    </section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-title font-semibold">{title}</h2>
      <p className="mt-3 leading-relaxed text-[var(--color-fg-muted)]">{children}</p>
    </div>
  )
}
