import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { PageLoader } from './PageLoader'

describe('PageLoader 접근성', () => {
  it('role=status 영역으로 불러오는 중을 보조기술에 고지한다', () => {
    render(<PageLoader />)
    const loader = screen.getByRole('status', { name: '불러오는 중' })
    expect(loader).toHaveTextContent('불러오는 중')
  })
})
