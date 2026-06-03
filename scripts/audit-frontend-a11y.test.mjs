import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { findClickableNonInteractiveElements } from './audit-frontend-a11y.mjs'

test('finds clickable divs that should be real interactive elements', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offhours-a11y-'))
  fs.mkdirSync(path.join(root, 'apps/web/src/pages/demo'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'apps/web/src/pages/demo/Demo.tsx'),
    `
      export function Demo() {
        return <div className="row" onClick={() => {}}>Open</div>
      }
    `
  )

  assert.deepEqual(findClickableNonInteractiveElements(root), [
    {
      tag: 'div',
      source: 'apps/web/src/pages/demo/Demo.tsx:3',
    },
  ])
})

test('catches multiline <div onClick> (offhours wraps JSX attributes)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offhours-a11y-'))
  fs.mkdirSync(path.join(root, 'apps/web/src/components'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'apps/web/src/components/Overlay.tsx'),
    `
      export function Overlay({ close }) {
        return (
          <span
            className="fixed inset-0"
            onClick={close}
          />
        )
      }
    `
  )

  assert.deepEqual(findClickableNonInteractiveElements(root), [
    {
      tag: 'span',
      source: 'apps/web/src/components/Overlay.tsx:4',
    },
  ])
})

test('accepts a real <button> with onClick', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'offhours-a11y-'))
  fs.mkdirSync(path.join(root, 'apps/web/src/components'), { recursive: true })
  fs.writeFileSync(
    path.join(root, 'apps/web/src/components/Ok.tsx'),
    `
      export function Ok({ close }) {
        return <button type="button" onClick={close} aria-label="close" />
      }
    `
  )

  assert.deepEqual(findClickableNonInteractiveElements(root), [])
})
