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

interface VmDashboardLike {
  quickInfo?: VmLike & {
    name_description?: string
    mainIpAddress?: string
    os_version?: { name?: string }
    virtualizationMode?: string
    pvDriversDetected?: boolean
    pvDriversVersion?: string
    startTime?: number
    host?: string
    $pool?: string
    creation?: { date?: string }
  }
  alarms?: unknown[]
  backupsInfo?: {
    vmProtection?: string
    lastRuns?: unknown[]
  }
}

export function formatVmDashboard(dashboard: VmDashboardLike): string {
  const qi = dashboard.quickInfo
  if (!qi) return JSON.stringify(dashboard, null, 2)

  const lines = [
    `## VM Dashboard`,
    '',
    `- **State**: ${qi.power_state ?? 'Unknown'}`,
    `- **vCPUs**: ${qi.CPUs?.number ?? '?'}`,
    `- **RAM**: ${formatBytes(qi.memory?.size)}`,
  ]

  if (qi.name_description) lines.push(`- **Description**: ${qi.name_description}`)
  if (qi.os_version?.name) lines.push(`- **OS**: ${qi.os_version.name}`)
  if (qi.mainIpAddress) lines.push(`- **IP**: ${qi.mainIpAddress}`)
  if (qi.virtualizationMode) lines.push(`- **Virtualization**: ${qi.virtualizationMode}`)
  if (qi.host) lines.push(`- **Host**: ${qi.host}`)
  if (qi.$pool) lines.push(`- **Pool**: ${qi.$pool}`)
  if (qi.pvDriversDetected != null) {
    lines.push(`- **PV Drivers**: ${qi.pvDriversDetected ? `yes (${qi.pvDriversVersion ?? '?'})` : 'no'}`)
  }
  if (qi.startTime) {
    lines.push(`- **Started**: ${new Date(qi.startTime * 1000).toISOString()}`)
  }
  if (qi.creation?.date) {
    lines.push(`- **Created**: ${qi.creation.date}`)
  }
  lines.push(`- **ID**: ${qi.id ?? 'Unknown'}`)

  const alarmCount = dashboard.alarms?.length ?? 0
  lines.push('', `### Alarms: ${alarmCount === 0 ? 'None' : alarmCount}`)

  const protection = dashboard.backupsInfo?.vmProtection ?? 'unknown'
  lines.push(`### Backup: ${protection}`)

  return lines.join('\n')
}
