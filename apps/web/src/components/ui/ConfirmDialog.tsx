import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

import { Button } from './Button'
import { Dialog } from './Dialog'

interface ConfirmOptions {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Renders the confirm button with the destructive variant (for deletes). */
  danger?: boolean
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Provides an imperative `confirm()` that resolves to a boolean, backed by the
 * branded {@link Dialog} — a themed, accessible replacement for `window.confirm`.
 * One dialog instance lives at the app root (like the Toaster); call sites do
 * `if (!(await confirm({ title, danger: true }))) return`.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const settle = useCallback((result: boolean) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setOptions(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={options !== null}
        onOpenChange={(open) => {
          if (!open) settle(false)
        }}
        size="sm"
        title={options?.title}
        description={options?.description}
        footer={
          options ? (
            <>
              <Button variant="ghost" onClick={() => settle(false)}>
                {options.cancelLabel ?? '취소'}
              </Button>
              <Button
                variant={options.danger ? 'destructive' : 'primary'}
                onClick={() => settle(true)}
                autoFocus
              >
                {options.confirmLabel ?? '확인'}
              </Button>
            </>
          ) : null
        }
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
