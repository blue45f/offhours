import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  compareRouteSets,
  extractFrontendApiRoutes,
  extractFrontendDynamicApiCalls,
  normalizeRoutePath,
  routeKey,
} from './audit-api-contracts.mjs'

test('normalizes string-literal, template, and concatenated frontend URLs', () => {
  assert.equal(normalizeRoutePath("'/spaces/mine'"), 'spaces/mine')
  assert.equal(normalizeRoutePath('`/spaces/${spaceId}/slots`'), 'spaces/:param/slots')
  // offhours' one string-concatenation call-site
  assert.equal(
    normalizeRoutePath("'/spaces/slug/' + slug + '/gallery'"),
    'spaces/slug/:param/gallery'
  )
  assert.equal(normalizeRoutePath('payments/me?partyId=${partyId}'), 'payments/me')
  assert.equal(normalizeRoutePath('/api/venues/:id/menu'), 'venues/:param/menu')
  // MSW handler form with `${API}` and `*/api` prefix
  assert.equal(
    normalizeRoutePath('${API}/chat/rooms/:roomId/messages'),
    'chat/rooms/:param/messages'
  )
})

test('builds stable route keys', () => {
  assert.equal(routeKey('get', 'spaces/:spaceId/slots'), 'GET spaces/:param/slots')
})

test('compares route sets by normalized method and path', () => {
  const used = [
    { method: 'GET', path: 'spaces/${spaceId}/slots', source: 'web.ts:1' },
    { method: 'POST', path: 'chat/${roomId}/messages', source: 'chat.ts:2' },
  ]
  const available = [{ method: 'GET', path: 'spaces/:spaceId/slots', source: 'api.ts:1' }]

  assert.deepEqual(compareRouteSets(used, available), [
    {
      key: 'POST chat/:param/messages',
      method: 'POST',
      path: 'chat/:param/messages',
      source: 'chat.ts:2',
    },
  ])
})

test('extracts static api.* call-sites including concatenated URLs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offhours-api-contract-'))
  fs.mkdirSync(path.join(root, 'apps/web/src/features'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'apps/web/src/features/spaces.ts'),
    `
      import { api } from '../../services/api'
      export const gallery = (slug) => api.get<Photo[]>('/spaces/slug/' + slug + '/gallery')
      export const slots = (id) => api.get<Slot[]>(\`/spaces/\${id}/slots\`)
    `
  )

  const routes = extractFrontendApiRoutes(root).map((r) => routeKey(r.method, r.path))
  assert.ok(routes.includes('GET spaces/slug/:param/gallery'))
  assert.ok(routes.includes('GET spaces/:param/slots'))
})

test('reports frontend API calls whose route cannot be statically audited', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offhours-api-contract-'))
  fs.mkdirSync(path.join(root, 'apps/web/src/features'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'apps/web/src/features/dynamic.ts'),
    `
      import { api } from '../../services/api'
      const path = 'spaces'
      export function load() {
        return api.get(path)
      }
    `
  )

  assert.deepEqual(extractFrontendDynamicApiCalls(root), [
    {
      method: 'GET',
      expression: 'path',
      source: 'apps/web/src/features/dynamic.ts:5',
    },
  ])
})
