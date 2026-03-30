export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1)
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

export function renderTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? '').length)))

  const border = (left: string, mid: string, right: string) =>
    left + colWidths.map(w => '─'.repeat(w + 2)).join(mid) + right

  const row = (cells: string[]) => '│ ' + cells.map((c, i) => c.padEnd(colWidths[i])).join(' │ ') + ' │'

  return [border('┌', '┬', '┐'), row(headers), border('├', '┼', '┤'), ...rows.map(row), border('└', '┴', '┘')].join(
    '\n'
  )
}
