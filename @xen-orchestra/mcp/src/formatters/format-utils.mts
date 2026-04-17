import humanFormat from 'human-format'

export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || bytes === 0) return '0 B'
  return humanFormat(bytes, { scale: 'binary', unit: 'B', decimals: 1 })
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function markdownTable(headers: string[], rows: string[][]): string {
  const sep = headers.map(() => '---')
  const lines = [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${sep.join(' | ')} |`,
    ...rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`),
  ]
  return lines.join('\n')
}
