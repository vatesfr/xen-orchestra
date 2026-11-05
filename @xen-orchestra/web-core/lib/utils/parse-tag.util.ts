export type ParsedTag = {
  term: string
  label: string
}

export function parseTag(value: string): ParsedTag | null {
  const index = value.indexOf('=')

  if (index === -1) {
    return null
  }

  const term = value.slice(0, index).trim()

  const label = value.slice(index + 1).trim()

  if (term === '' || label === '') {
    return null
  }

  return { term, label }
}
