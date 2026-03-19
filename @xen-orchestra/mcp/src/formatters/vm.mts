import { formatBytes, markdownTable } from './format-utils.mjs'

interface VmLike {
  id?: string
  name_label?: string
  power_state?: string
  CPUs?: { number?: number }
  memory?: { size?: number }
  $container?: string
  tags?: string[]
}

export function formatVmList(vms: VmLike[]): string {
  if (vms.length === 0) return 'No VMs found.'

  const headers = ['Name', 'State', 'vCPU', 'RAM', 'ID']
  const rows = vms.map(vm => [
    vm.name_label ?? '-',
    vm.power_state ?? '-',
    String(vm.CPUs?.number ?? '-'),
    formatBytes(vm.memory?.size),
    vm.id ?? '-',
  ])

  return `## VMs (${vms.length} found)\n\n${markdownTable(headers, rows)}`
}

export function formatVmDetails(vm: VmLike & Record<string, unknown>): string {
  const lines = [
    `## VM: ${vm.name_label ?? 'Unknown'}`,
    '',
    `- **State**: ${vm.power_state ?? 'Unknown'}`,
    `- **vCPUs**: ${vm.CPUs?.number ?? 'Unknown'}`,
    `- **RAM**: ${formatBytes(vm.memory?.size)}`,
  ]

  if (vm.$container) lines.push(`- **Host/Pool**: ${vm.$container}`)
  if (vm.name_description) lines.push(`- **Description**: ${vm.name_description}`)
  if (vm.os_version && typeof vm.os_version === 'object' && vm.os_version !== null) {
    const osName = (vm.os_version as Record<string, string>).name
    if (osName) lines.push(`- **OS**: ${osName}`)
  }
  if (vm.mainIpAddress) lines.push(`- **IP**: ${vm.mainIpAddress}`)
  if (Array.isArray(vm.tags) && vm.tags.length > 0) lines.push(`- **Tags**: ${vm.tags.join(', ')}`)
  lines.push(`- **ID**: ${vm.id ?? 'Unknown'}`)

  return lines.join('\n')
}
