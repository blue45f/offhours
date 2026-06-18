/**
 * DeskCloud 위젯 마운트 — 앱 셸(AppLayout)에서 한 번만 렌더되는 통합 진입점.
 * ──────────────────────────────────────────────────────────────────────────
 * 각 Desk 위젯은 해당 env URL(VITE_*_URL)이 설정된 경우에만 렌더됩니다(기본 비활성).
 * SurveyDesk FeedbackWidget(이미 통합됨)과 동일한 env 게이트 패턴을 따릅니다.
 *
 * - 유니버설(헤더/셸 상시): ChangelogWidget(벨 런처) · NotificationBell · SearchPalette(⌘/)
 * - 콘텐츠(플로팅 런처 → 다이얼로그): ReviewWidget(후기 벽) · CommunityBoard · MediaUploader/Gallery
 * - 채팅: ChatWidget(자체 플로팅 런처)
 *
 * ⌘K 충돌 회피: offhours 에는 이미 자체 CommandPalette(⌘K)가 있으므로,
 * SearchDesk 팔레트는 `mod+/` 핫키로 마운트합니다(비충돌).
 *
 * 멤버 식별: 알림/커뮤니티/채팅은 로그인 사용자(useMe) id 를 recipientId/memberId 로 씁니다.
 * 로그인하지 않은 경우 멤버 식별이 필요한 위젯(알림/채팅)은 렌더하지 않습니다(콘텐츠 위젯은 익명 읽기 허용).
 */
import { useEffect, useId, useState, type ReactElement, type ReactNode } from 'react'

import { useMe } from '../../store/auth'

import { ChangelogWidget } from './changelog/ChangelogWidget'
import { ChatWidget } from './chat/ChatWidget'
import { CommunityBoard } from './community/CommunityBoard'
import { MediaGallery, MediaUploader } from './media/MediaWidgets'
import { NotificationBell } from './notify/NotificationBell'
import { ReviewForm, TestimonialWall } from './review/ReviewWidgets'
import { SearchPalette } from './search/SearchPalette'

const env = import.meta.env

const pk = (key: string): string => env[key as keyof ImportMetaEnv] ?? 'pk_demo'

/**
 * 플로팅 런처 스타일 — offhours 토큰(올리브 primary)에 정렬. hover/focus-visible 상태와
 * reduced-motion 대안을 갖춘다. 위젯 셸 한 번만 주입(다른 벤더 위젯의 ensureStyles 패턴).
 */
const LAUNCHER_STYLE_ID = 'deskcloud-launcher-styles'
const LAUNCHER_CSS = `
.dc-launcher{position:fixed;right:20px;z-index:2147482000;width:48px;height:48px;
  display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:0;
  background:var(--color-primary,#5a6f4f);color:var(--color-primary-fg,#fff);cursor:pointer;
  box-shadow:0 1px 2px rgba(26,24,20,.08),0 12px 32px -8px rgba(26,24,20,.24);
  transition:transform .18s cubic-bezier(.22,1,.36,1),background .18s cubic-bezier(.22,1,.36,1),box-shadow .18s cubic-bezier(.22,1,.36,1);}
.dc-launcher:hover{background:var(--color-primary-hover,#4a5f3f);transform:translateY(-1px);
  box-shadow:0 2px 4px rgba(26,24,20,.1),0 16px 40px -8px rgba(26,24,20,.3);}
.dc-launcher:active{transform:translateY(0);}
.dc-launcher:focus-visible{outline:2px solid var(--color-primary,#5a6f4f);outline-offset:3px;}
@media (prefers-reduced-motion:reduce){.dc-launcher{transition:none;}.dc-launcher:hover{transform:none;}}
`

function useLauncherStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined' || document.getElementById(LAUNCHER_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = LAUNCHER_STYLE_ID
    el.textContent = LAUNCHER_CSS
    document.head.appendChild(el)
  }, [])
}

/** offhours 커뮤니티 위젯이 붙는 기본 게시판 슬러그(데모 시드의 'free' 게시판). */
const COMMUNITY_BOARD_SLUG = 'free'
/** 후기 위젯이 모으는 기본 주제 식별자(서비스 전반 후기). */
const REVIEW_SUBJECT_ID = 'offhours'
/** 미디어 위젯이 사용하는 기본 폴더. */
const MEDIA_FOLDER = 'offhours-uploads'

/* ============================ 플로팅 런처 + 다이얼로그 ============================ */

interface FloatingLauncherProps {
  /** 우측 하단 스택에서의 세로 오프셋(px). 여러 런처가 겹치지 않도록 분리. */
  bottom: number
  label: string
  title: string
  icon: ReactElement
  children: ReactNode
}

/**
 * 비파괴적 플로팅 런처: 명확한 페이지가 없는 콘텐츠 위젯(후기/커뮤니티/미디어)을
 * 우측 하단 버튼 → 가벼운 다이얼로그로 노출합니다. react-only · 접근성(role=dialog, Esc, 라벨).
 */
