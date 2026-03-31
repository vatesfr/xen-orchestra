const escapeCell = (v: unknown) =>
  String(v ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')

export function makeMarkdownTable(objects: unknown[]): string {
  if (objects.length === 0) {
    return 'No results.'
  }

  if (typeof objects[0] === 'string') {
    return objects.join('\n')
  }

  const records = objects as Record<string, unknown>[]
  const headers = Object.keys(records[0]).filter(k => k !== 'href')
  const headerRow = '| ' + headers.join(' | ') + ' |'
  const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |'
  const dataRows = records.map(obj => '| ' + headers.map(h => escapeCell(obj[h])).join(' | ') + ' |')

  return [headerRow, separatorRow, ...dataRows].join('\n')
}
