export type JsonSchemaExampleGroup = {
  caption?: string
  values: string[]
}

export type JsonSchemaDescription = {
  text?: string
  exampleGroups: JsonSchemaExampleGroup[]
}

const CODE_SPAN_RE = /`([^`]+)`/
const INLINE_EXAMPLE_RE = /\s*e\.g\.:?\s*`([^`]+)`\.?/gi

function stripCodeSpans(text: string): string {
  return text.replace(new RegExp(CODE_SPAN_RE, 'g'), '$1')
}

function isList(lines: string[]): boolean {
  return lines.every(line => line.startsWith('- '))
}

/**
 * Split a markdown description of a JSON schema into a plain help text and clickable examples
 *
 * - a bullet list of code spans becomes an example group, introduced by the paragraph before it
 * - an inline `e.g.: \`value\`` becomes an example
 */
export function parseSchemaDescription(description: string | undefined): JsonSchemaDescription {
  const paragraphs: string[] = []
  const exampleGroups: JsonSchemaExampleGroup[] = []
  const inlineExamples: string[] = []

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

    const paragraph = lines
      .join(' ')
      .replace(INLINE_EXAMPLE_RE, (_, value: string) => {
        inlineExamples.push(value)

        return ''
      })
      .trim()

    if (paragraph !== '') {
      paragraphs.push(stripCodeSpans(paragraph))
    }
  }

  if (inlineExamples.length > 0) {
    exampleGroups.unshift({ values: inlineExamples })
  }

  return {
    text: paragraphs.length > 0 ? paragraphs.join(' ') : undefined,
    exampleGroups,
  }
}
