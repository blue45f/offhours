# Offhours — Design System

> "Quiet Luxury + Korean Restraint."
> 차분하고 절제된 우아함, 여백의 미. 과장 없는 모션, 따뜻한 무채색.

## 1. 디자인 원칙

1. **One Primary, One Accent** — Deep Olive 주색 1개 + Burnt Orange 포인트(≤5%)
2. **Warm Neutrals Only** — 순백/순흑 금지. 아이보리 ~ 따뜻한 검정 톤
3. **Generous Space** — 정보 밀도 낮춤. 한국식 여백
4. **Quiet Motion** — 240ms 기본, 과장 없음
5. **Single Family Typography** — Pretendard, 한글 헤드라인은 Noto Serif KR 선택적
6. **No Default Shadows** — Tonal layering, 모달/팝오버만 그림자 사용
7. **Mobile First, Always** — 320px 베이스, 점진적 확장

## 2. 토큰 — Reference

### 2.1 컬러 (RGB)

```css
/* Reference: Olive scale (primary family) */
--ref-olive-50: #f4f6f1;
--ref-olive-100: #e8eee5;
--ref-olive-200: #cad9ce;
--ref-olive-300: #9cb4a8;
--ref-olive-400: #6e8f7e;
--ref-olive-500: #5a6f4f; /* PRIMARY */
--ref-olive-600: #4a5f3f;
--ref-olive-700: #3a4b32;
--ref-olive-800: #2a3724;
--ref-olive-900: #1a2316;

/* Reference: Burnt Orange (accent) */
--ref-sienna-50: #fff5ee;
--ref-sienna-100: #ffe5d2;
--ref-sienna-300: #dba58c;
--ref-sienna-500: #c97550; /* ACCENT */
--ref-sienna-700: #8b4a2d;

/* Reference: Warm Neutrals */
--ref-cream-50: #faf8f4; /* page background */
--ref-cream-100: #f1eee7;
--ref-cream-200: #e5e0d5;
--ref-cream-300: #c8c1b3;
--ref-cream-400: #a39a88;
--ref-cream-500: #847b6a;
--ref-cream-600: #67604f;
--ref-cream-700: #4d4738;
--ref-cream-800: #312d23;
--ref-cream-900: #1a1814;

/* Reference: Status */
--ref-success: #2f8f5e;
--ref-warning: #c9942e;
--ref-error: #b33a3a;
--ref-info: #3d6f8f;
```

### 2.2 Typography

```css
--ref-font-sans:
  'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--ref-font-serif: 'Noto Serif KR', 'Pretendard', serif; /* 헤드라인 선택 */
--ref-font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;

/* Type scale (fluid) */
--type-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.8125rem); /* 12~13 */
--type-sm: clamp(0.875rem, 0.83rem + 0.2vw, 0.9375rem); /* 14~15 */
--type-base: clamp(1rem, 0.95rem + 0.25vw, 1.0625rem); /* 16~17 */
--type-lg: clamp(1.125rem, 1.05rem + 0.4vw, 1.25rem); /* 18~20 */
--type-xl: clamp(1.375rem, 1.2rem + 0.7vw, 1.625rem); /* 22~26 */
--type-2xl: clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem); /* 28~40 */
--type-3xl: clamp(2.25rem, 1.6rem + 2.6vw, 3.75rem); /* 36~60 */
--type-4xl: clamp(3rem, 2rem + 4vw, 5.25rem); /* 48~84 */

--leading-tight: 1.15;
--leading-snug: 1.3;
--leading-normal: 1.55;
--leading-relaxed: 1.7;

--tracking-tight: -0.02em;
--tracking-normal: 0;
--tracking-wide: 0.04em;
```

### 2.3 Spacing (4px 그리드)

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### 2.4 Radius

```css
--radius-xs: 2px;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px; /* Button */
--radius-xl: 18px; /* Card */
--radius-2xl: 24px; /* Hero */
--radius-pill: 9999px;
```

### 2.5 Shadow

```css
/* Light mode */
--shadow-sm: 0 1px 2px rgba(26, 24, 20, 0.04);
--shadow-md: 0 4px 12px rgba(26, 24, 20, 0.08);
--shadow-lg: 0 12px 28px rgba(26, 24, 20, 0.12);
--shadow-xl: 0 24px 48px rgba(26, 24, 20, 0.16);

/* Dark mode */
--shadow-dark-md: 0 4px 12px rgba(0, 0, 0, 0.35);
--shadow-dark-lg: 0 12px 28px rgba(0, 0, 0, 0.45);
```

### 2.6 Motion

