export type JsonSchemaExampleGroup = {
  caption?: string
  values: string[]
}

export type JsonSchemaDescription = {
  text?: string
  exampleGroups: JsonSchemaExampleGroup[]
}

export type JsonSchemaTextSegment =
  | { kind: 'text' | 'code'; text: string }
  | { kind: 'link'; text: string; href: string }

const CODE_SPAN_RE = /`([^`]+)`/

const LINE_BREAK_RE = /<br\s*\/?>/gi

const SEGMENT_RE = /`([^`]+)`|<a\s[^>]*?href=(["'])(https?:\/\/[^"']*)\2[^>]*>(.*?)<\/a>/gis

export function splitTextSegments(text: string): JsonSchemaTextSegment[] {
  const segments: JsonSchemaTextSegment[] = []
  let index = 0

  for (const match of text.matchAll(SEGMENT_RE)) {
    const [whole, code, , href, label] = match

    if (match.index > index) {
      segments.push({ kind: 'text', text: text.slice(index, match.index) })
    }

    segments.push(code !== undefined ? { kind: 'code', text: code } : { kind: 'link', text: label, href })
    index = match.index + whole.length
  }

  if (index < text.length) {
    segments.push({ kind: 'text', text: text.slice(index) })
  }

  return segments
}

function isList(lines: string[]): boolean {
  return lines.every(line => line.startsWith('- '))
}

// plugins list their examples as a bullet list of code spans
export function parseSchemaDescription(description: string | undefined): JsonSchemaDescription {
  const paragraphs: string[] = []
  const exampleGroups: JsonSchemaExampleGroup[] = []

  const blocks = (description ?? '')
    .replace(LINE_BREAK_RE, '\n\n')
    .trim()
    .split(/\n\s*\n/)

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')

    if (lines.length === 0) {
      continue
    }

    if (isList(lines)) {
      const values = lines.flatMap(line => CODE_SPAN_RE.exec(line)?.[1] ?? [])

      if (values.length > 0) {
        // the first paragraph is the help text, the next ones introduce the examples
        const caption = paragraphs.length > 1 ? paragraphs.pop() : undefined

        exampleGroups.push({ caption, values })

        continue
      }
    }

    paragraphs.push(lines.join(' '))
  }

  return {
    text: paragraphs.length > 0 ? paragraphs.join('\n') : undefined,
    exampleGroups,
  }
}
