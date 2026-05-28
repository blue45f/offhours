import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'

import { useSignOut } from '../features/auth/api'
import { useIsAuthed } from '../store/auth'

export default function LogoutPage() {
  const signOut = useSignOut()
  const isAuthed = useIsAuthed()
  useEffect(() => {
    signOut.mutate()
  }, [signOut])
  if (!isAuthed) return <Navigate to="/" replace />
  return (
    <div className="container-page py-20 text-center text-sm text-[var(--color-fg-muted)]">
      로그아웃 중이에요...
    </div>
  )
}
