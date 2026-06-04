import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { Field, Input } from './Input'

describe('Input/Field 접근성', () => {
  it('error 인 Input 은 aria-invalid 를 노출한다', () => {
    render(<Input error aria-label="이메일" />)
    expect(screen.getByRole('textbox', { name: '이메일' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('error 가 없으면 aria-invalid 를 달지 않는다', () => {
    render(<Input aria-label="이메일" />)
    expect(screen.getByRole('textbox', { name: '이메일' })).not.toHaveAttribute('aria-invalid')
  })

  it('Field 의 에러 메시지가 role=alert 이고 입력에 aria-describedby 로 연결된다', () => {
    render(
      <Field label="이름" error="필수 입력입니다">
        <Input error aria-label="이름" />
      </Field>
    )
    const input = screen.getByRole('textbox', { name: '이름' })
    const alert = screen.getByRole('alert')
    expect(alert.textContent).toBe('필수 입력입니다')
    expect(alert.id).toBeTruthy()
    expect(input.getAttribute('aria-describedby')).toBe(alert.id)
  })
})
