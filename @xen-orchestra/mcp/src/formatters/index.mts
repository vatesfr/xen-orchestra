import { formatVmList, formatVmDetails, formatVmDashboard } from './vm.mjs'
import { formatPoolList, formatPoolDetails, formatPoolDashboard } from './pool.mjs'
import { formatHostList, formatHostDetails } from './host.mjs'
import { formatVdiList } from './storage.mjs'
import { formatGenericList } from './generic.mjs'

type FormatterFn = (data: unknown) => string

const registry = new Map<string, FormatterFn>()

function key(tag: string, operation: string): string {
  return `${tag}:${operation}`
}

export function registerFormatter(tag: string, operation: string, fn: FormatterFn): void {
  registry.set(key(tag, operation), fn)
}

export function getFormatter(tag: string, operation: string): FormatterFn | undefined {
  return registry.get(key(tag, operation))
}

export function formatResponse(tag: string, operation: string, data: unknown): string {
  const formatter = getFormatter(tag, operation)
  if (formatter) {
    return formatter(data)
  }

  // Fallback: use generic list formatter for arrays, generic details for objects
  if (Array.isArray(data)) {
    const label = `${tag} — ${operation}`
    return formatGenericList(data as Record<string, unknown>[], label)
  }

  if (data !== null && typeof data === 'object') {
    return formatGenericDetails(data as Record<string, unknown>, `${tag} — ${operation}`)
  }

  return JSON.stringify(data, null, 2)
}

/** Fields to exclude from generic details — noisy internal data. */
const EXCLUDED_FIELDS = new Set([
  'href',
  '_xapiRef',
  '$poolId',
  'uuid',
  'xenStoreData',
  'other',
  'other_config',
  'otherConfig',
  'bios_strings',
  'current_operations',
  'blockedOperations',
])

/** Generic formatter for single objects — shows key fields as markdown bullets. */
function formatGenericDetails(obj: Record<string, unknown>, label: string): string {
  const lines = [`## ${label}`, '']

  for (const [k, v] of Object.entries(obj)) {
    if (EXCLUDED_FIELDS.has(k)) continue
    if (v === null || v === undefined || v === '') continue

    if (typeof v === 'object' && !Array.isArray(v)) {
      // Compact nested objects on one line if small
      const json = JSON.stringify(v)
      if (json.length < 100) {
        lines.push(`- **${k}**: ${json}`)
      }
    } else if (Array.isArray(v)) {
      if (v.length > 0 && v.length <= 5) {
        lines.push(`- **${k}**: ${v.join(', ')}`)
      } else if (v.length > 5) {
        lines.push(`- **${k}**: ${v.length} items`)
      }
    } else {
      lines.push(`- **${k}**: ${v}`)
    }
  }

  return lines.join('\n')
}

/** Register all built-in formatters. Called at startup. */
export function initFormatters(): void {
  // VMs — get_vm-template, get_vm-snapshot, get_vm-controller fall through to generic
  registerFormatter('vms', 'list', data => formatVmList(data as Parameters<typeof formatVmList>[0]))
  registerFormatter('vms', 'get', data => formatVmDetails(data as Parameters<typeof formatVmDetails>[0]))
  registerFormatter('vms', 'dashboard', data => formatVmDashboard(data as Parameters<typeof formatVmDashboard>[0]))

  // Pools
  registerFormatter('pools', 'list', data => formatPoolList(data as Parameters<typeof formatPoolList>[0]))
  registerFormatter('pools', 'get', data => formatPoolDetails(data as Parameters<typeof formatPoolDetails>[0]))
  registerFormatter('pools', 'dashboard', data =>
    formatPoolDashboard(data as Parameters<typeof formatPoolDashboard>[0])
  )

  // Hosts
  registerFormatter('hosts', 'list', data => formatHostList(data as Parameters<typeof formatHostList>[0]))
  registerFormatter('hosts', 'get', data => formatHostDetails(data as Parameters<typeof formatHostDetails>[0]))

  // Storage (merged domain: vdis→storage)
  registerFormatter('storage', 'list_vdis', data => formatVdiList(data as Parameters<typeof formatVdiList>[0]))
}
