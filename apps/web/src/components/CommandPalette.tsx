import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as RDialog from '@radix-ui/react-dialog'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'

import { useIsAdmin, useIsAuthed, useIsHost } from '../store/auth'
import { cn } from '../utils/cn'
import { COMMAND_PALETTE_OPEN_EVENT } from './commandPaletteEvents'

type Command = {
  id: string
  label: string
  hint?: string
  group: string
  keywords?: string
  run: (navigate: ReturnType<typeof useNavigate>) => void
}

const go =
  (path: string) =>
  (navigate: ReturnType<typeof useNavigate>): void => {
    navigate(path)
  }

/**
 * ⌘K / Ctrl+K 글로벌 명령 팔레트 — 양면시장 offhours 의 라우트가 많아(공개·내계정·호스트·관리자)
 * 헤더/푸터 선형 네비만으로는 이동 비용이 컸다. resume/PromptMarket 형제 앱의 ⌘K 패턴을 이식하되
 * cmdk 의존성 없이 Radix Dialog + 자체 키보드 네비로 구현. 권한별로 보이는 명령이 달라진다.
 */
export function CommandPalette() {
  const navigate = useNavigate()
  const isAuthed = useIsAuthed()
  const isHost = useIsHost()
  const isAdmin = useIsAdmin()

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const openPalette = useCallback(() => {
    setQuery('')
    setActive(0)
    setOpen(true)
  }, [])

  const setPaletteOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        openPalette()
        return
      }
      setOpen(false)
    },
    [openPalette]
  )

  // ⌘K / Ctrl+K 로 토글. 입력 필드 포커스 중에도 동작하도록 전역에서 가로챈다.
  // 헤더 검색 버튼은 OPEN_EVENT 를 디스패치해 같은 팔레트를 연다(컴포넌트 결합 없이).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) setOpen(false)
        else openPalette()
      }
    }
    const onOpen = () => openPalette()
    window.addEventListener('keydown', onKey)
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpen)
    }
  }, [open, openPalette])

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: 'home', label: '홈', group: '탐색', keywords: 'home main', run: go('/') },
      {
        id: 'spaces',
        label: '공간 둘러보기',
        group: '탐색',
        keywords: 'spaces browse 공간',
        run: go('/spaces'),
      },
      {
        id: 'compare',
        label: '비교함',
        group: '탐색',
        keywords: 'compare 비교',
        run: go('/compare'),
      },
      {
        id: 'host-landing',
        label: '호스트 되기',
        group: '탐색',
        keywords: 'host 등록 안내',
        run: go('/host'),
      },
      {
        id: 'about',
        label: '서비스 소개',
        group: '탐색',
        keywords: 'about 소개',
        run: go('/about'),
      },
    ]

    if (isAuthed) {
      list.push(
        {
          id: 'reservations',
          label: '내 예약',
          group: '내 계정',
          keywords: 'reservations booking 예약',
          run: go('/me/reservations'),
        },
        {
          id: 'favorites',
          label: '즐겨찾기',
          group: '내 계정',
          keywords: 'favorites 찜',
          run: go('/favorites'),
        },
        {
          id: 'collections',
          label: '컬렉션',
          group: '내 계정',
          keywords: 'collections 모음',
          run: go('/collections'),
        },
        {
          id: 'notifications',
          label: '알림',
          group: '내 계정',
          keywords: 'notifications 알림',
          run: go('/notifications'),
        },
        {
          id: 'chat',
          label: '채팅',
          group: '내 계정',
          keywords: 'chat message 메시지',
          run: go('/chat'),
        },
        {
          id: 'me',
          label: '내 정보',
          group: '내 계정',
          keywords: 'profile 프로필 me',
          run: go('/me'),
        },
        {
          id: 'logout',
          label: '로그아웃',
          group: '내 계정',
          keywords: 'logout signout',
          run: go('/logout'),
        }
      )
    } else {
      list.push(
        {
          id: 'login',
          label: '로그인',
          group: '내 계정',
          keywords: 'login signin 로그인',
          run: go('/login'),
        },
        {
          id: 'signup',
          label: '회원가입',
          group: '내 계정',
          keywords: 'signup register 가입',
          run: go('/signup'),
        }
      )
    }

    if (isHost) {
      list.push(
        {
          id: 'host-dashboard',
          label: '호스트 대시보드',
          group: '호스트',
          keywords: 'host dashboard',
          run: go('/host/dashboard'),
        },
        {
          id: 'host-spaces',
          label: '내 공간 관리',
          group: '호스트',
          keywords: 'host spaces',
          run: go('/host/spaces'),
        },
        {
          id: 'host-new',
          label: '공간 등록',
          group: '호스트',
          keywords: 'host new space 등록',
          run: go('/host/spaces/new'),
        },
        {
          id: 'host-reservations',
          label: '예약 관리',
          group: '호스트',
          keywords: 'host reservations',
          run: go('/host/reservations'),
        },
        {
          id: 'host-calendar',
          label: '캘린더',
          group: '호스트',
          keywords: 'host calendar 일정',
          run: go('/host/calendar'),
        },
        {
          id: 'host-reviews',
          label: '리뷰 관리',
          group: '호스트',
          keywords: 'host reviews 리뷰',
          run: go('/host/reviews'),
        }
      )
    }

    if (isAdmin) {
      list.push(
        {
          id: 'admin',
          label: '관리자 대시보드',
          group: '관리자',
          keywords: 'admin dashboard',
          run: go('/admin'),
        },
        {
          id: 'admin-users',
          label: '사용자 관리',
          group: '관리자',
          keywords: 'admin users 사용자',
          run: go('/admin/users'),
        },
        {
          id: 'admin-spaces',
          label: '공간 관리',
          group: '관리자',
          keywords: 'admin spaces',
          run: go('/admin/spaces'),
        },
        {
          id: 'admin-disputes',
          label: '분쟁 관리',
          group: '관리자',
          keywords: 'admin disputes 분쟁',
          run: go('/admin/disputes'),
        },
        {
          id: 'admin-reports',
          label: '신고 관리',
          group: '관리자',
          keywords: 'admin reports 신고',
          run: go('/admin/reports'),
        }
      )
    }

    return list
  }, [isAuthed, isHost, isAdmin])

  const trimmed = query.trim()
  const filtered = useMemo<Command[]>(() => {
    const base = trimmed
      ? commands.filter((c) => {
          const hay = `${c.label} ${c.keywords ?? ''}`.toLowerCase()
          return hay.includes(trimmed.toLowerCase())
        })
      : commands

    if (!trimmed) return base

    // 검색어가 있으면 "공간 검색" 액션을 항상 최상단에 둔다(자유 입력 → /spaces?q=).
    const search: Command = {
      id: 'search',
      label: `‘${trimmed}’ 공간 검색`,
      hint: '스마트 검색',
      group: '검색',
      run: (nav) => nav(`/spaces?q=${encodeURIComponent(trimmed)}`),
    }
    return [search, ...base]
  }, [commands, trimmed])

  const safeActive = filtered.length ? Math.min(active, filtered.length - 1) : 0

  const runActive = () => {
    const cmd = filtered[safeActive]
    if (!cmd) return
    setOpen(false)
    cmd.run(navigate)
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      runActive()
    }
  }

  // 활성 항목을 뷰포트 안으로 스크롤.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${safeActive}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [safeActive])

  const activeId = filtered[safeActive] ? `cmdk-opt-${filtered[safeActive].id}` : undefined

  return (
    <RDialog.Root open={open} onOpenChange={setPaletteOpen}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-[var(--color-overlay)] backdrop-blur-sm data-[state=open]:animate-[fadeIn_var(--duration-base)_var(--easing-standard)]" />
        <RDialog.Content
          aria-label="명령 팔레트"
          className="fixed left-1/2 top-[12vh] z-[var(--z-modal,60)] w-[min(92vw,560px)] -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-lg)] data-[state=open]:animate-[fadeIn_var(--duration-base)_var(--easing-standard)]"
          onOpenAutoFocus={(e) => {
            // 기본 포커스(첫 버튼) 대신 검색 입력에 포커스.
            e.preventDefault()
          }}
        >
          <RDialog.Title className="sr-only">명령 팔레트</RDialog.Title>
          <RDialog.Description className="sr-only">
            검색하거나 이동할 곳을 입력하세요. 위아래 화살표로 이동, Enter로 선택, Esc로 닫기.
          </RDialog.Description>

          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4">
            <Search aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-fg-muted)]" />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls="cmdk-list"
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              aria-label="명령 팔레트 검색"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder="검색하거나 이동할 곳을 입력하세요…"
              className="h-12 w-full bg-transparent text-[0.95rem] text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-muted)]"
            />
          </div>

          <ul
            ref={listRef}
            id="cmdk-list"
            role="listbox"
            className="max-h-[52vh] overflow-y-auto p-2"
          >
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--color-fg-muted)]">
                일치하는 결과가 없어요
              </li>
            ) : (
              filtered.map((cmd, i) => {
                const selected = i === safeActive
                const prev = filtered[i - 1]
                const showGroup = !prev || prev.group !== cmd.group
                return (
                  <li key={cmd.id}>
                    {showGroup && (
                      <div className="px-3 pb-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
                        {cmd.group}
                      </div>
                    )}
                    <button
                      type="button"
                      id={`cmdk-opt-${cmd.id}`}
                      role="option"
                      aria-selected={selected}
                      data-index={i}
                      onMouseMove={() => setActive(i)}
                      onClick={runActive}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors',
                        selected
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-fg)]'
                          : 'text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {cmd.label}
                        {cmd.hint && (
                          <span className="text-[0.7rem] text-[var(--color-fg-muted)]">
                            {cmd.hint}
                          </span>
                        )}
                      </span>
                      {selected && (
                        <CornerDownLeft
                          aria-hidden
                          className="h-3.5 w-3.5 text-[var(--color-fg-muted)]"
                        />
                      )}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}
