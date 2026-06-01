import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function AboutPage() {
  useDocumentTitle('서비스 소개')
  return (
    <div className="container-page py-16 md:py-24 max-w-3xl">
      <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)]">
        About Offhours
      </span>
      <h1 className="mt-3 text-display serif">
        영업이 끝난 시간,
        <br />
        가장 빛나는 시간이 되길.
      </h1>
      <p className="mt-6 text-lg text-[var(--color-fg-muted)] leading-relaxed">
        Offhours는 카페·바·레스토랑·갤러리가 영업하지 않는 시간을 파티·스몰웨딩·모임·팝업·촬영 같은
        모임 공간으로 매칭하는 양면시장 플랫폼입니다. 호스트는 부가 수익과 본업 노출을 얻고,
        게스트는 평소엔 만날 수 없던 감성 공간을 합리적으로 통대관할 수 있어요.
      </p>

      <div className="mt-12 space-y-10">
        <Section title="우리가 풀고 싶은 문제">
          상업 부동산의 임대료는 24시간 발생하지만, 매출은 영업시간에만 발생합니다. 주 40시간 이상의
          공간이 데드 캐피털로 남아 있고, 모임 주최자는 천편일률적인 파티룸이나 비싼 웨딩홀에
          의존하고 있어요. Offhours는 이 양쪽의 시간을 정확하게 매칭합니다.
        </Section>

        <Section title="왜 영업 외 시간 전문일까?">
          기존 공간대여 플랫폼은 전업 호스트에 최적화돼 있어, 부업으로 빌려주려는 사장님들의 진입
          장벽이 높습니다. 영업 외 시간만을 다루기 때문에 도구가 훨씬 가볍고, 청소·원상복구·주류
          정책처럼 이 시간에만 필요한 SLA를 정밀하게 설계할 수 있어요.
        </Section>

        <Section title="무엇이 다른가요?">
          호스트의 영업시간만 받으면 휴무일·마감 후 슬롯이 자동 생성되고, 청소 윈도우가 강제
          포함되며, 시간대별 동적 가격이 자동으로 적용됩니다. 게스트는 "조용한 럭셔리" 큐레이션 무드
          사진과 동선 영상으로 공간을 미리 느낄 수 있어요.
        </Section>
      </div>

      <div className="mt-16 rounded-[var(--radius-2xl)] hairline bg-[var(--color-bg-elevated)] p-10 text-center">
        <h2 className="text-title serif">우리와 함께해요</h2>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          공간을 등록하거나, 다음 모임을 위한 공간을 찾아보세요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/host">
            <Button size="lg">호스트 되기</Button>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-title font-semibold">{title}</h2>
      <p className="mt-3 text-[var(--color-fg-muted)] leading-relaxed">{children}</p>
    </div>
  )
}
