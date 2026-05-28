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
})
