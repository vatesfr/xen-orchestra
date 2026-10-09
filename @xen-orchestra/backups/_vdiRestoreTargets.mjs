import { createLogger } from '@xen-orchestra/log'

const { warn } = createLogger('xo:backups:vdiRestoreTargets')

/**
 * Copy the disk onto an SR, the historical behavior.
 *
 * @typedef {object} RestoreVdiTarget
 * @property {'restore'} type
 * @property {string} [sr] - uuid of the destination SR, the restore's default SR when undefined
 * @property {boolean} useDifferential - currently always the job-wide `useDifferentialRestore`
 */

/**
 * Attach the backup disk itself to the restored VM, through a live mount: no copy, read only —
 * unless it is cached, which makes it read/write.
 *
 * @typedef {object} LiveMountVdiTarget
 * @property {'live-mount'} type
 * @property {string} host - uuid of the host the disk is attached to
 * @property {string} [cacheSr] - uuid of the SR of the local VDI the disk is materialized into, which
 * also holds the writes, lost on unmount
 */

/**
 * Leave the disk out of the restored VM.
 *
 * @typedef {object} IgnoreVdiTarget
 * @property {'ignore'} type
 */

/**
 * @typedef {RestoreVdiTarget | LiveMountVdiTarget | IgnoreVdiTarget} VdiRestoreTarget
 */

const isNonEmptyString = value => typeof value === 'string' && value !== ''

function invalidTarget(vdiUuid, message) {
  return new Error(`invalid restore target for VDI ${vdiUuid}: ${message}`)
}

/**
 * Normalized, per-VDI restore targets of one VM backup restore.
 *
 * Built by {@link normalizeVdiRestoreTargets}, never directly: the constructor expects entries
 * that are already validated.
 */
class VdiRestoreTargets {
  #default
  #targets

  constructor(targets, defaultTarget) {
    this.#targets = targets
    this.#default = defaultTarget
  }

  /**
   * Target of a VDI, defaulting to a plain restore onto the restore's default SR.
   *
   * @param {string} vdiUuid - uuid of the VDI *as stored in the backup metadata*, i.e. the uuid of
   * the snapshot the backup was taken from, which is also what `formatVmBackups` exposes as
   * `disks[].uuid`
   * @returns {VdiRestoreTarget}
   */
  get(vdiUuid) {
    return this.#targets.get(vdiUuid) ?? this.#default
  }

  /**
   * The explicitly mapped VDIs, as `[vdiUuid, target]` pairs.
   *
   * A VDI absent from it is not untargeted: it simply uses the default target.
   *
   * @returns {IterableIterator<[string, VdiRestoreTarget]>}
   */
  entries() {
    return this.#targets.entries()
  }

  /** uuids of the VDIs that must not be restored at all */
  getIgnoredVdiUuids() {
    return this.#uuidsOfType('ignore')
  }

  /** uuids of the VDIs that must be live mounted instead of copied */
  getLiveMountedVdiUuids() {
    return this.#uuidsOfType('live-mount')
  }

  /**
   * The single host every live mount of this restore is attached to, `undefined` when there is no
   * live mount at all.
   *
   * Each live mount introduces an SR plugged on one host only, so a VM holding mounts from two
   * different hosts could never run: this is rejected instead of building it.
   */
  getLiveMountHost() {
    let host
    for (const [vdiUuid, target] of this.#targets) {
      if (target.type !== 'live-mount') {
        continue
      }
      if (host === undefined) {
        host = target.host
      } else if (host !== target.host) {
        throw invalidTarget(
          vdiUuid,
          `all the disks live mounted by a restore must use the same host, got ${host} and ${target.host}`
        )
      }
    }
    return host
  }

  #uuidsOfType(type) {
    const uuids = new Set()
    for (const [vdiUuid, target] of this.#targets) {
      if (target.type === type) {
        uuids.add(vdiUuid)
      }
    }
    return uuids
  }
}

/**
 * Whether a raw `mapVdisSrs` setting asks for at least one live mount.
 *
 * Kept separate from the normalization so the code paths that simply cannot honor a live mount
 * (backup health check, a full backup) can reject it without validating the rest of the setting.
 *
 * @param {object} [mapVdisSrs]
 * @returns {boolean}
 */
