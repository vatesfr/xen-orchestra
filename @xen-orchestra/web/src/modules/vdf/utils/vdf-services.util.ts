import type { VdfDocument, VdfHostServices, VdfService, VdfServiceKind } from '@/modules/vdf/types.ts'
import { isNetworksOnly } from '@/modules/vdf/utils/vdf-networks.util.ts'

// DECLARED INFRASTRUCTURE SERVICES (vdf#103): the DHCP servers and routers
// of the networks VDF guards. The agent's check (agent/policy.go
// checkServices) decides; XO says the same before asking it.

export const VDF_SERVICE_KINDS: VdfServiceKind[] = ['dhcp4', 'dhcp6', 'router']

export const isServiceMonitored = (service: Pick<VdfService, 'mode'>) => service.mode === 'monitor'

// a unicast, non-zero MAC, as the agent parses it (Go's net.ParseMAC: six
// bytes, colons or dashes)
const MAC = /^[0-9a-f]{2}([:-])[0-9a-f]{2}(\1[0-9a-f]{2}){4}$/i

export const isMac = (text: string) => MAC.test(text)

// what the agent compares: lower case, colons
export const canonMac = (text: string) => text.toLowerCase().replace(/-/g, ':')

export type VdfServiceError =
  | { type: 'name-required' }
  | { type: 'name-taken' }
  | { type: 'kind' }
  | { type: 'unknown-group'; group: string }
  // a group on networks alone (vdf#98) would trust every interface there
  | { type: 'networks-only'; group: string }
  | { type: 'selects-nothing'; group: string }
  // addresses alone: any guest whose traffic arrives through the uplink
  // can forge one
  | { type: 'mac-required'; group: string }
  | { type: 'invalid-mac'; mac: string }
  | { type: 'multicast-mac'; mac: string }

// The errors of one service in a document (the other services: names
// taken), as the agent's check would report them, first first
export function serviceErrors(document: VdfDocument, service: VdfService, otherNames: string[] = []) {
  const errors: VdfServiceError[] = []
  const name = service.name ?? ''

  if (name === '' || name.trim() !== name) {
    errors.push({ type: 'name-required' })
  } else if (otherNames.includes(name)) {
    errors.push({ type: 'name-taken' })
  }

  if (!VDF_SERVICE_KINDS.includes(service.kind)) {
    errors.push({ type: 'kind' })
  }

  const group = document.groups[service.group]
  const macs = service.macs ?? []

  if (group === undefined) {
    errors.push({ type: 'unknown-group', group: service.group })
  } else if (isNetworksOnly(group)) {
    errors.push({ type: 'networks-only', group: service.group })
  } else {
    const selects = (group.tags ?? []).length > 0 || (group.networks ?? []).length > 0
    const ips = group.ips ?? []

    if (!selects && ips.length === 0 && macs.length === 0) {
      errors.push({ type: 'selects-nothing', group: service.group })
    } else if (ips.length > 0 && macs.length === 0) {
      errors.push({ type: 'mac-required', group: service.group })
    }
  }

  for (const mac of macs) {
    if (!isMac(mac)) {
      errors.push({ type: 'invalid-mac', mac })
    } else if ((parseInt(mac.slice(0, 2), 16) & 1) !== 0 || /^(00[:-]){5}00$/.test(mac)) {
      errors.push({ type: 'multicast-mac', mac })
    }
  }

  return errors
}

// every service's errors, by service name
export function documentServiceErrors(document: VdfDocument) {
  const services = document.services ?? []

  return services.map((service, index) => ({
    service: service.name,
    errors: serviceErrors(
      document,
      service,
      services.filter((_, other) => other < index).map(other => other.name)
    ),
  }))
}

// the services that name a group
export const servicesOfGroup = (document: VdfDocument, groupName: string) =>
  (document.services ?? []).filter(service => service.group === groupName).map(service => service.name)

// the kinds an enforced service declares (a monitored one keeps today's
// trust)
export const declaredKinds = (document: VdfDocument) =>
  VDF_SERVICE_KINDS.filter(kind =>
    (document.services ?? []).some(service => service.kind === kind && !isServiceMonitored(service))
  )

// THE HOSTS' REPORT (vdf:status `services`), for a pool: per undeclared
// kind the hosts saying so (they have protected VMs), the sampled
// undeclared sources merged across hosts (by kind and address), the notes
// and the bridges where forged MACs aren't dropped, each with its host
export type VdfServicesReport = {
  undeclared: { kind: VdfServiceKind; hosts: string[] }[]
  seen: { kind: VdfServiceKind; src: string; count: number; last: string; hosts: string[] }[]
  notes: { host: string; text: string }[]
  unenforced: { host: string; bridge: string }[]
}

export function servicesReport(hosts: { name: string; services: VdfHostServices | undefined }[]): VdfServicesReport {
  const report: VdfServicesReport = { undeclared: [], seen: [], notes: [], unenforced: [] }
  const seen = new Map<string, VdfServicesReport['seen'][number]>()

  for (const { name, services } of [...hosts].sort((a, b) => a.name.localeCompare(b.name))) {
    for (const kind of services?.undeclared ?? []) {
      const entry = report.undeclared.find(other => other.kind === kind)

      if (entry === undefined) {
        report.undeclared.push({ kind, hosts: [name] })
      } else {
        entry.hosts.push(name)
      }
    }

    for (const sample of services?.seen ?? []) {
      const key = `${sample.kind} ${sample.src}`
      const entry = seen.get(key)

      if (entry === undefined) {
        seen.set(key, { ...sample, hosts: [name] })
      } else {
        entry.count += sample.count
        entry.last = sample.last > entry.last ? sample.last : entry.last
        entry.hosts.push(name)
      }
    }

    report.notes.push(...(services?.notes ?? []).map(text => ({ host: name, text })))
    report.unenforced.push(...(services?.unenforced ?? []).map(bridge => ({ host: name, bridge })))
  }

  report.undeclared.sort((a, b) => VDF_SERVICE_KINDS.indexOf(a.kind) - VDF_SERVICE_KINDS.indexOf(b.kind))
  // the most recent first
  report.seen = [...seen.values()].sort((a, b) => b.last.localeCompare(a.last) || a.src.localeCompare(b.src))

  return report
}

export const isEmptyReport = (report: VdfServicesReport) =>
  report.undeclared.length + report.seen.length + report.notes.length + report.unenforced.length === 0
