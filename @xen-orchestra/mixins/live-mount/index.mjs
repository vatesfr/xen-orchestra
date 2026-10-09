import { asyncEach } from '@vates/async-each'
import { CachedDiskBlockDevice, DiskBlockDevice, FileBlockDevice, IscsiTarget } from '@vates/iscsi'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { EventEmitter } from 'node:events'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { noSuchObject } from 'xo-common/api-errors.js'
import { randomBytes } from 'node:crypto'

import { cacheLabel } from './_utils.mjs'
import { createCache } from './_cache.mjs'
import { detectLocalAddress } from './_address.mjs'
import { createUfwFirewall } from './_firewall.mjs'
import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

/** @typedef {import('@vates/types').Xapi} Xapi */

/**
 * The XAPI names of what a mount creates, as the user sees them. Each one falls back to a name
 * derived from the disk path.
 *
 * @typedef {object} LiveMountXapiLabels
 * @property {string} [srNameLabel] - `name_label` of the SR introduced on the host
 * @property {string} [vdiNameLabel] - `name_label` of the VDI attached to the host, and of the cache VDI
 * @property {string} [vdiNameDescription] - `name_description` of the VDI attached to the host
 */

/**
 * A mount, as built by `#createDiskMount`.
 *
 * @typedef {object} DiskMount
 * @property {string} id
 * @property {string} address
 * @property {number} port
 * @property {string} iqn
 * @property {string} diskPath
 * @property {string} srRef
 * @property {string} srUuid
 * @property {string} vdiUuid
 * @property {import('@vates/iscsi').IscsiTarget} target
 * @property {Xapi} xapi - replaced by any newer connection to the same pool, see {@link LiveMount#watchConnection}
 * @property {string} [poolUuid] - pool of `xapi`, unknown if it was not connected
 * @property {{ device: object, lun: object, vbdRef: string, vdiRef: string }} [cache] - local VDI the disk is materialized into
 * @property {{ source: string, port: number, id: string }} [firewallRule] - opened by `iscsi.manageFirewall`
 * @property {() => Promise<void>} [release]
 */

// the firewalls `iscsi.manageFirewall` can drive
const FIREWALLS = {
  ufw: createUfwFirewall,
}

/**
 * Serve a disk as an iSCSI LUN and attach it, as an SR, to a host — so its
 * content is usable without copying it first.
 *
 * Without a cache SR, the mount is read-only: every read goes straight to the
 * source, the LUN is advertised as write protected, and the mount can target
 * any host reachable by the caller.
 *
 * With one, it is read/write: the disk is materialized block by block into a
 * VDI hot-plugged onto this appliance's own VM, which then holds every write
 * too — the source is never modified. This appliance must belong to the pool of
 * the target host, and that VDI lives and dies with the mount: what was written
 * is lost on unmount. On a local SR, this appliance must not be migrated while
 * the mount lasts: its VDI cannot follow it.
 *
 * Nothing app-specific is read from `app` apart from `config` and `hooks`: the
 * source disk, the XAPI connection and the target host are all passed in by
 * the caller — so both xo-server and xo-proxy can use this mixin, and so can
 * any future feature built on it (booting a VM straight from a backup,
 * importing one from another hypervisor), each supplying its own way to open
 * the source disk.
 *
 * A mount releases itself when its VDI is removed from the pool — typically
 * when the VM it was attached to is deleted — so a caller which forgets to
 * unmount does not leak an SR and a target for the lifetime of the process.
 * A caller which replaces its XAPI connections (e.g. on reconnection) must
 * hand each new one to {@link LiveMount#watchConnection}.
 *
 * The implementation is split by concern, each module private to this
 * directory: `_target.mjs` (CHAP + the iSCSI target + SCSI probe), `_sr.mjs`
 * (the SR/VDI introduced on the target host). This file is the only public
 * surface.
 *
 * Public methods are named `*Disk` even though the class itself is generic:
 * today it only ever mounts one disk at a time, and a future feature mounting
 * a whole VM (one call per disk, then a VM built on the results) belongs on
 * its own method rather than squatting on a bare `mount`/`unmount`.
 *
 * @fires LiveMount#unmounted - `(id)`, whenever a mount stops existing,
 * whether it was unmounted explicitly or because its VDI disappeared
 */