export function hasLiveMountTarget(mapVdisSrs) {
  return Object.values(mapVdisSrs ?? {}).some(value => value?.type === 'live-mount')
}

/**
 * Whether a raw `mapVdisSrs` setting asks for at least one cached, hence read/write, live mount.
 *
 * Such a mount needs the VM of the appliance serving it, which the caller has to look up.
 *
 * @param {object} [mapVdisSrs]
 * @returns {boolean}
 */
export function hasCachedLiveMountTarget(mapVdisSrs) {
  return Object.values(mapVdisSrs ?? {}).some(value => value?.type === 'live-mount' && value.cacheSr !== undefined)
}

/**
 * Normalize the `mapVdisSrs` restore setting into per-VDI targets.
 *
 * Accepts both the current shape, `{ [vdiUuid]: VdiRestoreTarget }`, and the legacy one, where a
 * value was either an SR uuid or `null` to skip the disk entirely.
 *
 * @param {object} [mapVdisSrs] - the raw setting, keyed by the VDI uuid found in the backup metadata
 * @param {object} [options]
 * @param {boolean} [options.useDifferentialRestore] - job-wide differential restore setting
 * @returns {VdiRestoreTargets}
 */
export function normalizeVdiRestoreTargets(mapVdisSrs, { useDifferentialRestore = false } = {}) {
  const targets = new Map()

  for (const [vdiUuid, value] of Object.entries(mapVdisSrs ?? {})) {
    // legacy: `null` meant "do not restore this disk"
    if (value === null) {
      targets.set(vdiUuid, { type: 'ignore' })
      continue
    }

    // an absent entry and an explicitly undefined one mean the same thing: the default target
    if (value === undefined) {
      continue
    }

    // legacy: a bare uuid meant "restore this disk onto that SR"
    if (typeof value === 'string') {
      targets.set(vdiUuid, { type: 'restore', sr: value, useDifferential: useDifferentialRestore })
      continue
    }

    if (typeof value !== 'object') {
      throw invalidTarget(vdiUuid, `expected an object, an SR uuid or null, got ${typeof value}`)
    }

    targets.set(vdiUuid, normalizeTarget(vdiUuid, value, useDifferentialRestore))
  }

  return new VdiRestoreTargets(targets, {
    type: 'restore',
    sr: undefined,
    useDifferential: useDifferentialRestore,
  })
}

function normalizeTarget(vdiUuid, value, useDifferentialRestore) {
  const { type } = value
  if (type === 'ignore') {
    return { type: 'ignore' }
  }

  if (type === 'live-mount') {
    const { cacheSr, host } = value
    if (!isNonEmptyString(host)) {
      throw invalidTarget(vdiUuid, 'a live mount requires the id of the host the disk is attached to')
    }
    if (cacheSr === undefined) {
      return { type: 'live-mount', host }
    }
    if (!isNonEmptyString(cacheSr)) {
      throw invalidTarget(vdiUuid, `expected the uuid of the cache SR, got ${typeof cacheSr}`)
    }
    return { type: 'live-mount', host, cacheSr }
  }

  if (type === 'restore') {
    const { sr, useDifferential } = value
    // `null` is not "no SR chosen": it already means "do not restore this disk", so a caller
    // meaning that must say so with its own type, and one meaning "the restore's SR" omits `sr`
    if (sr === null) {
      throw invalidTarget(vdiUuid, 'a null SR means the disk is not restored: use { type: "ignore" }')
    }
    if (sr !== undefined && !isNonEmptyString(sr)) {
      throw invalidTarget(vdiUuid, `expected an SR uuid, got ${typeof sr}`)
    }
    if (useDifferential !== undefined && useDifferential !== useDifferentialRestore) {
      // a per disk value is part of the shape for a future restore form, but nothing reads it yet:
      // say so instead of silently restoring the disk the other way
      warn('per disk useDifferential is not implemented yet, using the job setting', {
        jobSetting: useDifferentialRestore,
        requested: useDifferential,
        vdiUuid,
      })
    }
    return { type: 'restore', sr, useDifferential: useDifferentialRestore }
  }

  throw invalidTarget(vdiUuid, `unknown type ${JSON.stringify(type)}`)
}
