import { formatBytes, markdownTable } from './format-utils.mjs'

interface VdiLike {
  id?: string
  name_label?: string
  name_description?: string
  size?: number
  usage?: number
  VDI_type?: string
  $SR?: string
}

export function formatVdiList(vdis: VdiLike[]): string {
  if (vdis.length === 0) return 'No VDIs found.'

  const headers = ['Name', 'Size', 'Usage', 'Type', 'SR', 'ID']
  const rows = vdis.map(vdi => [
    vdi.name_label ?? '-',
    formatBytes(vdi.size),
    formatBytes(vdi.usage),
    vdi.VDI_type ?? '-',
    vdi.$SR ?? '-',
    vdi.id ?? '-',
  ])

  return `## VDIs (${vdis.length} found)\n\n${markdownTable(headers, rows)}`
}
