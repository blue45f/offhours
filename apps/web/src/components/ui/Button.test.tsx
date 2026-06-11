import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Button } from './Button'

describe('Button', () => {
  it('자식 텍스트를 노출한다', () => {
    render(<Button>예약하기</Button>)
    expect(screen.getByRole('button', { name: '예약하기' })).toBeInTheDocument()
  })

  it('loading 시 disabled 처리', () => {
    render(<Button loading>...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('loading 시 aria-busy 를 노출하고 평상시엔 없다', () => {
    const { rerender } = render(<Button loading>저장</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    rerender(<Button>저장</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy')
  })
})
