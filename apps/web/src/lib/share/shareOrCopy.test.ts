import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { shareOrCopy } from './shareOrCopy'

describe('shareOrCopy', () => {
  const originalShare = navigator.share
  const originalCanShare = navigator.canShare
  const originalClipboard = navigator.clipboard

  function setNav(value: Partial<Navigator>) {
    for (const [key, val] of Object.entries(value)) {
      Object.defineProperty(navigator, key, { value: val, configurable: true, writable: true })
    }
  }

  beforeEach(() => {
    setNav({ share: undefined, canShare: undefined, clipboard: undefined })
  })

  afterEach(() => {
    setNav({
      share: originalShare,
      canShare: originalCanShare,
      clipboard: originalClipboard,
    })
    vi.restoreAllMocks()
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNav({ share })

    const result = await shareOrCopy({ title: 'T', url: 'https://offhours.test/x' })

    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'T', url: 'https://offhours.test/x' })
    )
  })

  it('treats an AbortError (user closed the sheet) as dismissed without copying', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ share, clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({ url: 'https://offhours.test/x' })

    expect(result).toBe('dismissed')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to clipboard when the Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({
      title: '오프아워스',
      text: '공유',
      url: 'https://offhours.test/x',
    })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('오프아워스 — 공유 — https://offhours.test/x')
  })

  it('falls back to clipboard when a non-abort share error is thrown', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'))
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ share, clipboard: { writeText } as unknown as Clipboard })

    const result = await shareOrCopy({ url: 'https://offhours.test/x' })

    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://offhours.test/x')
  })

  it('reports unsupported when neither share nor clipboard nor execCommand works', async () => {
    const execCommand = vi.fn().mockReturnValue(false)
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
      writable: true,
    })

    const result = await shareOrCopy({ url: 'https://offhours.test/x' })

    expect(result).toBe('unsupported')
  })
})
