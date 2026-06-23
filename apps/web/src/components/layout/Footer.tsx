import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router-dom'

import { deskEnabled } from '../../domains/deskcloud/clients'

/** "불은 켜져 있다" 모티프 — 마감 후에도 켜진 한 점의 등을 토큰 색으로 호흡시킨다. */
function LightStillOn() {
  const reduce = useReducedMotion()
  return (
    <span aria-hidden className="relative inline-flex size-2 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-[var(--color-accent)]"
        animate={reduce ? { opacity: 0.9 } : { opacity: [0.55, 1, 0.55], scale: [0.9, 1, 0.9] }}
        transition={
          reduce ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <span className="size-1 rounded-full bg-[var(--color-accent-soft)]" />
    </span>
  )
}

export function Footer() {
  // DeskCloud 네이티브 페이지 링크는 해당 Desk env 가 설정된 경우에만 노출(미설정 시 깨진 링크 방지)
  const changelogOn = deskEnabled.changelog()
  const communityOn = deskEnabled.community()
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div className="container-page break-keep py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <div className="group flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold serif transition-transform duration-[var(--duration-base)] ease-[var(--easing-standard)] group-hover:-rotate-6 group-hover:scale-105">
                오
              </span>
              <span className="font-bold text-lg">Offhours</span>
            </div>
            <p className="mt-4 text-sm text-[var(--color-fg-muted)] leading-relaxed">
              비어 있던 그 시간,
              <br />
              가장 멋진 공간이 됩니다.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-fg-subtle)]">
              <LightStillOn />
              마감 후에도, 불은 켜져 있습니다
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">서비스</h2>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/spaces" className="underline-offset-4 hover:underline">
                  공간 둘러보기
                </Link>
              </li>
              <li>
                <Link to="/host" className="underline-offset-4 hover:underline">
                  호스트 되기
                </Link>
              </li>
              <li>
                <Link to="/about" className="underline-offset-4 hover:underline">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="underline-offset-4 hover:underline">
                  수수료 안내
                </Link>
              </li>
              {changelogOn && (
                <li>
                  <Link to="/whats-new" className="underline-offset-4 hover:underline">
                    업데이트 소식
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">고객 지원</h2>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/help" className="underline-offset-4 hover:underline">
                  도움말
                </Link>
              </li>
              <li>
                <Link to="/help/host" className="underline-offset-4 hover:underline">
                  호스트 가이드
                </Link>
              </li>
              <li>
                <Link to="/help/guest" className="underline-offset-4 hover:underline">
                  게스트 가이드
                </Link>
              </li>
              <li>
                {/* 인앱 문의 게시판 — 외부 지원 센터·전화·이메일 대신 같은 탭에서 접수 */}
                <Link to="/support" className="underline-offset-4 hover:underline">
                  문의하기
                </Link>
              </li>
              {communityOn && (
                <li>
                  <Link to="/community" className="underline-offset-4 hover:underline">
                    커뮤니티
                  </Link>
                </li>
              )}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">정책</h2>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/terms" className="underline-offset-4 hover:underline">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="underline-offset-4 hover:underline">
                  개인정보 처리방침
                </Link>
              </li>
              <li>
                <Link to="/cancel-policy" className="underline-offset-4 hover:underline">
                  취소·환불 정책
                </Link>
              </li>
              <li>
                <Link to="/safety" className="underline-offset-4 hover:underline">
                  안전·신뢰
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--color-border)] pt-8 text-[11px] text-[var(--color-fg-subtle)] space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 leading-relaxed">
            <div>
              <p className="font-semibold text-[var(--color-fg-muted)]">상호: 에이치준랩스</p>
              <p>대표자: 김희준 | 개인정보책임자: 김희준</p>
            </div>
            <div>
              <p>사업자등록번호: 355-07-03473</p>
              <p>주소: 서울특별시 송파구 가락로34길 13, 101호(방이동)</p>
            </div>
            <div>
              <p>이메일: blue45f@gmail.com</p>
              <p>전화번호: 010-3873-4197</p>
            </div>
            <div>
              <p>호스팅 서비스: Vercel (Frontend)</p>
              <p>플랫폼 형태: 공간 대여 양면 마켓플레이스</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-4 mt-4">
            <span>
              © {new Date().getFullYear()} Offhours. All rights reserved.
            </span>
            <Link
              to="/sitemap"
              className="underline-offset-4 hover:text-[var(--color-fg-muted)] hover:underline"
            >
              사이트맵
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
