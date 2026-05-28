import { describe, expect, it, vi } from 'vitest'

import { HealthController } from './health.controller'

describe('HealthController', () => {
  it('returns a stable ok health payload', () => {
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))

    expect(new HealthController().check()).toEqual({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
    })
  })
})
