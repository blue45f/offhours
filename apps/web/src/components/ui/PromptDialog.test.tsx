import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { PromptProvider, usePrompt } from './PromptDialog'

function Harness({ onResult }: { onResult: (v: string | null) => void }) {
  const prompt = usePrompt()
  return (
    <button
      onClick={async () => {
        onResult(await prompt({ title: '닉네임을 알려주세요', label: '닉네임' }))
      }}
    >
      trigger
    </button>
  )
}

describe('PromptDialog', () => {
  it('확인 시 입력값으로 resolve된다', async () => {
    const onResult = vi.fn()
    render(
      <PromptProvider>
        <Harness onResult={onResult} />
      </PromptProvider>
    )

    fireEvent.click(screen.getByText('trigger'))
    const input = await screen.findByRole('textbox')
    fireEvent.change(input, { target: { value: '햇살' } })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith('햇살'))
  })

  it('취소 시 null로 resolve된다', async () => {
    const onResult = vi.fn()
    render(
      <PromptProvider>
        <Harness onResult={onResult} />
      </PromptProvider>
    )

    fireEvent.click(screen.getByText('trigger'))
    await screen.findByRole('textbox')
    fireEvent.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(null))
  })

  it('usePrompt는 Provider 밖에서 throw한다', () => {
    const Bad = () => {
      usePrompt()
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bad />)).toThrow(/PromptProvider/)
    spy.mockRestore()
  })
})
