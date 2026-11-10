import { isExportSensitiveParam, OBFUSCATED_VALUE, obfuscate, redact } from '@vates/obfuscate'
import { format, parse } from 'xo-remote-parser'

import type { SupportBundleGroup } from './support-bundle.type.mjs'

// shorter secrets (e.g. `true`, `1234`) would match unrelated values, their absence is not checked
const MIN_CHECKED_SECRET_LENGTH = 6

// authTokens are useless in a support bundle, ACLs will be handled by the REST API RBAC
export const CONFIG_ENTRIES_BY_GROUP: Partial<Record<SupportBundleGroup, string[]>> = {
  pools: ['xenServers'],
  backups: ['jobs', 'schedules', 'remotes', 'proxies'],
  users: ['users', 'groups'],
  plugins: ['plugins'],
  misc: ['tags', 'cloudConfigs', 'ipPools', 'resourceSets'],
}

// always read, even when not exported, to know the secrets that must not leak
export const SECRET_SOURCE_CONFIG_ENTRIES = ['xenServers', 'remotes', 'proxies', 'plugins', 'users']

const VM_XAPI_TYPES = new Set([
  'crashdump',
  'pvs_proxy',
  'vbd',
  'vbd_metrics',
  'vdi',
  'vgpu',
  'vif',
  'vif_metrics',
  'vm',
  'vm_appliance',
  'vm_guest_metrics',
  'vm_metrics',
  'vmpp',
  'vmss',
  'vtpm',
  'vusb',
])
const EXCLUDED_XAPI_TYPES = new Set(['event', 'secret', 'session'])

export function getXapiTypeGroup(type: string): SupportBundleGroup | undefined {
  const lcType = type.toLowerCase()
  if (EXCLUDED_XAPI_TYPES.has(lcType)) {
    return undefined
  }
  if (lcType === 'message') {
    return 'xapiMessages'
  }
  return VM_XAPI_TYPES.has(lcType) ? 'vms' : 'pools'
}

type ConfigItem = Record<string, unknown>

function redactRemote(remote: ConfigItem): ConfigItem {
  const { url, options } = remote
  const redacted = redact(remote)
  if (typeof url === 'string') {
    // keep the URL structure (type, host, path…) so that the restored XO UI stays usable
    const parsedUrl = parse(url)
    redacted.url = parsedUrl.type === undefined ? OBFUSCATED_VALUE : format(obfuscate(parsedUrl))
  }
  // never mounted from a support bundle, whatever they contain
  if (options !== undefined) {
    redacted.options = OBFUSCATED_VALUE
  }
  return redacted
}

function redactWholeField(field: string) {
  return (item: ConfigItem): ConfigItem => {
    const redacted = redact(item)
    if (item[field] !== undefined) {
      redacted[field] = OBFUSCATED_VALUE
    }
    return redacted
  }
}

const CONFIG_ITEM_REDACTORS: Record<string, (item: ConfigItem) => ConfigItem> = {
  cloudConfigs: redactWholeField('template'),
  plugins: redactWholeField('configuration'),
  remotes: redactRemote,
  xenServers: redactWholeField('httpProxy'),
}

export function redactConfigEntry(entry: string, data: unknown): unknown {
  const redactItem = CONFIG_ITEM_REDACTORS[entry]
  if (redactItem === undefined || !Array.isArray(data)) {
    return redact(data)
  }
  return data.map(redactItem)
}

export function redactXapiRecord(type: string, record: Record<string, unknown>): Record<string, unknown> {
  const redacted = redact(record)
  // free-form, may contain cloud-init secrets or XO's own configuration
  const xenstoreData = record.xenstore_data
  if (type.toLowerCase() === 'vm' && typeof xenstoreData === 'object' && xenstoreData !== null) {
    redacted.xenstore_data = Object.fromEntries(Object.keys(xenstoreData).map(key => [key, OBFUSCATED_VALUE]))
  }
  return redacted
}

function addSecret(secrets: Set<string>, value: unknown): void {
  if (typeof value === 'string') {
    // XAPI refs (e.g. `pool.repository_proxy_password`) point to `secret` records, which are collected separately
    if (value.length >= MIN_CHECKED_SECRET_LENGTH && value !== OBFUSCATED_VALUE && !value.startsWith('OpaqueRef:')) {
      secrets.add(value)
    }
  } else if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(item => addSecret(secrets, item))
  }
}

/** add every value stored under a sensitive key, at any depth */
export function collectSecrets(secrets: Set<string>, value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    return
  }
  for (const [key, item] of Object.entries(value)) {
    if (isExportSensitiveParam(key)) {
      addSecret(secrets, item)
    } else {
      collectSecrets(secrets, item)
    }
  }
}

export function collectConfigSecrets(secrets: Set<string>, entry: string, data: unknown): void {
  collectSecrets(secrets, data)
  if (entry === 'remotes' && Array.isArray(data)) {
    for (const { url } of data as ConfigItem[]) {
      if (typeof url === 'string') {
        // SMB password, S3/Azure secret and encryption key are inside the URL
        collectSecrets(secrets, parse(url))
      }
    }
  }
}

export function collectXapiSecrets(secrets: Set<string>, type: string, record: Record<string, unknown>): void {
  if (type.toLowerCase() === 'secret') {
    addSecret(secrets, record.value)
  } else {
    collectSecrets(secrets, record)
  }
}

// written by `openRpuTrace()` in xo-server/src/_rpuObservability.mjs: `<kind>-<poolId>-<timestamp>.<ext>`
const RPU_TRACE_FILE_RE = /^(?:rpu-finalize|rpu|rpr)-(.+)-\d{8}T\d{9}Z\.(?:ndjson|heartbeat\.json)$/

/** pool of an RPU/RPR trace or heartbeat file, `undefined` for any other file (e.g. a heartbeat being written) */
export function getRpuTracePoolId(fileName: string): string | undefined {
  return RPU_TRACE_FILE_RE.exec(fileName)?.[1]
}

export type RpuTraceLine = { data: unknown } | { raw: string }

/** a line of a trace file, kept as text when it is not valid JSON, like the last line of a trace cut by a crash */
export function parseRpuTraceLine(text: string): RpuTraceLine {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { raw: text }
  }
  return { data: redact(data) }
}