```css
--duration-instant: 0ms;
--duration-fast: 140ms;
--duration-base: 240ms;
--duration-slow: 420ms;

--easing-standard: cubic-bezier(0.2, 0, 0, 1);
--easing-emphasized: cubic-bezier(0.3, 0, 0, 1);
--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 2.7 Z-index

```css
--z-base: 0;
--z-sticky: 100;
--z-overlay: 300;
--z-modal: 400;
--z-popover: 450;
--z-toast: 600;
--z-max: 9999;
```

## 3. 토큰 — Semantic (light/dark)

```css
:root,
.theme-light {
  --color-bg: var(--ref-cream-50);
  --color-bg-elevated: #ffffff;
  --color-bg-subtle: var(--ref-cream-100);
  --color-bg-inverse: var(--ref-cream-900);

  --color-fg: var(--ref-cream-900);
  --color-fg-muted: var(--ref-cream-600);
  --color-fg-subtle: var(--ref-cream-500);
  --color-fg-inverse: var(--ref-cream-50);

  --color-border: var(--ref-cream-200);
  --color-border-strong: var(--ref-cream-300);
  --color-border-subtle: var(--ref-cream-100);

  --color-primary: var(--ref-olive-500);
  --color-primary-hover: var(--ref-olive-600);
  --color-primary-active: var(--ref-olive-700);
  --color-primary-soft: var(--ref-olive-100);
  --color-primary-fg: #ffffff;

  --color-accent: var(--ref-sienna-500);
  --color-accent-soft: var(--ref-sienna-100);

  --color-success: var(--ref-success);
  --color-warning: var(--ref-warning);
  --color-error: var(--ref-error);
  --color-info: var(--ref-info);

  --color-overlay: rgba(26, 24, 20, 0.48);

  --shadow-card: var(--shadow-sm);
  --shadow-popover: var(--shadow-md);
  --shadow-modal: var(--shadow-xl);
}

.theme-dark {
  --color-bg: #15140f;
  --color-bg-elevated: #1f1d17;
  --color-bg-subtle: #1a1813;
  --color-bg-inverse: var(--ref-cream-50);

  --color-fg: var(--ref-cream-50);
  --color-fg-muted: var(--ref-cream-300);
  --color-fg-subtle: var(--ref-cream-400);
  --color-fg-inverse: var(--ref-cream-900);

  --color-border: #2c2920;
  --color-border-strong: #3a3528;
  --color-border-subtle: #221f18;

  --color-primary: #87a07a; /* lifted for dark */
  --color-primary-hover: #9ab18c;
  --color-primary-active: #acbe9f;
  --color-primary-soft: rgba(135, 160, 122, 0.16);
  --color-primary-fg: #15140f;

  --color-accent: #dca284;
  --color-accent-soft: rgba(220, 162, 132, 0.18);

  --color-overlay: rgba(0, 0, 0, 0.6);

  --shadow-card: var(--shadow-dark-md);
  --shadow-popover: var(--shadow-dark-lg);
  --shadow-modal: 0 24px 48px rgba(0, 0, 0, 0.6);
}

@media (prefers-color-scheme: dark) {
  :root:not(.theme-light) {
    color-scheme: dark;
  }
}
```

## 4. 컴포넌트 인벤토리

| 컴포넌트                            | 변형                                                | 용도                                |
| ----------------------------------- | --------------------------------------------------- | ----------------------------------- |
| Button                              | primary / secondary / ghost / outline / destructive | CTA, 보조액션                       |
| IconButton                          | sm / md / lg                                        | 아이콘만                            |
| Link                                | inline / standalone                                 | 텍스트 링크                         |
| Input                               | default / error / success                           | 텍스트 입력                         |
| Textarea                            | default / error                                     | 멀티라인                            |
| Select                              | default                                             | 드롭다운                            |
| Checkbox / Radio / Switch           | —                                                   | 폼 토글                             |
| FormField                           | —                                                   | label + input + helper + error 묶음 |
| DatePicker / TimePicker / DateRange | —                                                   | 예약 입력                           |
| Card                                | default / elevated / interactive                    | 콘텐츠 그룹                         |
| Badge                               | default / soft / outline / dot                      | 라벨                                |
| Chip                                | default / selected                                  | 필터/태그                           |
| Avatar                              | xs / sm / md / lg + initials fallback               | 사용자                              |
| Tabs                                | underline / pill                                    | 탭                                  |
| Dropdown / Menu                     | —                                                   | 메뉴                                |
| Tooltip                             | —                                                   | 도움말                              |
| Toast                               | success / error / info                              | 알림                                |
| Dialog / Modal                      | sm / md / lg / fullscreen                           | 모달                                |
| Sheet / BottomSheet                 | side / bottom                                       | 사이드/바텀 시트                    |
| Drawer                              | left / right                                        | 네비게이션                          |
| Popover                             | —                                                   | 콘텐츠 팝업                         |
| Skeleton                            | text / rect / circle                                | 로딩                                |
| EmptyState                          | —                                                   | 빈 상태                             |
| Stepper                             | —                                                   | 다단계 폼                           |
| Pagination                          | —                                                   | 페이지 이동                         |
| Breadcrumb                          | —                                                   | 경로                                |
| SearchBar                           | hero / inline                                       | 검색                                |
| PriceTag                            | —                                                   | 가격 표시                           |
| RatingStars                         | input / display                                     | 평점                                |
| ImageGallery                        | hero / grid / carousel                              | 공간 사진                           |
| Map                                 | —                                                   | 위치                                |
| Calendar                            | month / week / agenda                               | 슬롯                                |
| TimeSlotGrid                        | —                                                   | 시간 선택                           |

## 5. 컴포넌트 작성 컨벤션

- **forwardRef 필수** — DOM ref 노출
- **Compound 패턴** — `Card.Header / Card.Body / Card.Footer`
- **variant**는 `class-variance-authority` 또는 직접 record 매핑
- **className 머지**는 `cn(clsx, tailwind-merge)`
- **접근성**: 모든 인터랙티브 요소 키보드 내비, aria-\* 적용
- **prefers-reduced-motion** 존중

## 6. 레이아웃 그리드

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;

/* Page padding */
@media (min-width: 320px) {
  --gutter: 16px;
}
@media (min-width: 768px) {
  --gutter: 24px;
}
@media (min-width: 1024px) {
  --gutter: 32px;
}
@media (min-width: 1440px) {
  --gutter: 48px;
}
```

