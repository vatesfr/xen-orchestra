import { toValue } from 'vue'

export function toSearchTerm(value: unknown): string {
  const term = toValue(value)

  if (term === undefined || term === null) {
    return ''
  }

  return String(term).toLocaleLowerCase().trim()
}
