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

export function formatHostDetails(host: HostLike): string {
  const lines = [
    `## Host: ${host.name_label ?? 'Unknown'}`,
    '',
    `- **State**: ${host.power_state ?? 'Unknown'}`,
    `- **Product**: ${host.productBrand ?? 'Unknown'}`,
    `- **Version**: ${host.version ?? 'Unknown'}`,
    `- **RAM**: ${formatBytes(host.memory?.size)}`,
    `- **Address**: ${host.address ?? 'Unknown'}`,
    `- **ID**: ${host.id ?? 'Unknown'}`,
  ]
  return lines.join('\n')
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
