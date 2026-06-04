import { HttpStatus } from '@nestjs/common'
import type { Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { HealthController } from './health.controller'
import type { PrismaService } from '../prisma/prisma.service'

const makePrisma = (queryImpl: () => Promise<unknown>) =>
  ({ $queryRaw: vi.fn(queryImpl) }) as unknown as PrismaService

const makeRes = () => ({ status: vi.fn() }) as unknown as Response

describe('HealthController', () => {
  it('liveness returns ok without touching the DB', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    const prisma = makePrisma(() => Promise.reject(new Error('must not be called')))

    const payload = new HealthController(prisma).check()

    expect(payload).toMatchObject({ status: 'ok', timestamp: '2024-01-01T00:00:00.000Z' })
    expect(prisma.$queryRaw).not.toHaveBeenCalled()
  })

  it('live() aliases the liveness check', () => {
    const prisma = makePrisma(() => Promise.resolve([{ 1: 1 }]))
    expect(new HealthController(prisma).live()).toMatchObject({ status: 'ok' })
    expect(prisma.$queryRaw).not.toHaveBeenCalled()
  })

  it('readiness returns ok + 200 when the DB responds', async () => {
    const prisma = makePrisma(() => Promise.resolve([{ '?column?': 1 }]))
    const res = makeRes()

    const body = await new HealthController(prisma).ready(res)

    expect(body).toMatchObject({ status: 'ok', checks: { database: true } })
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK)
  })

  it('readiness returns down + 503 when the DB is unreachable', async () => {
    const prisma = makePrisma(() => Promise.reject(new Error('db down')))
    const res = makeRes()

    const body = await new HealthController(prisma).ready(res)

    expect(body).toMatchObject({ status: 'down', checks: { database: false } })
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE)
  })
})
