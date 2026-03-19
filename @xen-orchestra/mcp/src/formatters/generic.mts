import { markdownTable } from './format-utils.mjs'

export function formatGenericList(items: Record<string, unknown>[], label: string): string {
  if (items.length === 0) return `No ${label} found.`

  // Collect all keys present in the data
  const keys = new Set<string>()
  for (const item of items) {
    for (const key of Object.keys(item)) {
      if (key !== 'href') keys.add(key)
    }
  }

  const headers = [...keys]
  const rows = items.map(item =>
    headers.map(h => {
      const val = item[h]
      if (val == null) return '-'
      if (typeof val === 'object') return JSON.stringify(val)
      return String(val)
    })
  )

  return `## ${label} (${items.length} found)\n\n${markdownTable(headers, rows)}`
}
