export function PageLoader() {
  return (
    <div role="status" aria-label="불러오는 중" className="flex items-center justify-center py-24">
      <div
        aria-hidden
        className="size-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent"
      />
      <span className="sr-only">불러오는 중</span>
    </div>
  )
}
