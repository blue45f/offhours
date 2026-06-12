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

// The API production image is built with the repository root as the Docker
// context (render.yaml dockerContext: .), so Docker only honors a root
// .dockerignore. Guard the patterns that keep stale incremental build state and
// local secrets out of the production build context.
if (!exists('.dockerignore')) {
  issues.push('missing file: .dockerignore')
} else {
  const dockerignore = read('.dockerignore')
  const requiredDockerignorePatterns = [
    '**/node_modules',
    '**/dist',
    '**/*.tsbuildinfo',
    '**/.env',
    'apps/web',
  ]
  for (const pattern of requiredDockerignorePatterns) {
    if (!dockerignore.includes(pattern)) {
      issues.push(`.dockerignore must include "${pattern}"`)
    }
  }
}

// Production Render deploys follow the sibling production pattern: Render does
// not auto-deploy on every git push; GitHub Actions triggers the deploy hook
// after CI and fails the run when the hook returns a non-2xx status.
if (!exists('render.yaml')) {
  issues.push('missing file: render.yaml')
} else {
  const render = read('render.yaml')
  if (!render.includes('autoDeploy: false')) {
    issues.push('render.yaml must set the API service autoDeploy to false')
  }
}
if (!exists('.github/workflows/deploy-render-api.yml')) {
  issues.push('missing file: .github/workflows/deploy-render-api.yml')
} else {
  const deployRender = read('.github/workflows/deploy-render-api.yml')
  if (!deployRender.includes('-X POST')) {
    issues.push('deploy-render-api.yml must POST to the Render deploy hook')
  }
  if (!deployRender.includes('if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then')) {
    issues.push('deploy-render-api.yml must fail when the Render deploy hook returns non-2xx')
  }
}

// Vercel deploys this monorepo from the repository root so the web build has
// access to the pnpm workspace and @offhours/shared.
if (!exists('vercel.json')) {
  issues.push('missing file: vercel.json')
} else {
  const vercel = read('vercel.json')
  const requiredVercelSnippets = [
    '"installCommand": "corepack enable && pnpm install --frozen-lockfile"',
    '"buildCommand": "pnpm --filter @offhours/shared build && pnpm --filter @offhours/web build"',
    '"outputDirectory": "apps/web/dist"',
  ]
  for (const snippet of requiredVercelSnippets) {
    if (!vercel.includes(snippet)) {
      issues.push(`vercel.json must include ${snippet}`)
    }
  }
  // The web app calls same-origin /api/* and relies on a Vercel rewrite to the
  // deployed API origin. The host moves with the infra (Render -> shared EC2),
  // so validate the rewrite shape instead of pinning a hostname.
  try {
    const rewrites = JSON.parse(vercel).rewrites ?? []
    const apiRewrite = rewrites.find((rule) => rule.source === '/api/:path*')
    if (!apiRewrite || !/^https:\/\/\S+\/api\/:path\*$/.test(apiRewrite.destination ?? '')) {
      issues.push(
        'vercel.json must rewrite "/api/:path*" to an https API origin ("/api/:path*" preserved)'
      )
    }
  } catch {
    issues.push('vercel.json is not valid JSON')
  }
}
if (!exists('.github/workflows/deploy-vercel-web.yml')) {
  issues.push('missing file: .github/workflows/deploy-vercel-web.yml')
} else {
  const deployVercel = read('.github/workflows/deploy-vercel-web.yml')
  if (!deployVercel.includes("'vercel.json'")) {
    issues.push('deploy-vercel-web.yml must include vercel.json in its path filters')
  }
  if (deployVercel.includes('cd apps/web')) {
    issues.push('deploy-vercel-web.yml must deploy from the repository root')
  }
  if (deployVercel.includes('--confirm')) {
    issues.push('deploy-vercel-web.yml must use vercel --yes instead of deprecated --confirm')
  }
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
