export type JsonSchemaExampleGroup = {
  caption?: string
  values: string[]
}

export type JsonSchemaDescription = {
  text?: string
  exampleGroups: JsonSchemaExampleGroup[]
}

export type JsonSchemaTextSegment = {
  text: string
  isCode: boolean
}

const CODE_SPAN_RE = /`([^`]+)`/

export function splitCodeSpans(text: string): JsonSchemaTextSegment[] {
  return text
    .split(new RegExp(CODE_SPAN_RE, 'g'))
    .map((segment, index) => ({ text: segment, isCode: index % 2 === 1 }))
    .filter(segment => segment.text !== '')
}

function isList(lines: string[]): boolean {
  return lines.every(line => line.startsWith('- '))
}

// plugins list their examples as a bullet list of code spans
export function parseSchemaDescription(description: string | undefined): JsonSchemaDescription {
  const paragraphs: string[] = []
  const exampleGroups: JsonSchemaExampleGroup[] = []

  for (const block of (description ?? '').trim().split(/\n\s*\n/)) {
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
    text: paragraphs.length > 0 ? paragraphs.join(' ') : undefined,
    exampleGroups,
  }
}
