// Vates Distributed Firewall: the policy document as stored in the pool
// (pool.other_config "vdf:policy*" keys, written by the hosts' vdf-agent)
// and what the agents report back.

export const VDF_TIERS = [
  { name: 'emergency', value: 0 },
  { name: 'securityops', value: 25 },
  { name: 'networkops', value: 50 },
  { name: 'platform', value: 75 },
  { name: 'application', value: 100 },
  { name: 'baseline', value: 110 },
] as const

export type VdfTierName = (typeof VDF_TIERS)[number]['name']

export const VDF_APPLICATION_TIER = 100

export const VDF_QUARANTINE_TAG = 'vdf:quarantine'

export const VDF_TAG_PREFIX = 'vdf:'

// XO-wide configuration (xo-server-vdf global.mjs): in a pool's document,
// XO owns the groups and policies named `global:*` and the rule ids from
// VDF_GLOBAL_RULE_BASE up
export const VDF_GLOBAL_SCOPE = 'global'

export const VDF_GLOBAL_PREFIX = 'global:'

export const VDF_GLOBAL_RULE_BASE = 0x800000

// a pool's id, or VDF_GLOBAL_SCOPE
export type VdfScopeId = string

export type VdfRuleAction = 'allow' | 'drop' | 'pass'

export type VdfDefaultAction = 'allow' | 'drop' | 'pass'

export type VdfProtocol = 'tcp' | 'udp' | 'icmp' | 'any'

export type VdfRule = {
  id: number
  action?: VdfRuleAction
  from: string
  proto: VdfProtocol
  ports?: number[]
  log?: boolean
  logLabel?: string
  [unknownField: string]: unknown
}

export type VdfPolicy = {
  name: string
  appliedTo: string
  tier?: number | VdfTierName
  default: VdfDefaultAction
  logDefault?: boolean
  ingress: VdfRule[]
  [unknownField: string]: unknown
}

export type VdfGroup = {
  tags?: string[]
  ips?: string[]
  [unknownField: string]: unknown
}

// host-wide conntrack protection (agent/policy.go Limits)
export type VdfLimits = {
  newConnPerSec?: number
  maxConnPerVIF?: number
}

export type VdfDocument = {
  groups: Record<string, VdfGroup>
  policies: VdfPolicy[]
  limits?: VdfLimits
  [unknownField: string]: unknown
}

export type VdfPublishedPolicy = {
  key: string | null
  docId: string
  text: string | null
  document: VdfDocument | null
  parseError?: string
  global?: { revision: number; inScope: boolean }
}

export type VdfGlobalScope = {
  all?: boolean
  pools?: string[]
}

export type VdfPoolSyncState = 'in-sync' | 'behind' | 'not-published' | 'out-of-scope' | 'stale-global' | 'unreachable'

export type VdfGlobalPool = {
  id: string
  name: string
  inScope: boolean
  state: VdfPoolSyncState
  docId?: string
  sync?: { at: number; ok: boolean; error?: string; state?: VdfPoolSyncState; revision?: number }
}

export type VdfGlobalMember = {
  vm: string
  vmName: string
  pool: string
  poolName?: string
  ips: string[]
  trusted: boolean
}

export type VdfGlobalStatus = {
  document: VdfDocument
  revision: number
  scope: VdfGlobalScope
  publishedAt?: string
  publishedBy?: string
  pools: VdfGlobalPool[]
  members: Record<string, VdfGlobalMember[]>
}

// the global configuration as edited: the document and where it applies
export type VdfGlobalDocument = VdfDocument & { scope: VdfGlobalScope }

export type VdfCheckResult = {
  ok: boolean
  error?: string
  warnings?: string[]
  version?: number
  keys?: string[]
  document?: string
  published?: boolean
  // global configuration: one result per pool
  pools?: (VdfCheckResult & { id: string; name: string; inScope: boolean; skipped?: boolean; unreachable?: boolean })[]
  revision?: number
  // pool publish refused: the pool's document isn't the one the edit
  // started from (docId: what it holds)
  conflict?: boolean
  docId?: string
}

