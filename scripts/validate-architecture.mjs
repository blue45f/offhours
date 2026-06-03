import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel) => fs.existsSync(path.join(ROOT, rel))

const pkg = JSON.parse(read('package.json'))
const scripts = pkg.scripts || {}

const issues = []

// Required docs (offhours keeps product/architecture/design under docs/)
const requiredPaths = [
  'README.md',
  'docs/ARCHITECTURE.md',
  'docs/PRODUCT.md',
  'docs/DESIGN.md',
  'docs/DEVELOPMENT.md',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
]
for (const file of requiredPaths) {
  if (!exists(file)) issues.push(`missing file: ${file}`)
}

// Required root scripts wired into the verify/CI chain
const requiredScripts = [
  'build',
  'lint',
  'typecheck',
  'test:run',
  'format:check',
  'ci',
  'verify',
  'validate:architecture',
]
for (const script of requiredScripts) {
  if (!scripts[script]) issues.push(`missing script: ${script}`)
}

// verify must run validate:architecture before the rest (sibling convention)
if (scripts.verify && !scripts.verify.includes('validate:architecture')) {
  issues.push('script "verify" must run validate:architecture')
}

// pnpm workspace members declared in pnpm-workspace.yaml must exist on disk
if (exists('pnpm-workspace.yaml')) {
  const ws = read('pnpm-workspace.yaml')
  const globs = [...ws.matchAll(/^\s*-\s*['"]?([^'"\n]+?)['"]?\s*$/gm)]
    .map((m) => m[1].trim())
    .filter((g) => g.includes('/'))
  for (const glob of globs) {
    const base = glob.replace(/\/\*+$/, '')
    if (!exists(base)) issues.push(`workspace dir missing: ${base} (from "${glob}")`)
  }
}

// Each workspace package must have a name + build script (monorepo -r build relies on this)
const workspaceDirs = ['apps/api', 'apps/web', 'packages/shared']
for (const dir of workspaceDirs) {
  const pj = `${dir}/package.json`
  if (!exists(pj)) {
    issues.push(`missing workspace package: ${pj}`)
    continue
  }
  const wp = JSON.parse(read(pj))
  if (!wp.name) issues.push(`workspace ${dir} has no "name"`)
  if (!wp.scripts || !wp.scripts.build) issues.push(`workspace ${dir} has no "build" script`)
}

// Prettier no-semi convention is the project style; guard the config exists
if (!exists('.prettierrc')) {
  issues.push('missing file: .prettierrc')
} else {
  try {
    const pr = JSON.parse(read('.prettierrc'))
    if (pr.semi !== false) issues.push('.prettierrc must keep semi:false (no-semi convention)')
  } catch {
    issues.push('.prettierrc is not valid JSON')
  }
}

if (issues.length > 0) {
  console.error(`architecture validation failed: ${issues.length} issue(s)`)
  for (const item of issues) console.error(` - ${item}`)
  process.exit(1)
}

console.log('architecture validation passed: docs, workspace members, and scripts are consistent')
