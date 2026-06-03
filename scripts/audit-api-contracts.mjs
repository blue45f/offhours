import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Frontend `api.get/post/...(url)` paths are relative to the axios baseURL (`/api`),
// so they carry no `/api` prefix. Nest @Controller/@Method decorators define the
// canonical routes. This audit asserts every statically-known web call-site maps
// to a real Nest route (parity), and flags call-sites whose URL cannot be read
// statically (dynamic) so they can't silently drift.

export function normalizeRoutePath(input) {
  let value = String(input ?? '').trim()

  // Unwrap string/template literals and collapse concatenation segments:
  //   '/spaces/mine'                       -> /spaces/mine
  //   `/spaces/${id}/slots`                -> /spaces/${id}/slots (interp handled below)
  //   '/spaces/slug/' + slug + '/gallery'  -> /spaces/slug/:param/gallery
  // The quoted literals are the static skeleton; expressions between them are params.
  value = unwrapStringExpression(value)

  value = value.replaceAll('\\`', '`')
  value = value.replace(/\$\{API\}/g, '')
  value = value.replace(/^\*?\/?api\/?/, '')
  value = value.replace(/^\/+/, '')
  value = value.replace(/[?#].*$/, '')
  value = value.replace(/\$\{[^}]+\}/g, ':param')

  const unclosedInterpolation = value.indexOf('${')
  if (unclosedInterpolation >= 0) {
    value = value.slice(0, unclosedInterpolation)
  }

  value = value
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith(':')) return ':param'
      return segment
    })
    .join('/')

  return value || ''
}

// Reduce a JS string/template expression to its route skeleton by stitching the
// string literals together and replacing the expressions between them with :param.
//   "'/a/' + id + '/b'"  -> /a/:param/b
//   "`/a/${id}/b`"       -> /a/${id}/b   (template interpolation normalized later)
//   "'/a/b'"             -> /a/b
// Falls back to the raw value when no string literal is present (dynamic call).
function unwrapStringExpression(value) {
  const literalRe = /(['"`])((?:\\.|(?!\1).)*)\1/g
  let out = ''
  let lastEnd = 0
  let sawLiteral = false
  for (const m of value.matchAll(literalRe)) {
    sawLiteral = true
    const between = value.slice(lastEnd, m.index)
    if (/[^\s+]/.test(between)) out += ':param'
    out += m[2]
    lastEnd = m.index + m[0].length
  }
  if (!sawLiteral) return value
  const tail = value.slice(lastEnd)
  if (/[^\s+]/.test(tail)) out += ':param'
  return out
}

export function routeKey(method, routePath) {
  return `${method.toUpperCase()} ${normalizeRoutePath(routePath)}`
}

export function compareRouteSets(used, available) {
  const availableKeys = new Set(available.map((route) => routeKey(route.method, route.path)))
  const seen = new Set()
  const missing = []

  for (const route of used) {
    const key = routeKey(route.method, route.path)
    if (availableKeys.has(key) || seen.has(key)) continue
    seen.add(key)
    const [method, routePath] = key.split(' ')
    missing.push({
      key,
      method,
      path: routePath,
      source: route.source,
    })
  }

  return missing
}

// Capture the full first call argument (balanced parens, stop at top-level comma)
// so concatenated/templated URLs survive intact for normalization.
function readFirstArg(text, openParenIndex) {
  let depth = 0
  let inStr = null
  for (let i = openParenIndex; i < text.length; i++) {
    const ch = text[i]
    if (inStr) {
      if (ch === '\\') {
        i++
        continue
      }
      if (ch === inStr) inStr = null
      continue
    }
    if (ch === '`' || ch === "'" || ch === '"') {
      inStr = ch
      continue
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') {
      depth--
      if (depth === 0) return text.slice(openParenIndex + 1, i)
    } else if (ch === ',' && depth === 1) {
      return text.slice(openParenIndex + 1, i)
    }
  }
  return ''
}

function startsWithStringLiteral(expr) {
  return /^[`'"]/.test(expr.trim())
}

const API_CALL_RE = /\bapi\.(get|post|put|patch|delete)(?:<[^()]*>)?\s*\(/g

export function extractFrontendApiRoutes(root = ROOT) {
  const files = listFrontendSourceFiles(root)
  const routes = []

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(API_CALL_RE)) {
      const openParen = (match.index ?? 0) + match[0].length - 1
      const arg = readFirstArg(text, openParen)
      if (!startsWithStringLiteral(arg)) continue
      routes.push({
        method: match[1].toUpperCase(),
        path: normalizeRoutePath(arg),
        source: sourceRef(root, file, text, match.index ?? 0),
      })
    }
  }
  return routes
}

export function extractFrontendDynamicApiCalls(root = ROOT) {
  const files = listFrontendSourceFiles(root)
  const calls = []

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(API_CALL_RE)) {
      const openParen = (match.index ?? 0) + match[0].length - 1
      const arg = readFirstArg(text, openParen)
      if (startsWithStringLiteral(arg)) continue
      const expression = arg.trim()
      if (!expression) continue
      calls.push({
        method: match[1].toUpperCase(),
        expression: expression.split('\n')[0].trim(),
        source: sourceRef(root, file, text, match.index ?? 0),
      })
    }
  }

  return calls
}

export function extractMockRoutes(root = ROOT) {
  const file = path.join(root, 'apps/web/src/mocks/handlers.ts')
  if (!fs.existsSync(file)) return []
  const text = fs.readFileSync(file, 'utf8')
  const re = /http\.(get|post|put|patch|delete)\(\s*([`'"])([\s\S]*?)\2/g
  return [...text.matchAll(re)].map((match) => ({
    method: match[1].toUpperCase(),
    path: normalizeRoutePath(match[3]),
    source: sourceRef(root, file, text, match.index ?? 0),
  }))
}

export function extractBackendRoutes(root = ROOT) {
  const srcDir = path.join(root, 'apps/api/src')
  const files = listFiles(srcDir, (file) => /\.ts$/.test(file) && !/\.(test|spec)\.ts$/.test(file))
  const routes = []

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    const controllerRe = /@Controller\(([^)]*)\)([\s\S]*?)(?=@Controller\(|$)/g
    for (const controllerMatch of text.matchAll(controllerRe)) {
      const prefix = decoratorPath(controllerMatch[1])
      const block = controllerMatch[2]
      const blockOffset = (controllerMatch.index ?? 0) + controllerMatch[0].indexOf(block)
      const methodRe = /@(Get|Post|Put|Patch|Delete)\(([^)]*)\)/g
      for (const methodMatch of block.matchAll(methodRe)) {
        const method = methodMatch[1].toUpperCase()
        const routePath = joinRoute(prefix, decoratorPath(methodMatch[2]))
        routes.push({
          method,
          path: normalizeRoutePath(routePath),
          source: sourceRef(root, file, text, blockOffset + (methodMatch.index ?? 0)),
        })
      }
    }
  }

  return routes
}

function decoratorPath(rawArgs) {
  const args = String(rawArgs ?? '').trim()
  if (!args) return ''
  const match = args.match(/^[`'"]([^`'"]*)[`'"]/)
  return match?.[1] ?? ''
}

function joinRoute(prefix, suffix) {
  return [prefix, suffix].filter(Boolean).join('/')
}

function listFiles(dir, predicate) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue
      out.push(...listFiles(full, predicate))
    } else if (predicate(full)) {
      out.push(full)
    }
  }
  return out
}

