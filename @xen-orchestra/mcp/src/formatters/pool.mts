import { formatBytes, markdownTable } from './format-utils.mjs'

interface PoolLike {
  id?: string
  name_label?: string
  name_description?: string
  HA_enabled?: boolean
  auto_poweron?: boolean
  master?: string
  default_SR?: string
  cpus?: { cores?: number; sockets?: number }
}

interface PoolDashboardLike {
  hosts?: {
    status?: Record<string, number>
    topFiveUsage?: {
      ram?: Array<{ id: string; name_label: string; size: number; usage: number; percent: number }>
      cpu?: Array<{ id: string; name_label: string; percent: number }>
    }
  }
  vms?: {
    status?: Record<string, number>
  }
  alarms?: string[]
}

export function formatPoolList(pools: PoolLike[]): string {
  if (pools.length === 0) return 'No pools found.'

  const headers = ['Name', 'HA', 'Auto Power On', 'Description', 'ID']
  const rows = pools.map(pool => [
    pool.name_label ?? '-',
    pool.HA_enabled ? 'Yes' : 'No',
    pool.auto_poweron ? 'Yes' : 'No',
    pool.name_description || '-',
    pool.id ?? '-',
  ])

  return `## Pools (${pools.length} found)\n\n${markdownTable(headers, rows)}`
}

export function formatPoolDetails(pool: PoolLike): string {
  const lines = [
    `## Pool: ${pool.name_label ?? 'Unknown'}`,
    '',
    `- **HA**: ${pool.HA_enabled ? 'Enabled' : 'Disabled'}`,
    `- **Auto Power On**: ${pool.auto_poweron ? 'Yes' : 'No'}`,
  ]

  if (pool.name_description) lines.push(`- **Description**: ${pool.name_description}`)
  if (pool.master) lines.push(`- **Master**: ${pool.master}`)
  if (pool.default_SR) lines.push(`- **Default SR**: ${pool.default_SR}`)
  if (pool.cpus) lines.push(`- **CPUs**: ${pool.cpus.cores ?? '?'} cores (${pool.cpus.sockets ?? '?'} sockets)`)
  lines.push(`- **ID**: ${pool.id ?? 'Unknown'}`)

  return lines.join('\n')
}

export function formatPoolDashboard(dashboard: PoolDashboardLike): string {
  const sections: string[] = ['## Pool Dashboard']

  if (dashboard.hosts?.status) {
    const entries = Object.entries(dashboard.hosts.status)
    sections.push('', '### Hosts', entries.map(([s, n]) => `- **${s}**: ${n}`).join('\n'))
  }

  if (dashboard.hosts?.topFiveUsage?.ram && dashboard.hosts.topFiveUsage.ram.length > 0) {
    const headers = ['Host', 'RAM Used', 'RAM Total', 'Usage']
    const rows = dashboard.hosts.topFiveUsage.ram.map(h => [
      h.name_label,
      formatBytes(h.usage),
      formatBytes(h.size),
      `${h.percent.toFixed(1)}%`,
    ])
    sections.push('', '### Top RAM Usage', markdownTable(headers, rows))
  }

  if (dashboard.hosts?.topFiveUsage?.cpu && dashboard.hosts.topFiveUsage.cpu.length > 0) {
    const headers = ['Host', 'CPU Usage']
    const rows = dashboard.hosts.topFiveUsage.cpu.map(h => [h.name_label, `${h.percent.toFixed(1)}%`])
    sections.push('', '### Top CPU Usage', markdownTable(headers, rows))
  }

  if (dashboard.vms?.status) {
    const entries = Object.entries(dashboard.vms.status)
    sections.push('', '### VMs', entries.map(([s, n]) => `- **${s}**: ${n}`).join('\n'))
  }

  if (dashboard.alarms && dashboard.alarms.length > 0) {
    sections.push('', `### Alarms: ${dashboard.alarms.length} active`)
  }

  return sections.join('\n')
}
