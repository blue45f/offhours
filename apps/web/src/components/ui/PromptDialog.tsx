import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

import { Button } from './Button'
import { Dialog } from './Dialog'
import { Field, Input } from './Input'

interface PromptOptions {
  title: ReactNode
  description?: ReactNode
  label?: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  cancelLabel?: string
}

type PromptFn = (options: PromptOptions) => Promise<string | null>

const PromptContext = createContext<PromptFn | null>(null)

/**
 * Provides an imperative `prompt()` that resolves to the entered string (or
 * null if cancelled), backed by the branded {@link Dialog} — a themed,
 * accessible replacement for `window.prompt`. One instance lives at the app
 * root (like the Toaster / ConfirmProvider); call sites do
 * `const v = await prompt({ title }); if (v === null) return`.
 */
export function PromptProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<PromptOptions | null>(null)
  const [value, setValue] = useState('')
  const resolverRef = useRef<((value: string | null) => void) | null>(null)

  const prompt = useCallback<PromptFn>((opts) => {
    setOptions(opts)
    setValue(opts.defaultValue ?? '')
    return new Promise<string | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((result: string | null) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(null)
        }}
        size="sm"
        title={options?.title}
        description={options?.description}
        footer={
          options ? (
            <>
              <Button variant="ghost" onClick={() => settle(null)}>
                {options.cancelLabel ?? '취소'}
              </Button>
              <Button variant="primary" onClick={() => settle(value)}>
                {options.confirmLabel ?? '확인'}
              </Button>
            </>
          ) : null
        }
      >
        {options ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              settle(value)
            }}
          >
            <Field label={options.label}>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={options.placeholder}
              />
            </Field>
          </form>
        ) : null}
      </Dialog>
    </PromptContext.Provider>
  )
}

export function usePrompt(): PromptFn {
  const ctx = useContext(PromptContext)
  if (!ctx) throw new Error('usePrompt must be used within a PromptProvider')
  return ctx
}