function listFrontendSourceFiles(root) {
  const srcDir = path.join(root, 'apps/web/src')
  return listFiles(srcDir, (file) => {
    if (!/\.(ts|tsx)$/.test(file)) return false
    if (file.includes('/mocks/')) return false
    if (/\.(test|spec)\.(ts|tsx)$/.test(file)) return false
    return true
  })
}

function sourceRef(root, file, text, index) {
  const line = text.slice(0, index).split('\n').length
  return `${path.relative(root, file)}:${line}`
}

function formatRoutes(title, routes) {
  if (routes.length === 0) return `${title}: none`
  return [
    `${title}: ${routes.length}`,
    ...routes.map((route) => ` - ${route.key} (${route.source})`),
  ].join('\n')
}

function main() {
  const strictMock = process.argv.includes('--strict-mock')
  const frontend = extractFrontendApiRoutes()
  const dynamicFrontend = extractFrontendDynamicApiCalls()
  const backend = extractBackendRoutes()
  const mock = extractMockRoutes()
  const missingBackend = compareRouteSets(frontend, backend)
  const missingMock = compareRouteSets(frontend, mock)

  console.log(`API contract audit`)
  console.log(
    ` - frontend routes used: ${new Set(frontend.map((r) => routeKey(r.method, r.path))).size}`
  )
  console.log(
    ` - backend routes exposed: ${new Set(backend.map((r) => routeKey(r.method, r.path))).size}`
  )
  console.log(
    ` - mock routes exposed: ${new Set(mock.map((r) => routeKey(r.method, r.path))).size}`
  )

  if (dynamicFrontend.length > 0) {
    console.error(
      [
        `Dynamic frontend API calls: ${dynamicFrontend.length}`,
        ...dynamicFrontend.map(
          (route) => ` - ${route.method} ${route.expression} (${route.source})`
        ),
      ].join('\n')
    )
  } else {
    console.log('Dynamic frontend API calls: none')
  }

  if (missingBackend.length > 0) {
    console.error(formatRoutes('Missing backend routes', missingBackend))
  } else {
    console.log('Missing backend routes: none')
  }

  // The MSW mock surface is intentionally read-only (browsing/design demos);
  // money-movement is deliberately not mocked. So mock parity is advisory by
  // default and only gating under --strict-mock.
  if (missingMock.length > 0) {
    const output = formatRoutes('Missing mock routes', missingMock)
    if (strictMock) console.error(output)
    else console.warn(output)
  } else {
    console.log('Missing mock routes: none')
  }

  if (
    dynamicFrontend.length > 0 ||
    missingBackend.length > 0 ||
    (strictMock && missingMock.length > 0)
  ) {
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
