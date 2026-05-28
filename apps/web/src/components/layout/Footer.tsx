import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
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
            <h4 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">서비스</h4>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/spaces">공간 둘러보기</Link>
              </li>
              <li>
                <Link to="/host">호스트 되기</Link>
              </li>
              <li>
                <Link to="/about">서비스 소개</Link>
              </li>
              <li>
                <Link to="/pricing">수수료 안내</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">고객 지원</h4>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/help">도움말</Link>
              </li>
              <li>
                <Link to="/help/host">호스트 가이드</Link>
              </li>
              <li>
                <Link to="/help/guest">게스트 가이드</Link>
              </li>
              <li>
                <Link to="/contact">문의하기</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 text-[var(--color-fg)]">정책</h4>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li>
                <Link to="/terms">이용약관</Link>
              </li>
              <li>
                <Link to="/privacy">개인정보 처리방침</Link>
              </li>
              <li>
                <Link to="/cancel-policy">취소·환불 정책</Link>
              </li>
              <li>
                <Link to="/safety">안전·신뢰</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-fg-subtle)]">
          © {new Date().getFullYear()} Offhours. All rights reserved. · 사업자등록번호 000-00-00000
          · 대표 ○○○ · 서울특별시 ○○구 ○○로 0
        </div>
      </div>
    </footer>
  )
}
