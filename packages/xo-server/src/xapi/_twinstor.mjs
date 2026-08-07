// TWINSTOR is a 2-node replicated storage: the SR is backed by a DRBD resource
// mirrored between the two hosts of the pool. Its daemon advertises the live
// replication state in `other_config`, under the `twinstor-*` namespace, which
// XO reads to pace rolling pool updates and reboots.
//
// The SR keys are written by the pool master only, each host stamps its own
// liveness on its own record, and every value is a string.

// SR record
const SCHEMA = 'twinstor-schema'
const MANAGED = 'twinstor-managed'
const SYNCED = 'twinstor-synced'
const STATE = 'twinstor-storage-state'
const SYNC_PCT = 'twinstor-sync-pct'
const SYNC_ETA = 'twinstor-sync-eta'
const UPDATED_AT = 'twinstor-updated-at'

// host record
const ALIVE = 'twinstor-alive'
const VERSION = 'twinstor-version'

// the pool master refreshes UPDATED_AT every minute, this leaves room for a
// missed beat, for XAPI propagation and for a bit of clock skew
export const TWINSTOR_STALE_PERIOD = 5 * 60 * 1e3

// same value TWINSTOR uses for the same purpose in its own restart interlock
export const TWINSTOR_ALIVE_STALE_PERIOD = 150 * 1e3

// the daemon bumps its schema when the meaning of the keys changes, so a
// `twinstor-synced` from an unknown one cannot be taken at face value
const SUPPORTED_SCHEMAS = new Set(['1'])

const STATE_DESCRIPTIONS = {
  degraded: 'only one replica is available, the storage has no redundant copy',
  'not-ready': 'no up-to-date replica is available',
  stalled: 'a resync is running but is not making progress',
  synced: 'both replicas are up to date',
  syncing: 'a replica is catching up',
}

// `Number('')` is 0, which would date an advertisement to 1970 or invent a 0%
// resync: a key which is present but empty is not a number
function parseNumber(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function parseStamp(value) {
  const seconds = parseNumber(value)
  return seconds === undefined ? undefined : seconds * 1e3
}

// a stamp far in the future is as unusable as an old one: it means the clocks
// disagree, so the age cannot be established either way
const isFresh = (stamp, now, stalePeriod) => stamp !== undefined && Math.abs(now - stamp) < stalePeriod

// any one of the identifying keys is enough: they are written in the same call,
// but failing to recognize TWINSTOR is the dangerous direction
export function isTwinstorSr(otherConfig) {
  return otherConfig?.[MANAGED] === 'true' || otherConfig?.[SYNCED] !== undefined || otherConfig?.[SCHEMA] !== undefined
}

// true for a host TWINSTOR has ever been installed on, which an uninstall never
// clears: not usable to decide whether a pool is TWINSTOR-backed
export function isTwinstorHost(otherConfig) {
  return otherConfig?.[VERSION] !== undefined
}

// DRBD keeps replicating in the kernel without the daemon, so the storage can
// look perfectly healthy while one node has no supervision at all. TWINSTOR
// refuses to restart even its own daemon in that state, and rebooting the host
// is a superset of that.
export function isTwinstorDaemonAlive(
  otherConfig,
  { now = Date.now(), stalePeriod = TWINSTOR_ALIVE_STALE_PERIOD } = {}
) {
  return isFresh(parseStamp(otherConfig?.[ALIVE]), now, stalePeriod)
}

// A host which just rebooted leaves the last advertisement frozen at
// `synced=true`, since that is what allowed the reboot. Age alone does not
// settle it, so callers must also require the advertisement to have been
// published after the reboot they are pacing.
export function parseTwinstorSrState(otherConfig, { now = Date.now(), stalePeriod = TWINSTOR_STALE_PERIOD } = {}) {
  const updatedAt = parseStamp(otherConfig?.[UPDATED_AT])
  const isStale = !isFresh(updatedAt, now, stalePeriod)
  const state = otherConfig?.[STATE]
  const eta = parseNumber(otherConfig?.[SYNC_ETA])

  // an absent schema is a daemon predating the key set: nothing to be
  // incompatible with
  const schema = otherConfig?.[SCHEMA]

  return {
    // the daemon only republishes the keys it believes changed, against a cache
    // which outlives a pool-master change and cannot see an outside edit of the
    // record: requiring the flag and the state to agree makes any such
    // divergence fail closed
    isSynced: !isStale && otherConfig?.[SYNCED] === 'true' && state === 'synced',
    isStale,
    isSchemaSupported: schema === undefined || SUPPORTED_SCHEMAS.has(schema),
    schema,
    state,
    progress: parseNumber(otherConfig?.[SYNC_PCT]),
    // the daemon reports -1 for "unknown", which is not an ETA
    eta: eta !== undefined && eta >= 0 ? eta : undefined,
    updatedAt,
  }
}

export function describeTwinstorState({ isStale, state, progress, eta, updatedAt }, { now = Date.now() } = {}) {
  if (isStale) {
    const age =
      updatedAt === undefined
        ? 'the pool master never published one'
        : `the last one is ${Math.round(Math.abs(now - updatedAt) / 6e4)} minutes old`
    return `TWINSTOR state is unknown (${age}): check that the daemon is running on the pool master and that its clock is in sync with XO`
  }

  let description = STATE_DESCRIPTIONS[state]
  if (description === undefined) {
    return state === undefined ? 'TWINSTOR published no state' : `unrecognized TWINSTOR state ${JSON.stringify(state)}`
  }

  if (state === 'syncing' || state === 'stalled') {
    // report whichever half is known
    const details = []
    if (progress !== undefined) {
      details.push(`${progress}%`)
    }
    if (eta !== undefined) {
      details.push(`~${Math.round(eta / 60)} min left`)
    }
    if (details.length > 0) {
      description += ` (${details.join(', ')})`
    }
  }
  return description
}
