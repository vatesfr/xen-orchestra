export function formatBytes(bytes: number | undefined | null): string {
  if (bytes == null || bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export function markdownTable(headers: string[], rows: string[][]): string {
  const sep = headers.map(() => '---')
  const lines = [`| ${headers.join(' | ')} |`, `| ${sep.join(' | ')} |`, ...rows.map(row => `| ${row.join(' | ')} |`)]
  return lines.join('\n')
}