export default class LiveMount extends EventEmitter {
  #app
  #createCacheDevice
  #createTarget
  #detectAddress
  #firewall
  #firewallName
  // a mount waits for the stale rules to be removed: listed before its own is inserted, its rule
  // would be removed with them
  /** @type {Promise<void> | undefined} */
  #firewallPurge
  // an invalid `iscsi.manageFirewall` fails the mounts, not the whole process
  #firewallError
  #openDisk

  // mount id -> mount record
  #mounts = new Map()

  // VDI uuid -> id of the mount serving it: a uuid is unique across pools, so a single map serves
  // every connection, including the ones replacing the connection a mount was created with
  /** @type {Map<string, string>} */
  #mountIdsByVdiUuid = new Map()

  // `appName` scopes the firewall rules, so that xo-server and xo-proxy on the same machine do not
  // purge each other's
  // every dependency reaching outside this process is injectable for tests only,
  // like xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(
    app,
    {
      appName,
      openDisk = openDiskChain,
      createCacheDevice = options => new FileBlockDevice(options),
      createTarget = options => new IscsiTarget(options),
      detectAddress = detectLocalAddress,
      createFirewall = name => FIREWALLS[name]?.({ scope: appName }),
    } = {}
  ) {
    super()

    this.#app = app
    this.#createCacheDevice = createCacheDevice
    this.#createTarget = createTarget
    this.#detectAddress = detectAddress
    this.#openDisk = openDisk

    // the target of each mount listens on an ephemeral port, which a firewall cannot allow in
    // advance: when told to, the port is opened to the host of the mount, for its lifetime only
    // `false` turns off the default of the packaged configuration
    const configuredFirewall = app.config.getOptional('iscsi.manageFirewall')
    const firewallName = configuredFirewall === false ? undefined : configuredFirewall
    const firewall = firewallName === undefined ? undefined : createFirewall(firewallName)
    if (firewallName !== undefined && firewall === undefined) {
      this.#firewallError = new Error(
        `unsupported iscsi.manageFirewall: ${firewallName}, expected one of ${Object.keys(FIREWALLS).join(', ')}`
      )
      warn('live mounts are disabled', { error: this.#firewallError })
    }
    if (firewall !== undefined) {
      this.#firewall = firewall
      this.#firewallName = firewallName
      // a process which died without unmounting left its rules behind, nothing serves their ports anymore
      app.hooks.on('start', () => this.#purgeFirewall())
    }

    app.hooks.on('stop', () =>
      asyncEach(
        [...this.#mounts.keys()],
        id =>
          this.unmountDisk(id).catch(error => {
            warn('failed to unmount on stop', { error, id })
          }),
        { stopOnError: false }
      )
    )
  }

  /**
   * Remove the stale rules once, on start or before the first mount, whichever comes first: the
   * API may be served before the start hooks run.
   *
   * @returns {Promise<void>} never rejects: a failure is logged, and does not prevent the mounts
   */
  #purgeFirewall() {
    const firewallName = this.#firewallName
    this.#firewallPurge ??= (async () => {
      try {
        const removed = await this.#firewall.purge()
        if (removed.length !== 0) {
          info('removed stale firewall rules', { firewall: firewallName, removed })
        }
      } catch (error) {
        warn('failed to remove stale firewall rules', { error, firewall: firewallName })
      }
    })()
    return this.#firewallPurge
  }

  /**
   * @param {object} params
   * @param {import('@xen-orchestra/fs').RemoteHandlerAbstract} params.handler - passed to `openDisk` to open the source disk
   * @param {string} params.diskPath - path of the source disk, passed to `openDisk`
   * @param {object} params.xapi - XAPI connection of the pool owning `hostRef`
   * @param {string} params.hostRef - opaque ref of the host the disk is attached to as an SR
   * @param {LiveMountXapiLabels} [params.xapiLabels] - names of the SR and of the VDI shown to the user
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
   * @param {string} [params.cacheSrUuid] - SR of a local VDI the disk is materialized into as it is
   * read, and which holds the writes. Unset, nothing is cached and the mount is read-only. It must be
   * plugged on the host running this appliance.
   * @param {string} [params.vmUuid] - VM of this appliance, in `xapi`'s pool; required with `cacheSrUuid`
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, iqn: string, address: string, port: number }>}
   */
  async mountDisk(params) {
    const mount = await this.#createDiskMount(params)
    this.#mounts.set(mount.id, mount)
    this.#watchVdi(mount)
    return {
      id: mount.id,
      srUuid: mount.srUuid,
      vdiUuid: mount.vdiUuid,
      iqn: mount.iqn,
      address: mount.address,
      port: mount.port,
    }
  }

  #createDiskMount = defer(async ($defer, params) => {
    const { cacheSrUuid, diskPath, handler, hostRef, release, vmUuid, xapi, xapiLabels = {} } = params
    if (this.#firewallError !== undefined) {
      throw this.#firewallError
    }
    if (cacheSrUuid !== undefined && vmUuid === undefined) {
      throw new Error('vmUuid is required to create a live mount cache')
    }
    const config = this.#app.config
    // `iscsi.advertisedAddress` overrides auto-detection; unset, the address
    // reachable *from* the target host is guessed by asking the OS which
    // local address it would route through to reach it — usually right, but
    // not guaranteed to be reachable *back* from the host (NAT, asymmetric
    // routing), which is what the override is for.
    const firewall = this.#firewall
    let address = config.getOptional('iscsi.advertisedAddress')
    const hostAddress =
      address === undefined || firewall !== undefined ? await xapi.getField('host', hostRef, 'address') : undefined
    if (address === undefined) {
      address = await this.#detectAddress(hostAddress)
    }

    const id = randomBytes(16).toString('hex')
    const iqn = `iqn.2026-07.tech.vates.xo:live-mount-${id}`
    const chap = createChapCredentials(id)

    // the chain must keep its block allocation tables: they tell which blocks
    // are allocated, and reading an unallocated one throws
    const disk = await this.#openDisk({ handler, path: diskPath })
    $defer.onFailure(() => disk.close())

    // before the target, which opens the LUN
    let cache
    let lun
    if (cacheSrUuid === undefined) {
      lun = new DiskBlockDevice({ disk })
    } else {
      const { device, vbdRef, vdiRef } = await createCache($defer, {
        createCacheDevice: this.#createCacheDevice,
        disk,
        diskPath,
        id,
        nameLabel: xapiLabels.vdiNameLabel ?? cacheLabel(diskPath),
        srUuid: cacheSrUuid,
        vmUuid,
        xapi,
      })
      lun = new CachedDiskBlockDevice({ cache: device, disk })
      cache = { device, lun, vbdRef, vdiRef }
    }

    const target = this.#createTarget({
      chap,
      host: config.getOptional('iscsi.bindAddress'),
      identity: { serial: `xo-live-mount-${id}` },
      iqn,
      lun,
      port: 0, // ephemeral: one target per mount
    })
    // opens the LUN, so its capacity is readable afterwards
    await target.listen()
    $defer.onFailure(() => target.close())
    const { port } = target.address()

    // scoped to the host's management address: the one the advertised address is detected from,
    // so the one it connects from — unless `iscsi.advertisedAddress` points at another network
    let firewallRule
    if (firewall !== undefined) {
      await this.#purgeFirewall()
      const rule = { source: hostAddress, port, id }
      // none opened when there is no firewall to drive on this install: nothing to close then
      if (await firewall.open(rule)) {
        firewallRule = rule
        $defer.onFailure(() => firewall.close(rule))
      }
    }

    const deviceConfig = {
      chapuser: chap.user,
      chappassword: chap.secret,
      port: String(port),
      target: address,
      targetIQN: iqn,
    }

    const SCSIid = await probeScsiId({ xapi, hostRef, deviceConfig, address })
    const fullDeviceConfig = { ...deviceConfig, SCSIid }

    const { srRef, srUuid } = await introduceSr($defer, {
      xapi,
      hostRef,
      deviceConfig: fullDeviceConfig,
      id,
      nameLabel: xapiLabels.srNameLabel,
      diskPath,
    })

    const vdiUuid = await introduceVdi({
      xapi,
      srRef,
      SCSIid,
      size: lun.getSize(),
      diskPath,
      id,
      nameLabel: xapiLabels.vdiNameLabel,
      nameDescription: xapiLabels.vdiNameDescription,
      readOnly: cache === undefined,
    })

    info('mounted', { id, address, port, srUuid, vdiUuid, diskPath, cached: cache !== undefined })

    const poolUuid = xapi.pool?.uuid
    return {
      address,
      cache,
      disk,
      diskPath,
      firewallRule,
      id,
      iqn,
      poolUuid,
      port,
      release,
      srRef,
      srUuid,
      target,
      vdiUuid,
      xapi,
    }
  })

  /**
   * Tear a mount down as soon as its VDI disappears from the pool.
   *
   * A live mounted disk is attached to a VM like any other one, and deleting that VM deletes its
   * disks: the VDI record goes away, but the SR introduced for it, the iSCSI target serving it
   * and the disk chain behind it would stay for as long as this process lives. Nothing ever
   * reports the LUN itself as unused, so the VDI vanishing is the only signal that the mount has
   * become pointless.
   *
   * @param {DiskMount} mount
   */
  #watchVdi({ id, vdiUuid, xapi }) {
    this.#mountIdsByVdiUuid.set(vdiUuid, id)
    this.#listen(xapi)
  }

  /**
   * Stop expecting the removal of a mount's VDI, because this unmount is what removes it.
   *
   * @param {DiskMount} mount
   */
  #unwatchVdi({ vdiUuid }) {
    this.#mountIdsByVdiUuid.delete(vdiUuid)
  }

  /**
   * Take over from the previous connection to the same pool, which a new one replaces.
   *
   * A connection which went away reports nothing more, and no longer answers either: without this,
   * the removal of a VDI would go unnoticed, and so would the SR forgotten on unmount. xo-server
   * creates a new connection on every reconnection, and each one must be handed here.
   *
   * @param {Xapi} xapi
   */
  watchConnection(xapi) {
    const poolUuid = xapi.pool?.uuid
    if (poolUuid !== undefined) {
      for (const mount of this.#mounts.values()) {
        if (mount.poolUuid === poolUuid) {
          mount.xapi = xapi
        }
      }
    }
    this.#listen(xapi)
  }

  /**
   * One listener per XAPI connection, whatever the number of mounts on it: the VDI events of
   * `xapi.objects` report every VDI removal of the pool anyway, and a listener per mount would pile
   * up on a shared connection. It is never removed, it simply ends up watching for nothing — what
   * is tracked, and dropped as soon as it is of no use, is the uuid it looks for.
   *
   * A connection which does not watch the pool events never reports anything: its mounts work, they
   * just have to be unmounted explicitly.
   *
   * @param {Xapi} xapi
   */
  #listen(xapi) {
    const vdiEvents = xapi.objects.allIndexes.type.getEventEmitterByType('VDI')
    // a single handler shared by every connection, so the emitter itself tells whether this one is
    // already listened to
    if (!vdiEvents.listeners('remove').includes(this.#onVdiRemoved)) {
      vdiEvents.on('remove', this.#onVdiRemoved)
    }
  }

  /**
   * The type index reports each removed record on its own, as it was before its removal, so under
   * the very uuid `introduceVdi` resolved.
   *
   * @param {unknown} _
   * @param {{ uuid?: string } | undefined} vdi
   */
  #onVdiRemoved = (_, vdi) => {
    const uuid = vdi?.uuid
    if (uuid === undefined) {
      return
    }
    const mountId = this.#mountIdsByVdiUuid.get(uuid)
    if (mountId === undefined) {
      return
    }
    // a VDI is removed once and for all, and a mount introduces exactly one: nothing else will ever
    // come for this uuid
    this.#mountIdsByVdiUuid.delete(uuid)
    info('the live mounted VDI was removed, unmounting', { id: mountId, vdiUuid: uuid })
    this.unmountDisk(mountId).catch(error => {
      warn('failed to unmount after the VDI was removed', { error, id: mountId })
    })
  }

  /**
   * Detach a mount from its host and stop serving it.
   *
   * Each teardown step runs even if an earlier one failed: a mount holds a
   * socket, a disk chain, a VDI and an SR, and giving up halfway would leak
   * whatever came after.
   *
   * With a cache, the device must be closed before its VBD is unplugged, or the
   * kernel refuses to release it and the VDI is leaked.
   *
   * @param {string} id - identifier returned by {@link LiveMount#mountDisk}
   */
  async unmountDisk(id) {
    const mount = this.#mounts.get(id)
    if (mount === undefined) {
      // a coded error, so a remote caller (XO driving a proxy) can tell it apart from a failed call
      noSuchObject(id, 'live-mount')
    }
    // drop it first, so a failing teardown cannot be retried against a
    // half-released mount
    this.#mounts.delete(id)
    // and stop watching before forgetting the SR, which removes the VDI: that removal is ours,
    // not the deletion this mixin reacts to
    this.#unwatchVdi(mount)

    const { cache, firewallRule, xapi, srRef, target, release } = mount

    const errors = []
    const step = async (what, fn) => {
      try {
        await fn()
      } catch (error) {
        warn(`failed to ${what}`, { error, id })
        errors.push(error)
      }
    }

    await step('forget the SR', () => forgetSr(xapi, srRef))
    // stop serving first, so no I/O is left in flight
    await step('close the target', () => target.close())
    if (firewallRule !== undefined) {
      await step('close the firewall rule', () => this.#firewall.close(firewallRule))
    }
    if (cache !== undefined) {
      // already closed by the target, which owns the LUN — unless closing the target failed before
      // getting there, and an open descriptor would then block the unplug and leak the VDI
      await step('close the cache device', () => cache.device.close())
      await step('destroy the cache VBD', () => xapi.VBD_destroy(cache.vbdRef))
      await step('destroy the cache VDI', () => xapi.VDI_destroy(cache.vdiRef))
    }
    await step('release the caller resources', () => release?.())

    // the mount is gone whatever happened above, so callers tracking it must hear about it even
    // when the teardown was partial — and a listener misbehaving is not an unmount failure
    try {
      this.emit('unmounted', id)
    } catch (error) {
      warn('an unmounted listener failed', { error, id })
    }

    if (errors.length !== 0) {
      const error = new Error(`failed to unmount live mount ${id}`)
      error.cause = errors[0]
      error.errors = errors
      throw error
    }
    info('unmounted', { id, srUuid: mount.srUuid })
  }

  /** Live disk mounts, in creation order; a cached one also reports how much of the disk is local. */
  listMountedDisks() {
    return [...this.#mounts.values()].map(({ id, srUuid, vdiUuid, diskPath, iqn, address, port, cache }) => ({
      id,
      srUuid,
      vdiUuid,
      diskPath,
      iqn,
      address,
      port,
      cache: cache?.lun.getMaterialized(),
    }))
  }
}
