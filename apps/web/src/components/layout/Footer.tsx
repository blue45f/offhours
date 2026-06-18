import { Link } from 'react-router-dom'

import { deskEnabled } from '../../domains/deskcloud/clients'

export function Footer() {
  // DeskCloud 네이티브 페이지 링크는 해당 Desk env 가 설정된 경우에만 노출(미설정 시 깨진 링크 방지)
  const changelogOn = deskEnabled.changelog()
  const communityOn = deskEnabled.community()
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div className="container-page break-keep py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4">
          <div className="col-span-2 sm:col-span-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold serif">
                오
              </span>
              <span className="font-bold text-lg">Offhours</span>
            </div>
            <p className="mt-4 text-sm text-[var(--color-fg-muted)] leading-relaxed">
              비어 있던 그 시간,
              <br />
              가장 멋진 공간이 됩니다.
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
                {/* 인앱 문의 폼 — 외부 지원 센터 새 창 대신 같은 탭에서 접수 */}
                <Link to="/contact" className="underline-offset-4 hover:underline">
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
        <div className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-fg-subtle)]">
          <span>
            © {new Date().getFullYear()} Offhours. All rights reserved. · 데모 서비스 — 사업자
            정보는 정식 오픈 시 게시됩니다
          </span>
          <span aria-hidden>·</span>
          <Link
            to="/design"
            className="underline-offset-4 hover:text-[var(--color-fg-muted)] hover:underline"
          >
            디자인 시스템
          </Link>
        </div>
      </div>
    </footer>
  )
}
