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

// In a pool the global configuration applies to, the tiers up to
// securityops are kept for global policies (vdf#21): a pool's own policy
// there would decide before them. xo-server-vdf global.mjs refuses it too.
export const VDF_LAST_RESERVED_TIER = 25

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

// a destination port (22) or an inclusive range as a string ("8000-8099",
// vdf#54): agents before ranges get them listed port by port
export type VdfPort = number | string

// ingress rules decide what may reach the policy's VMs, egress rules what
// they may reach (vdf#53)
export type VdfDirection = 'ingress' | 'egress'

export type VdfRule = {
  id: number
  action?: VdfRuleAction
  // ingress: the source, a group or 'any'
  from?: string
  // egress: the destination, a group or 'any'
  to?: string
  proto: VdfProtocol
  ports?: VdfPort[]
  log?: boolean
  logLabel?: string
  [unknownField: string]: unknown
}

// monitor: decides nothing, the hosts record what it would drop (vdf#13);
// absent: enforce
export type VdfPolicyMode = 'enforce' | 'monitor'

export type VdfPolicy = {
  name: string
  appliedTo: string
  tier?: number | VdfTierName
  default: VdfDefaultAction
  logDefault?: boolean
  mode?: VdfPolicyMode
  ingress: VdfRule[]
  // what its VMs may reach (vdf#53): rules and their default, pass when
  // not set; a policy without either takes no part in egress
  egress?: VdfRule[]
  egressDefault?: VdfDefaultAction
  [unknownField: string]: unknown
}

export type VdfGroup = {
  tags?: string[]
  ips?: string[]
  // network tags (vdf#36): only its VMs' interfaces on networks carrying
  // them all; every interface without
  networks?: string[]
  [unknownField: string]: unknown
}

// host-wide conntrack protection (agent/policy.go Limits)
export type VdfLimits = {
  newConnPerSec?: number
  maxConnPerVIF?: number
}

export type VdfDocument = {
  // 4 when a policy is in monitor mode (agents before it must reject the
  // document): set by serializeDocument
  version?: number
  groups: Record<string, VdfGroup>
  policies: VdfPolicy[]
  limits?: VdfLimits
  [unknownField: string]: unknown
}

// A change of a pool's document or owner made outside this XO (vdf#32):
// another XO, xe, `vdf-agent publish`, or a copy of this XO
export type VdfOutsideChange = {
  seenAt: string
  lastSeenAt: string
  // seen again after this XO wrote the pool (two writers alternating)
  times: number
  docChanged: boolean
  // the pool's global part changed
  globalChanged: boolean
  ownerChanged: boolean
  previousOwner: VdfPoolOwner | null
  owner: VdfPoolOwner | null
  // this XO's identity made it: a copy of this XO (vdf#20)
  sameIdentity: boolean
  // GET policy and GET /global: the pool still holds it
  current?: boolean
}

export type VdfPoolOwner = { id: string; name: string; since?: string }

export type VdfPublishedPolicy = {
  key: string | null
  docId: string
  text: string | null
  document: VdfDocument | null
  parseError?: string
  // whether the current user may publish to the pool (XO admin, or an
  // administrate ACL on it)
  canEdit?: boolean
  // owner: the XO whose global configuration the pool holds, if another one
  global?: { revision: number; inScope: boolean; owner?: string }
  // the last change made outside this XO
  outside?: VdfOutsideChange | null
}

export type VdfGlobalScope = {
  all?: boolean
  pools?: string[]
}

export type VdfPoolSyncState =
  | 'in-sync'
  | 'behind'
  | 'not-published'
  | 'out-of-scope'
  | 'stale-global'
  | 'unreachable'
  | 'other-xo'

export type VdfGlobalPool = {
  id: string
  name: string
  inScope: boolean
  state: VdfPoolSyncState
  docId?: string
  sync?: { at: number; ok: boolean; error?: string; state?: VdfPoolSyncState; revision?: number }
  // other-xo: the XO whose global configuration the pool holds (its id, for
  // a take over that checks nothing changed since)
  owner?: string
  ownerId?: string
  // a pool XO lost (no longer one of its objects): when XO last saw it
  seenAt?: number
  // the pool's own policies in the tiers kept for global policies (vdf#21):
  // they decide before them, and the pool can't publish until they move
  reservedTiers?: string[]
  // the last change made there outside this XO (vdf#32)
  outside?: VdfOutsideChange
}

export type VdfGlobalMember = {
  vm: string
  vmName: string
  pool: string
  poolName?: string
  ips: string[]
  trusted: boolean
  // last known: XO lost the member's pool (fail static)
  stale?: boolean
  seenAt?: number
  // its pool holds another XO's global configuration (vdf#30): it counts
  // here, its pool never gets this XO's
  otherXo?: string
}

export type VdfVmRef = Pick<VdfGlobalMember, 'vm' | 'vmName' | 'pool' | 'poolName'>

// a member's IP another VM holds too: left out of the other pools
export type VdfAddressConflict = { group: string; ip: string; member: VdfVmRef; holders: VdfVmRef[] }

// the same IP on VMs of two pools in scope
export type VdfAddressOverlap = { ip: string; holders: VdfVmRef[] }

