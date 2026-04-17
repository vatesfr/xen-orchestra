import { markdownTable } from './format-utils.mjs'

const EXCLUDED_FIELDS = new Set([
  'href',
  '_xapiRef',
  '$poolId',
  'uuid',
  'xenStoreData',
  'other',
  'other_config',
  'otherConfig',
  'bios_strings',
  'current_operations',
  'blockedOperations',
])

export function formatGenericList(items: Record<string, unknown>[], label: string): string {
  if (items.length === 0) return `No ${label} found.`

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

export function formatGenericDetails(obj: Record<string, unknown>, label: string, depth = 2): string {
  const heading = '#'.repeat(Math.min(depth, 6))
  const lines = [`${heading} ${label}`, '']

  for (const [k, v] of Object.entries(obj)) {
    if (EXCLUDED_FIELDS.has(k)) continue
    if (v === null || v === undefined || v === '') continue

    if (typeof v === 'object' && !Array.isArray(v)) {
      const json = JSON.stringify(v)
      if (json.length < 100) {
        lines.push(`- **${k}**: ${json}`)
      } else {
        lines.push('', formatGenericDetails(v as Record<string, unknown>, k, depth + 1))
      }
    } else if (Array.isArray(v)) {
      if (v.length === 0) {
        lines.push(`- **${k}**: _(empty)_`)
      } else if (v.every(item => typeof item !== 'object' || item === null)) {
        lines.push(`- **${k}** (${v.length}): ${v.join(', ')}`)
      } else {
        lines.push('', `${'#'.repeat(Math.min(depth + 1, 6))} ${k} (${v.length})`)
        v.forEach((item, i) => {
          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            lines.push('', formatGenericDetails(item as Record<string, unknown>, `[${i}]`, depth + 2))
          } else {
            lines.push(`- **[${i}]**: ${Array.isArray(item) ? item.join(', ') : item}`)
          }
        })
      }
    } else {
      lines.push(`- **${k}**: ${v}`)
    }
  }

  return lines.join('\n')
}
