import { formatVmList, formatVmDetails, formatVmDashboard } from './vm.mjs'
import { formatPoolList, formatPoolDetails, formatPoolDashboard } from './pool.mjs'
import { formatHostList, formatHostDetails } from './host.mjs'
import { formatVdiList } from './storage.mjs'
import { formatGenericList, formatGenericDetails } from './generic.mjs'

type FormatterFn = (data: unknown) => string

const registry = new Map<string, FormatterFn>()

function key(tag: string, operation: string): string {
  return `${tag}:${operation}`
}

function registerFormatter(tag: string, operation: string, fn: FormatterFn): void {
  registry.set(key(tag, operation), fn)
}

export function formatResponse(tag: string, operation: string, data: unknown): string {
  const formatter = registry.get(key(tag, operation))
  if (formatter) return formatter(data)

  const label = `${tag} — ${operation}`
  if (Array.isArray(data)) return formatGenericList(data as Record<string, unknown>[], label)
  if (data !== null && typeof data === 'object') return formatGenericDetails(data as Record<string, unknown>, label)
  return JSON.stringify(data, null, 2)
}

export function initFormatters(): void {
  registerFormatter('vms', 'list', data => formatVmList(data as Parameters<typeof formatVmList>[0]))
  registerFormatter('vms', 'get', data => formatVmDetails(data as Parameters<typeof formatVmDetails>[0]))
  registerFormatter('vms', 'dashboard', data => formatVmDashboard(data as Parameters<typeof formatVmDashboard>[0]))

  registerFormatter('pools', 'list', data => formatPoolList(data as Parameters<typeof formatPoolList>[0]))
  registerFormatter('pools', 'get', data => formatPoolDetails(data as Parameters<typeof formatPoolDetails>[0]))
  registerFormatter('pools', 'dashboard', data =>
    formatPoolDashboard(data as Parameters<typeof formatPoolDashboard>[0])
  )

  registerFormatter('hosts', 'list', data => formatHostList(data as Parameters<typeof formatHostList>[0]))
  registerFormatter('hosts', 'get', data => formatHostDetails(data as Parameters<typeof formatHostDetails>[0]))

  registerFormatter('storage', 'list_vdis', data => formatVdiList(data as Parameters<typeof formatVdiList>[0]))
}
