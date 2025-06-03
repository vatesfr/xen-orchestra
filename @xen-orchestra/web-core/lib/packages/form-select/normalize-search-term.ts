import { toValue } from 'vue'

export function normalizeSearchTerm(value: unknown): string {
  const term = toValue(value)

  if (term === undefined || term === null) {
    return ''
  }

  return String(term).toLocaleLowerCase().trim()
}
