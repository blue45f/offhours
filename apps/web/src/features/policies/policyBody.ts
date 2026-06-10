export interface PolicyBlock {
  heading: string | null
  text: string
}

const MD_HEADING_RE = /^#{1,6}\s+(.+)$/
const CLAUSE_HEADING_RE = /^(제\d+조\s*(?:\([^)]*\))?|부칙)\s*$/

/**
 * TermsDesk body(평문 또는 가벼운 마크다운)를 블록 단위로 파싱한다.
 * 빈 줄로 문단을 나누고, 문단 첫 줄이 "제N조 (제목)"/"부칙"/마크다운 헤딩이면 소제목으로
 * 분리한다. HTML 을 거치지 않고 React 텍스트 노드로만 렌더해 sanitizer 없이도 XSS 안전.
 */
export function parsePolicyBody(body: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = []

  for (const raw of body.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = raw
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line, i, arr) => line.length > 0 || (i > 0 && i < arr.length - 1))
    if (lines.length === 0) continue

    const first = lines[0].trim()
    const md = first.match(MD_HEADING_RE)
    const isClause = CLAUSE_HEADING_RE.test(first)

    if (md || isClause) {
      blocks.push({
        heading: md ? md[1].trim() : first,
        text: lines.slice(1).join('\n').trim(),
      })
    } else {
      blocks.push({ heading: null, text: lines.join('\n').trim() })
    }
  }

  return blocks.filter((b) => b.heading !== null || b.text.length > 0)
}
