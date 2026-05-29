import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'

import { useMySpaces } from '../features/spaces/api'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { formatKRW } from '../utils/format'

export default function HostSpacesPage() {
  const { data } = useMySpaces()

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-headline serif">내 공간</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">총 {data?.length ?? 0}개</p>
        </div>
        <Link to="/host/spaces/new">
          <Button leading={<PlusCircle size={14} />}>공간 등록</Button>
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState
          title="아직 등록한 공간이 없어요"
          description="영업시간만 입력하면 휴무일/마감 후 슬롯이 자동 생성돼요."
          action={
            <Link to="/host/spaces/new">
              <Button>첫 공간 등록하기</Button>
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((s) => (
            <li key={s.id}>
              <Card className="overflow-hidden">
                {s.photos[0] && (
                  <img
                    src={s.photos[0].url}
                    alt={s.title}
                    className="aspect-[4/3] w-full object-cover"
                  />
                )}
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      tone={
                        s.status === 'ACTIVE'
                          ? 'success'
                          : s.status === 'PENDING_REVIEW'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                    {s.venue?.region} {s.venue?.district} · 최대 {s.capacityMax}인
                  </p>
                  <p className="mt-2 font-semibold text-[var(--color-primary)]">
                    {formatKRW(s.basePriceKRW)} / 시간
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