// Publish history (xo-server-vdf history.mjs): the last documents XO
// published, per scope. A pool's summary counts its own part.
export type VdfHistorySummary = {
  added: number
  removed: number
  modified: number
  groups: number
  policies: number
  rules: number
}

export type VdfHistoryEntry = {
  id: number
  // a pool's: the document id, and the one it replaced
  docId?: string
  previousDocId?: string | null
  // the global configuration's
  revision?: number
  scope?: VdfGlobalScope
  // null: what the pool held before XO kept a history
  publishedAt: string | null
  publishedBy: string | null
  summary: VdfHistorySummary
}

export type VdfHistoryVersion = VdfHistoryEntry & {
  document: VdfDocument
  // the version it replaced, if still kept
  previous: (VdfHistoryEntry & { document: VdfDocument }) | null
}

// host.other_config["vdf:status"], written by each host's agent
export type VdfHostStatusDocument = {
  agent?: string
  started?: string
  heartbeat?: string
  heartbeatSec?: number
  lastLoop?: string
  source?: string
  doc?: string
  published?: string
  rejected?: string
  gen?: Record<string, string>
  appliedAt?: string
  errors?: string[]
  saturated?: string[]
  policies?: { name: string; tier: string; vifs: number; realized: boolean; reason?: string }[]
}

export type VdfHostState = 'up-to-date' | 'behind' | 'rejected' | 'stale' | 'unknown' | 'disabled'

export type VdfTraceEnd = {
  spec: string
  vm?: string
  uuid?: string
  ip: string
  mac?: string
  vif?: string
  host?: string
  external?: boolean
}

export type VdfTraceStage = {
  table: number
  priority: number
  match: string
  actions?: string[]
  vdf: boolean
  kind: string
  text: string
  tier?: number
  policy?: string
  rule?: number
  action?: string
  decides: boolean
}

export type VdfTraceHop = {
  host: string
  side: string
  bridge: string
  packet: string
  conntrack: string
  stages: VdfTraceStage[]
  datapath_actions: string
  delivered: boolean
  policy_allowed: boolean
  l2?: string
  stale?: string
  decision?: VdfTraceStage
  model?: { allowed: boolean; rule?: number; agrees: boolean }
  otherwise?: string
}

export type VdfTraceResult = {
  from: VdfTraceEnd
  to: VdfTraceEnd
  proto: VdfProtocol
  port?: number
  state: string
  broadcast?: boolean
  allowed: boolean
  not_delivered?: boolean
  summary: string
  hops: VdfTraceHop[]
}

export type VdfTraceRequest = {
  from: string
  to: string
  proto: VdfProtocol
  port?: number
  state?: 'new' | 'established' | 'revoked'
  broadcast?: boolean
}

export type VdfRuleStat = {
  id: number
  policy: string
  label: string
  action: string
  hitsPerSec: number
  live: number
}

export type VdfVmStat = {
  name: string
  uuid: string
  conns: number
  allowedPerSec: number
  blockedPerSec: number
  spoofPerSec: number
  invalidPerSec: number
  saturated: boolean
  unlocked: boolean
  quarantined: boolean
  unprotected: boolean
}

export type VdfConnection = {
  proto: string
  src: string
  sport: string
  dst: string
  dport: string
  state: string
  rule: number
  revoked: boolean
  srcVm: string
  dstVm: string
}

export type VdfBlockedAttempt = {
  srcVm: string
  srcIp: string
  dstVm: string
  perSec: number
  revoked: boolean
}

export type VdfHostStats = {
  host: string
  hostName: string
  error?: string
  at?: string
  agentActive?: boolean
  conntrack?: { count: number; max: number }
  newAllowedPerSec?: number
  newBlockedPerSec?: number
  ceiling?: number
  rules?: VdfRuleStat[]
  vms?: VdfVmStat[]
  connections?: VdfConnection[]
  connectionsTruncated?: boolean
  blocked?: VdfBlockedAttempt[]
}

export type VdfRuleLogEntry = {
  time: string
  verdict: 'ALLOW' | 'DROP'
  policy: string
  tier: string
  rule: string
  label?: string
  proto: string
  src: string
  sport?: string
  dst: string
  dport?: string
  vm?: string
  suppressed?: number
  host: string
  hostName: string
}
