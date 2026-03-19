import { formatBytes, markdownTable } from './format-utils.mjs'

interface HostLike {
  id?: string
  name_label?: string
  power_state?: string
  productBrand?: string
  version?: string
  memory?: { size?: number; usage?: number }
  address?: string
}

export function formatHostList(hosts: HostLike[]): string {
  if (hosts.length === 0) return 'No hosts found.'

  const headers = ['Name', 'State', 'Product', 'Version', 'RAM', 'Address', 'ID']
  const rows = hosts.map(host => [
    host.name_label ?? '-',
    host.power_state ?? '-',
    host.productBrand ?? '-',
    host.version ?? '-',
    formatBytes(host.memory?.size),
    host.address ?? '-',
    host.id ?? '-',
  ])

  return `## Hosts (${hosts.length} found)\n\n${markdownTable(headers, rows)}`
}