export type VdfGlobalStatus = {
  document: VdfDocument
  revision: number
  scope: VdfGlobalScope
  publishedAt?: string
  publishedBy?: string
  pools: VdfGlobalPool[]
  members: Record<string, VdfGlobalMember[]>
  // whether the current user may change it (XO administrators only)
  canEdit?: boolean
  instance?: { id: string; name: string }
  // the XO whose configuration was imported here (vdf#20): the pools it
  // owns stay its own until taken over
  replaces?: { id: string; name: string; importedAt?: string }
  conflicts?: VdfAddressConflict[]
  overlaps?: VdfAddressOverlap[]
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
  pools?: (VdfCheckResult & {
    id: string
    name: string
    inScope: boolean
    skipped?: boolean
    unreachable?: boolean
    // the pool holds another XO's global configuration
    otherXo?: boolean
    owner?: string
    // its own policies in the tiers kept for global policies (vdf#21)
    reservedTiers?: string[]
    // a pool in scope: its own part, as it holds it (vdf#27)
    own?: VdfDocument
  })[]
  revision?: number
  // global publish saved, but not written into every pool yet
  partial?: boolean
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
  // a pool's: a change made outside this XO, publishedAt is when XO saw it
  outside?: VdfOutsideChange
  // a pool's: written by XO's global sync (the global configuration's
  // revision then), successive syncs counted in one entry
  sync?: { revision?: number; times?: number }
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
  // VIF locking of the host's protected or grouped VIFs (vdf#15); absent
  // from agents before it
  locking?: VdfHostLocking
  // when the agent stopped (SIGTERM), written as it exits: what its status
  // says no longer holds (vdf#41); absent while it runs
  stopping?: string
  // guarded VIFs (protected or quarantined) that flows VDF didn't install
  // decide for first, Traffic Rules usually (vdf#40); absent from agents
  // before it
  shadowed?: VdfShadowedVif[]
}

// a guarded VIF non-VDF flows of table 0 decide for before VDF does
export type VdfShadowedVif = {
  vm: string
  vmName: string
  vif: string
  // flows letting traffic past VDF (to NORMAL)
  allows: number
  // flows dropping traffic VDF may allow
  drops: number
  // one of them, as ovs-ofctl shows it
  sample: string
}

// a VIF the agent reports: unlocked, or locked to addresses its guest no
// longer uses (allowed and reported then)
export type VdfLockedVif = {
  vm: string
  vmName: string
  vif: string
  device: string
  network: string
  networkName?: string
  // a policy applies to it (else only a group selects it)
  protected?: boolean
  allowed?: string[]
  reported?: string[]
}

// counts are complete, lists capped (20 per host)
export type VdfHostLocking = {
  unlocked: number
  unlockedVifs?: VdfLockedVif[]
  stale: number
  staleVifs?: VdfLockedVif[]
  // VDF locks (vdf#41), absent from agents before them: the agent enforces
  // VIF.other_config['vdf:locking'] = 'locked'; how many it enforces; the
  // VIFs (uuids) whose VDF lock it enforces now (complete: trust follows
  // it); those with the key it can't enforce (why one isn't)
  vdfLock?: boolean
  vdfLocked?: number
  vdfEnforced?: string[]
  vdfUnenforced?: string[]
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
  // a stage of the source's egress tiers (vdf#53)
  egress?: boolean
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
  // the source's egress rule that let it out (vdf#53)
  egressRule?: number
  revoked: boolean
  // revoked by the source's egress rather than its destination
  egressRevoked?: boolean
  srcVm: string
  dstVm: string
}

export type VdfBlockedAttempt = {
  srcVm: string
  srcIp: string
  dstVm: string
  perSec: number
  revoked: boolean
  // dropped by the source's egress (vdf#53): its default (no dstVm), or
  // with revoked its revocations
  egress?: boolean
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
  // the last minutes' samples, oldest first (vdf#59): an agent before it
  // has none
  history?: VdfStatsPoint[]
}

export type VdfStatsPoint = {
  at: string
  allowedPerSec: number
  blockedPerSec: number
  // the VMs with any: uuid -> [allowed, dropped] per second
  vms?: Record<string, [number, number]>
}

export type VdfRuleLogEntry = {
  time: string
  verdict: 'ALLOW' | 'DROP'
  policy: string
  tier: string
  // an egress rule or default (vdf#53): vm is the source
  egress?: boolean
  rule: string
  label?: string
  proto: string
  src: string
  sport?: string
  dst: string
  dport?: string
  // the VM whose policy decided: the destination, or for egress the source
  vm?: string
  suppressed?: number
  host: string
  hostName: string
}

// What the pool's monitored policies would drop if enforced, from every
// host (GET /plugins/vdf/pools/:id/monitor): one entry per source, VM,
// protocol, port, policy and rule, among the connections allowed today
export type VdfMonitorEntry = {
  src: string // an IP, or "other" for the flows past a rule's quota
  vm: string // the destination VM, or for egress the source VM
  vmName: string
  // its interface, when it has several protected ones (vdf#36)
  vif?: string
  // what the VM starts (vdf#53): an egress rule or default would drop it,
  // to dst (an IP, or "other" past the rule's quota)
  egress?: boolean
  dst?: string
  proto: string
  port?: number
  policy: string
  tier: string
  rule?: number // 0 or absent: the policy's default
  pass?: boolean // a pass rule: enforcing it sends the connection to a later drop
  count: number // sampled packets: a lower bound
  first: string
  last: string
  expired?: boolean // the policy is no longer monitored there
  hosts?: string[]
}

export type VdfMonitorReport = {
  entries: VdfMonitorEntry[]
  keepDays?: number
  errors: { host: string; hostName: string; error: string }[]
}