## 7. 브레이크포인트

```
xs:  320px   (소형 모바일)
sm:  390px   (모바일 표준)
md:  768px   (태블릿)
lg:  1024px  (작은 데스크탑)
xl:  1280px  (데스크탑)
2xl: 1536px  (큰 데스크탑)
```

## 8. 모션 가이드

- **Hover**: opacity / background 140ms
- **Press**: scale 0.98 140ms spring
- **Modal/Drawer**: enter 240ms ease-out, exit 200ms ease-in
- **Page transition**: 320ms cross-fade (Framer Motion)
- **List**: stagger 40ms per item, max 8개
- **Skeleton shimmer**: 1.4s linear infinite

## 9. 아이콘

- Lucide React 우선
- 라인 두께 1.5
- 16/20/24px
- 색상은 currentColor

## 10. 이미지

- 공간 사진: 4:3 또는 16:9, JPG/WebP
- 블러 해시 placeholder
- `<picture>` srcset: 480w / 768w / 1280w / 1920w
- 호스트 아바타: 정원 1:1
- 모바일 데이터 절약: `loading="lazy"`

## 11. 다크모드

- `prefers-color-scheme: dark` 자동 감지
- `<html class="theme-light|theme-dark">` 토글
- 라이트/다크 토큰은 동일 컴포넌트 API로 자동 전환

## 12. 접근성 체크리스트

- [ ] 색 대비 4.5:1 이상 (텍스트), 3:1 (UI)
- [ ] 포커스 링 모든 인터랙티브
- [ ] 키보드만으로 모든 액션 가능
- [ ] aria-label / aria-describedby
- [ ] Skip to main content 링크
- [ ] 폼 에러는 텍스트 + 색
- [ ] 모달은 focus trap + Esc

## 13. Hero (HomePage)

North Star "마감 후에도 불은 켜져 있다(The Lights Stay On After Closing)"를 시스템 워밍 팔레트로만
표현하는 타이포그래피 히어로. **금지 사항(절대 재도입 금지)**:

- **글로우 메쉬/블롭 없음** — 보라/초록/주황 radial-gradient blur 블롭 제거. 배경은 크림 톤 레이어링
  (`--color-bg` → `--color-bg-subtle`)과 하단 헤어라인 한 줄로만 구성.
- **그라데이션 텍스트 없음** — `bg-clip-text`+gradient 금지. 회전 명사는 단색 `--color-accent`(sienna)로 강조.
- **오프 팔레트 색 없음** — 강조는 타입 weight/scale + 워밍 액센트로. "불은 켜져 있다" 모티프는 페이지
  스케일 블롭이 아니라 액센트 한 점(`LightStillOn`)을 토큰 색으로 호흡시켜 표현.

UseCaseDiscovery도 시나리오별 per-hue 틴팅·발광 블롭을 제거하고 시스템 기본 envelope(크림 elevated +
hairline) 카드 + mono 인덱스 라벨로 통일했다. 동일 원칙: 색이 아니라 구조와 절제된 워밍 액센트로 위계를 만든다.
