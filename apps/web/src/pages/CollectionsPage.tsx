import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FolderHeart, Globe2, Lock, Plus } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import {
  useCreateCollection,
  useDeleteCollection,
  useMyCollections,
} from '../features/collections/api'
import { getErrorMessage } from '../services/api'
import { formatDateKR } from '../utils/format'

export default function CollectionsPage() {
  const { data, isLoading } = useMyCollections()
  const create = useCreateCollection()
  const del = useDeleteCollection()
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [isPublic, setIsPublic] = useState(true)

  async function submit() {
    if (!name.trim()) return
    try {
      await create.mutateAsync({ name, description: desc || undefined, emoji, isPublic })
      setOpen(false)
      setName('')
      setDesc('')
      setEmoji('✨')
      toast.success('컬렉션을 만들었어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete(id: string, name: string) {
    const ok = await confirm({
      title: '컬렉션을 삭제할까요?',
      description: `"${name}"에 담긴 공간은 기본 찜으로 이동돼요.`,
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync(id)
      toast.success('삭제했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-headline serif">내 컬렉션</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            후보 공간을 폴더로 정리하고, 공개 컬렉션은 친구에게 링크로 공유하세요.
          </p>
        </div>
        <Button leading={<Plus size={14} />} onClick={() => setOpen(true)}>
          새 컬렉션
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
            ))
          : data?.map((c) => (
              <Card key={c.id} className="overflow-hidden group">
                <Link to={`/c/${c.slug}`} className="block">
                  <CoverMosaic urls={c.coverPhotoUrls} />
                </Link>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link to={`/c/${c.slug}`}>
                        <h3 className="font-semibold leading-tight truncate">
                          <span className="mr-1.5">{c.emoji ?? '✨'}</span>
                          {c.name}
                        </h3>
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                        {c.itemCount}개 공간 · {formatDateKR(c.updatedAt)} 업데이트
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                        c.isPublic
                          ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                          : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]'
                      }`}
                    >
                      {c.isPublic ? (
                        <>
                          <Globe2 size={10} />
                          공개
                        </>
                      ) : (
                        <>
                          <Lock size={10} />
                          비공개
                        </>
                      )}
                    </span>
                  </div>
                  {c.description && (
                    <p className="text-sm text-[var(--color-fg-muted)] line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="flex items-center justify-end gap-1 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/c/${c.slug}`
                        navigator.clipboard?.writeText(url)
                        toast.success('공유 링크를 복사했어요')
                      }}
                    >
                      링크 복사
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(c.id, c.name)}
                      className="!text-[var(--color-error)]"
                    >
                      삭제
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
      </div>

      {!isLoading && (!data || data.length === 0) && (
        <EmptyState
          icon={<FolderHeart size={22} />}
          title="아직 컬렉션이 없어요"
          description="후보 공간을 폴더로 정리하면 친구·동료와 의사결정이 빨라져요."
          action={
            <Button onClick={() => setOpen(true)} leading={<Plus size={14} />}>
              첫 컬렉션 만들기
            </Button>
          }
        />
      )}

      <Dialog open={open} onOpenChange={setOpen} title="새 컬렉션" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <Field label="이모지">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={2} />
            </Field>
            <Field label="이름" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="26살 여름 결혼식 후보"
              />
            </Field>
          </div>
          <Field label="설명" helper="친구가 보기에 좋아요">
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="60~120명 스몰웨딩, 야외 가능."
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            슬러그 URL로 누구나 보기 가능 (공개)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={submit} loading={create.isPending} disabled={!name.trim()}>
              만들기
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function CoverMosaic({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-fg-muted)]">
        <FolderHeart size={28} />
      </div>
    )
  }
  if (urls.length === 1) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden">
        <img src={urls[0]} alt="" className="size-full object-cover" />
      </div>
    )
  }
  if (urls.length === 2) {
    return (
      <div className="grid aspect-[4/3] w-full grid-cols-2 gap-0.5">
        {urls.slice(0, 2).map((u, i) => (
          <img key={i} src={u} alt="" className="size-full object-cover" />
        ))}
      </div>
    )
  }
  return (
    <div className="grid aspect-[4/3] w-full grid-cols-2 grid-rows-2 gap-0.5">
      <img src={urls[0]} alt="" className="row-span-2 size-full object-cover" />
      <img src={urls[1]} alt="" className="size-full object-cover" />
      <img src={urls[2]} alt="" className="size-full object-cover" />
    </div>
  )
}