function FloatingLauncher(props: FloatingLauncherProps): ReactElement {
  const { bottom, label, title, icon, children } = props
  const [open, setOpen] = useState(false)
  const titleId = useId()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={label}
        title={label}
        className="dc-launcher"
        style={{ bottom }}
      >
        {icon}
      </button>

      {open ? (
        <div
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147482500,
            background: 'rgba(16,24,40,.42)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            style={{
              width: 'min(440px, 100%)',
              maxHeight: 'min(80vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--color-bg-elevated, #fff)',
              borderRadius: 16,
              border: '1px solid var(--color-border, #d7dae0)',
              boxShadow: '0 1px 2px rgba(16,24,40,.06), 0 18px 48px -12px rgba(16,24,40,.28)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 16px',
                borderBottom: '1px solid var(--color-border, #d7dae0)',
              }}
            >
              <h2 id={titleId} style={{ margin: 0, flex: 1, fontSize: 15, fontWeight: 700 }}>
                {title}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                style={{
                  width: 32,
                  height: 32,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 0,
                  borderRadius: 8,
                  background: 'transparent',
                  color: 'var(--color-fg-muted, #6b7280)',
                  cursor: 'pointer',
                  fontSize: 20,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto' }}>{children}</div>
          </div>
        </div>
      ) : null}
    </>
  )
}

const ReviewIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path
      d="m12 3 2.7 5.5 6 .9-4.35 4.24 1.03 6L12 16.8 6.62 19.6l1.03-6L3.3 9.4l6-.9L12 3Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
)
const CommunityIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <path
      d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H9l-4 4v-4H6.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const MediaIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8.5" cy="9.5" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="m4 17 4.5-4.2a1.6 1.6 0 0 1 2.2 0L15 17"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ================================ 마운트 ================================ */

export function DeskCloudWidgets(): ReactElement {
  const me = useMe()
  const memberId = me?.id
  useLauncherStyles()

  return (
    <>
      {/* ChangelogDesk — 변경 이력 벨 런처(유니버설) */}
      {env.VITE_CHANGELOGDESK_URL && (
        <ChangelogWidget
          publishableKey={pk('VITE_CHANGELOGDESK_PK')}
          endpoint={env.VITE_CHANGELOGDESK_URL}
        />
      )}

      {/* SearchDesk — ⌘/ 커맨드 팔레트(유니버설, 기존 ⌘K CommandPalette 와 비충돌) */}
      {env.VITE_SEARCHDESK_URL && (
        <SearchPalette
          publishableKey={pk('VITE_SEARCHDESK_PK')}
          endpoint={env.VITE_SEARCHDESK_URL}
          hotkey="mod+/"
          placeholder="공간·콘텐츠 검색…"
        />
      )}

      {/* NotifyDesk — 알림 인박스(로그인 사용자 한정) */}
      {env.VITE_NOTIFYDESK_URL && memberId ? (
        <div
          style={{
            position: 'fixed',
            right: 76,
            bottom: 20,
            zIndex: 2147482000,
          }}
        >
          <NotificationBell
            recipientId={memberId}
            publishableKey={pk('VITE_NOTIFYDESK_PK')}
            endpoint={env.VITE_NOTIFYDESK_URL}
          />
        </div>
      ) : null}

      {/* ChatDesk — 채팅 플로팅 위젯(로그인 사용자 한정, 자체 런처) */}
      {env.VITE_CHATDESK_URL && memberId ? (
        <ChatWidget
          publishableKey={pk('VITE_CHATDESK_PK')}
          endpoint={env.VITE_CHATDESK_URL}
          memberId={memberId}
          memberName={me?.name}
        />
      ) : null}

      {/* ReviewDesk — 후기 벽 + 작성(플로팅 런처 → 다이얼로그) */}
      {env.VITE_REVIEWDESK_URL && (
        <FloatingLauncher bottom={140} label="고객 후기" title="고객 후기" icon={<ReviewIcon />}>
          <TestimonialWall
            publishableKey={pk('VITE_REVIEWDESK_PK')}
            endpoint={env.VITE_REVIEWDESK_URL}
          />
          <div style={{ marginTop: 16 }}>
            <ReviewForm
              publishableKey={pk('VITE_REVIEWDESK_PK')}
              endpoint={env.VITE_REVIEWDESK_URL}
              subjectId={REVIEW_SUBJECT_ID}
              subjectLabel="Offhours"
            />
          </div>
        </FloatingLauncher>
      )}

      {/* CommunityDesk — 커뮤니티 게시판(플로팅 런처 → 다이얼로그) */}
      {env.VITE_COMMUNITYDESK_URL && (
        <FloatingLauncher bottom={196} label="커뮤니티" title="커뮤니티" icon={<CommunityIcon />}>
          <CommunityBoard
            boardSlug={COMMUNITY_BOARD_SLUG}
            publishableKey={pk('VITE_COMMUNITYDESK_PK')}
            endpoint={env.VITE_COMMUNITYDESK_URL}
            memberId={memberId}
            memberName={me?.name}
          />
        </FloatingLauncher>
      )}

      {/* MediaDesk — 업로더 + 갤러리(플로팅 런처 → 다이얼로그) */}
      {env.VITE_MEDIADESK_URL && (
        <FloatingLauncher bottom={252} label="미디어" title="미디어" icon={<MediaIcon />}>
          <MediaUploader
            publishableKey={pk('VITE_MEDIADESK_PK')}
            endpoint={env.VITE_MEDIADESK_URL}
            folder={MEDIA_FOLDER}
          />
          <div style={{ marginTop: 16 }}>
            <MediaGallery
              publishableKey={pk('VITE_MEDIADESK_PK')}
              endpoint={env.VITE_MEDIADESK_URL}
              folder={MEDIA_FOLDER}
            />
          </div>
        </FloatingLauncher>
      )}
    </>
  )
}

export default DeskCloudWidgets
