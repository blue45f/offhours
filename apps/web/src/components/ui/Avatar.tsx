import * as RAvatar from '@radix-ui/react-avatar'

import { cn } from '../../utils/cn'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
}

function initials(name?: string): string {
  if (!name) return '·'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <RAvatar.Root
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-semibold',
        sizes[size],
        className
      )}
    >
      {src && <RAvatar.Image className="size-full object-cover" src={src} alt={name ?? ''} />}
      <RAvatar.Fallback className="leading-none uppercase">{initials(name)}</RAvatar.Fallback>
    </RAvatar.Root>
  )
}
