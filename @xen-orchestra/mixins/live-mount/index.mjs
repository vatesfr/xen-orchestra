import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { DiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { defer } from 'golike-defer'
import { EventEmitter } from 'node:events'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { noSuchObject } from 'xo-common/api-errors.js'
import { randomBytes } from 'node:crypto'

import { detectLocalAddress, getHostAddresses } from './_address.mjs'
import { createUfwFirewall } from './_firewall.mjs'
import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'
import { cacheLabel } from './_utils.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

/** @typedef {import('@vates/types').Xapi} Xapi */

/**
 * A block device served through an iSCSI target, as returned by {@link LiveMount#serveBlockDevice}.
 *
 * @typedef {object} ServedBlockDevice
 * @property {string} id
 * @property {string} address - address of the target, as handed to the host
 * @property {number} port
 * @property {string} iqn
 * @property {Record<string, string>} deviceConfig - of an `iscsi` SR on this target, without `SCSIid`
 * @property {() => Promise<void>} close - stops serving, and closes the firewall rule if any
 */

/**
 * A mount, as built by `#createMount`.
 *
 * @typedef {object} DiskMount
 * @property {string} id
 * @property {string} address
 * @property {number} port
 * @property {string} iqn
 * @property {string} [diskPath] - unset for a block device mounted by {@link LiveMount#mountBlockDevice}
 * @property {string} srRef
 * @property {string} srUuid
 * @property {string} vdiUuid
 * @property {ServedBlockDevice} served
 * @property {Xapi} xapi - replaced by any newer connection to the same pool, see {@link LiveMount#watchConnection}
 * @property {string} [poolUuid] - pool of `xapi`, unknown if it was not connected
 * @property {() => Promise<void>} [release]
 * @property {() => Promise<void>} [beforeUnmount]
 */

// names the IQN and the LUN serial of the targets serving a backup disk
const DEFAULT_KIND = 'live-mount'

// the firewalls `iscsi.manageFirewall` can drive
const FIREWALLS = {
  ufw: createUfwFirewall,
}

/**
 * Serve a disk as a read-only iSCSI LUN and attach it, as an SR, to a host —
 * so its content is usable without copying it first.
 *
 * Nothing is cached: every read goes straight to the source, and writes are
 * refused (the LUN is backed by `@vates/iscsi`'s `DiskBlockDevice`, which is
 * read-only). Since nothing needs to be plugged into this appliance's own VM,
 * the mount can target any host reachable by the caller.
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
  // `openDisk`/`createTarget`/`detectAddress`/`createFirewall` are injectable for tests only,
  // like xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(
    app,
    {
      appName,
      openDisk = openDiskChain,
      createTarget = options => new IscsiTarget(options),
      detectAddress = detectLocalAddress,
      createFirewall = name => FIREWALLS[name]?.({ scope: appName }),
    } = {}
  ) {
    super()

    this.#app = app
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
   * @param {string} [params.nameLabel] - name of the created SR
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, iqn: string, address: string, port: number }>}
   */
  async mountDisk({ handler, diskPath, xapi, hostRef, nameLabel, release }) {
    if (this.#firewallError !== undefined) {
      throw this.#firewallError
    }
    // the chain must keep its block allocation tables: they tell which blocks
    // are allocated, and reading an unallocated one throws
    const disk = await this.#openDisk({ handler, path: diskPath })
    try {
      return await this.#mount({
        diskPath,
        hostRef,
        lun: new DiskBlockDevice({ disk }),
        nameDescription: `mount of ${diskPath}`,
        nameLabel,
        release,
        vdiNameLabel: `${cacheLabel(diskPath)}.raw`,
        xapi,
      })
    } catch (error) {
      await disk.close()
      throw error
    }
  }

  /**
   * Like {@link LiveMount#mountDisk}, for any block device: serve it and attach it to a host as an
   * SR holding a single VDI. Undone by {@link LiveMount#unmountBlockDevice}.
   *
   * The LUN is closed with the target. Its `readOnly` flag decides whether the VDI is read-only.
   *
   * @param {object} params
   * @param {import('@vates/iscsi').BlockDevice} params.lun
   * @param {object} params.xapi - XAPI connection of the pool owning `hostRef`
   * @param {string} params.hostRef - opaque ref of the host the device is attached to as an SR
   * @param {string} params.kind - names the IQN and the serial of the LUN, e.g. `browser-media`
   * @param {string} params.nameLabel - name of the created SR and VDI
   * @param {string} params.nameDescription - description of the created SR and VDI
   * @param {Record<string, string>} [params.smConfig] - `sm_config` of the SR, set when it is introduced
   * @param {Partial<import('@vates/iscsi').IscsiTargetOptions>} [params.targetOptions] - e.g. `maxTransferLength`
   * @param {() => Promise<void>} [params.beforeUnmount] - called first on unmount, whatever triggers it,
   * e.g. to eject the VDI while the target can still answer the host: if it fails, the device stays
   * mounted, and the unmount can be retried
   * @param {() => Promise<void>} [params.release] - called on unmount, once the target is closed
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, iqn: string, address: string, port: number }>}
   */
  async mountBlockDevice({ nameLabel, ...params }) {
    if (this.#firewallError !== undefined) {
      throw this.#firewallError
    }
    return this.#mount({ ...params, nameLabel, vdiNameLabel: nameLabel })
  }

  async #mount(params) {
    const mount = await this.#createMount(params)
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

  /**
   * Serve `lun` through a new iSCSI target, for `hostRef` to attach it: the target listens on an
   * ephemeral port, requires CHAP, and only accepts connections from the addresses of the host,
   * unless `iscsi.restrictToHost` is `false`. With `iscsi.manageFirewall`, its port is opened to
   * the host until it is closed.
   *
   * `id`, `chap` and `port` serve a target again under the identity of a previous one, e.g. so that
   * a host still logged in to a target that went away can complete its I/O and detach cleanly.
   *
   * @param {object} params
   * @param {import('@vates/iscsi').BlockDevice} params.lun - closed with the target
   * @param {object} params.xapi - XAPI connection of the pool owning `hostRef`
   * @param {string} params.hostRef - opaque ref of the host the target is meant for
   * @param {string} [params.kind] - names the IQN and the serial of the LUN, defaults to `live-mount`
   * @param {string} [params.id] - random by default
   * @param {{ user: string, secret: string }} [params.chap] - random by default
   * @param {number} [params.port] - ephemeral by default
   * @param {Partial<import('@vates/iscsi').IscsiTargetOptions>} [params.targetOptions]
   * @returns {Promise<ServedBlockDevice>}
   */
  serveBlockDevice = defer(
    async (
      $defer,
      {
        lun,
        xapi,
        hostRef,
        kind = DEFAULT_KIND,
        id = randomBytes(16).toString('hex'),
        chap = createChapCredentials(id),
        port: requestedPort = 0,
        targetOptions,
      }
    ) => {
      if (this.#firewallError !== undefined) {
        throw this.#firewallError
      }
      const config = this.#app.config
      // `iscsi.advertisedAddress` overrides auto-detection; unset, the address
      // reachable *from* the target host is guessed by asking the OS which
      // local address it would route through to reach it — usually right, but
      // not guaranteed to be reachable *back* from the host (NAT, asymmetric
      // routing), which is what the override is for.
      const hostAddress = await xapi.getField('host', hostRef, 'address')
      const address = config.getOptional('iscsi.advertisedAddress') ?? (await this.#detectAddress(hostAddress))

      // the host is the only expected initiator: nothing else may take the connection slots of the
      // target, which only CHAP would keep from logging in otherwise. Behind a NAT, the host connects
      // from another address, which is what `iscsi.restrictToHost = false` is for
      const allowedAddresses =
        config.getOptional('iscsi.restrictToHost') === false
          ? undefined
          : await getHostAddresses(xapi, hostRef, hostAddress)

      const iqn = `iqn.2026-07.tech.vates.xo:${kind}-${id}`
      const target = this.#createTarget({
        ...targetOptions,
        allowedAddresses,
        chap,
        host: config.getOptional('iscsi.bindAddress'),
        identity: { serial: `xo-${kind}-${id}` },
        iqn,
        lun,
        port: requestedPort,
      })
      // opens the LUN, so its capacity is readable afterwards
      await target.listen()
      $defer.onFailure(() => target.close())
      const { port } = target.address()

      // scoped to the host's management address: the one the advertised address is detected from,
      // so the one it connects from — unless `iscsi.advertisedAddress` points at another network
      const firewall = this.#firewall
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

      return {
        address,
        deviceConfig: {
          chapuser: chap.user,
          chappassword: chap.secret,
          port: String(port),
          target: address,
          targetIQN: iqn,
        },
        id,
        iqn,
        port,
        close: async () => {
          // stop serving first, so no I/O is left in flight
          try {
            await target.close()
          } finally {
            if (firewallRule !== undefined) {
              await firewall.close(firewallRule)
            }
          }
        },
      }
    }
  )

  #createMount = defer(
    async (
      $defer,
      {
        lun,
        xapi,
        hostRef,
        kind,
        nameLabel,
        nameDescription,
        vdiNameLabel,
        smConfig,
        targetOptions,
        diskPath,
        beforeUnmount,
        release,
      }
    ) => {
      const served = await this.serveBlockDevice({ lun, xapi, hostRef, kind, targetOptions })
      $defer.onFailure(() => served.close())
      const { address, deviceConfig, id, iqn, port } = served

      const SCSIid = await probeScsiId({ xapi, hostRef, deviceConfig, address })
      const fullDeviceConfig = { ...deviceConfig, SCSIid }

      const { srRef, srUuid } = await introduceSr($defer, {
        xapi,
        hostRef,
        deviceConfig: fullDeviceConfig,
        id,
        nameLabel,
        nameDescription,
        smConfig,
      })

      const vdiUuid = await introduceVdi({
        xapi,
        srRef,
        SCSIid,
        size: lun.getSize(),
        nameLabel: vdiNameLabel,
        nameDescription,
        readOnly: lun.readOnly === true,
      })

      info('mounted', { id, address, port, srUuid, vdiUuid, diskPath })

      const poolUuid = xapi.pool?.uuid
      return {
        address,
        beforeUnmount,
        diskPath,
        id,
        iqn,
        poolUuid,
        port,
        release,
        served,
        srRef,
        srUuid,
        vdiUuid,
        xapi,
      }
    }
  )

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
    // come for this uuid. Still watched until the unmount goes through, which stops watching it
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
   * @param {string} id - identifier returned by {@link LiveMount#mountDisk}
   */
  async unmountDisk(id) {
    const mount = this.#mounts.get(id)
    if (mount === undefined) {
      // a coded error, so a remote caller (XO driving a proxy) can tell it apart from a failed call
      noSuchObject(id, 'live-mount')
    }
    // the stop hook, a removed VDI and the owner of the mount may all unmount it at once: they share
    // the same unmount
    mount.unmounting ??= this.#unmount(id, mount).finally(() => {
      mount.unmounting = undefined
    })
    return mount.unmounting
  }

  async #unmount(id, mount) {
    if (mount.beforeUnmount !== undefined) {
      // nothing is released yet: on failure, the mount stays as it is, so the unmount can be retried
      await mount.beforeUnmount()
    }
    // drop it first, so a failing teardown cannot be retried against a
    // half-released mount
    this.#mounts.delete(id)
    // and stop watching before forgetting the SR, which removes the VDI: that removal is ours,
    // not the deletion this mixin reacts to
    this.#unwatchVdi(mount)

    const { xapi, srRef, served, release } = mount

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
    await step('stop serving', () => served.close())
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

  /**
   * Detach a block device mounted by {@link LiveMount#mountBlockDevice} and stop serving it.
   *
   * @param {string} id
   */
  unmountBlockDevice(id) {
    return this.unmountDisk(id)
  }

  /** Live disk mounts, in creation order, without the other block devices. */
  listMountedDisks() {
    return [...this.#mounts.values()]
      .filter(mount => mount.diskPath !== undefined)
      .map(({ id, srUuid, vdiUuid, diskPath, iqn, address, port }) => ({
        id,
        srUuid,
        vdiUuid,
        diskPath,
        iqn,
        address,
        port,
      }))
  }
}
