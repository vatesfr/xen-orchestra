const escapeCell = (value: unknown) => {
  if (value == null) return ''
  const text = typeof value === 'object' ? JSON.stringify(value) : String(value)
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function makeMarkdownTable(objects: unknown[]): string {
  if (objects.length === 0) {
    return 'No results.'
  }

  if (typeof objects[0] === 'string') {
    return objects.join('\n')
  }

  const records = objects as Record<string, unknown>[]
  const headers = Object.keys(records[0]).filter(key => key !== 'href')
  const headerRow = '| ' + headers.join(' | ') + ' |'
  const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |'
  const dataRows = records.map(obj => '| ' + headers.map(header => escapeCell(obj[header])).join(' | ') + ' |')

  return [headerRow, separatorRow, ...dataRows].join('\n')
}
