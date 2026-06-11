import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale/ko'
import { ExternalLink, RefreshCw } from 'lucide-react'

import {
  usePolicy,
  policyExternalUrl,
  type PolicySlug,
  type PublicPolicy,
} from '../features/policies/api'
import { parsePolicyBody } from '../features/policies/policyBody'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { usePageMeta } from '../hooks/usePageMeta'

const POLICY_META: Record<PolicySlug, { title: string; description: string }> = {
  'terms-of-service': {
    title: '이용약관',
    description: 'Offhours 서비스 이용 조건, 이용자와 운영자의 권리·의무·책임 범위를 안내합니다.',
  },
  'privacy-policy': {
    title: '개인정보 처리방침',
    description:
      'Offhours가 수집하는 개인정보 항목, 이용 목적, 보관 기간과 보호 조치를 안내합니다.',
  },
  'refund-policy': {
    title: '취소·환불 정책',
    description: '예약 취소와 환불 기준, 공간별 취소 정책과 보증금 처리 원칙을 안내합니다.',
  },
}

/**
 * 약관·정책 내부 열람 페이지 — TermsDesk 공개 API(JSON)를 직접 렌더해 외부 리다이렉트 없이
 * 서비스 안에서 읽게 한다. 하단에 versionLabel·contentHash·시행일을 표기해 게시본의
 * 무결성(신뢰 표면)을 드러내고, 로드 실패 시에만 TermsDesk 원문 링크로 폴백한다.
 */
export default function PolicyPage({ slug }: { slug: PolicySlug }) {
  const meta = POLICY_META[slug]
  usePageMeta(meta)
  const { data, isLoading, isError, refetch, isRefetching } = usePolicy(slug)

  return (
    <div className="container-page py-16 md:py-24 max-w-3xl">
      <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)]">
        Policy
      </span>
      <h1 className="mt-3 text-display serif">{data?.name ?? meta.title}</h1>

      {isLoading && <PolicySkeleton />}
      {isError && (
        <PolicyErrorCard
          slug={slug}
          title={meta.title}
          retrying={isRefetching}
          onRetry={() => void refetch()}
        />
      )}
      {data && <PolicyArticle policy={data} slug={slug} />}
    </div>
  )
}

function PolicyArticle({ policy, slug }: { policy: PublicPolicy; slug: PolicySlug }) {
  const blocks = parsePolicyBody(policy.body)

  return (
    <>
      <article className="mt-10">
        {blocks.map((block, i) => (
          <section key={i} className={i > 0 ? 'mt-8' : undefined}>
            {block.heading && <h2 className="text-title serif">{block.heading}</h2>}
            {block.text && (
              <p
                className={`whitespace-pre-line leading-relaxed text-[var(--color-fg-muted)] ${
                  block.heading ? 'mt-2' : ''
                }`}
              >
                {block.text}
              </p>
            )}
          </section>
        ))}
      </article>

      <footer className="mt-12 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-subtle)] p-6 text-sm">
        <h2 className="font-semibold">게시본 정보</h2>
        <dl className="mt-3 space-y-1.5 text-[var(--color-fg-muted)]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <dt>버전</dt>
            <dd className="font-medium text-[var(--color-fg)]">{policy.versionLabel}</dd>
          </div>
          {policy.effectiveAt && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4">
              <dt>시행일</dt>
              <dd className="font-medium text-[var(--color-fg)]">
                {format(parseISO(policy.effectiveAt), 'yyyy년 M월 d일', { locale: ko })}
              </dd>
            </div>
          )}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <dt>콘텐츠 해시</dt>
            <dd className="font-mono text-xs" title={policy.contentHash}>
              {policy.contentHash.slice(0, 12)}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-[var(--color-fg-subtle)]">
          TermsDesk 공개 게시본에서 버전과 콘텐츠 해시를 대조할 수 있습니다.{' '}
          <a
            href={policyExternalUrl(slug)}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[var(--color-fg)]"
          >
            원문에서 검증하기
          </a>
        </p>
      </footer>
    </>
  )
}

function PolicySkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-full" />
          <Skeleton variant="text" className="w-2/3" />
        </div>
      ))}
    </div>
  )
}

function PolicyErrorCard({
  slug,
  title,
  retrying,
  onRetry,
}: {
  slug: PolicySlug
  title: string
  retrying: boolean
  onRetry: () => void
}) {
  return (
    <div className="mt-10 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-8 text-center">
      <h2 className="text-title serif">문서를 불러오지 못했어요</h2>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        네트워크 상태를 확인하고 다시 시도하거나, 게시 원문에서 바로 확인할 수 있어요.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={onRetry} loading={retrying} leading={<RefreshCw size={16} />}>
          다시 시도
        </Button>
        <a href={policyExternalUrl(slug)} target="_blank" rel="noreferrer">
          <Button variant="secondary" trailing={<ExternalLink size={16} />}>
            TermsDesk에서 {title} 보기
          </Button>
        </a>
      </div>
    </div>
  )
}
