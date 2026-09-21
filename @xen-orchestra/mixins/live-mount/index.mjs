import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { DiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { defer } from 'golike-defer'
import { EventEmitter } from 'node:events'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { randomBytes } from 'node:crypto'

import { detectLocalAddress } from './_address.mjs'
import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

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
  #openDisk

  // mount id -> mount record
  #mounts = new Map()

  // XAPI connection -> mount id, by the uuid of the VDI that mount serves. Weak, so a connection
  // which goes away takes its watch with it, and its single listener with it.
  #mountIdsByVdiUuid = new WeakMap()

  // `openDisk`/`createTarget`/`detectAddress` are injectable for tests only,
  // like xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(
    app,
    {
      openDisk = openDiskChain,
      createTarget = options => new IscsiTarget(options),
      detectAddress = detectLocalAddress,
    } = {}
  ) {
    super()

    this.#app = app
    this.#createTarget = createTarget
    this.#detectAddress = detectAddress
    this.#openDisk = openDisk

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
   * @param {object} params
   * @param {import('@xen-orchestra/fs').RemoteHandlerAbstract} params.handler - passed to `openDisk` to open the source disk
   * @param {string} params.diskPath - path of the source disk, passed to `openDisk`
   * @param {object} params.xapi - XAPI connection of the pool owning `hostRef`
   * @param {string} params.hostRef - opaque ref of the host the disk is attached to as an SR
   * @param {string} [params.nameLabel] - name of the created SR
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
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

  #createDiskMount = defer(async ($defer, { handler, diskPath, xapi, hostRef, nameLabel, release }) => {
    const config = this.#app.config
    // `iscsi.advertisedAddress` overrides auto-detection; unset, the address
    // reachable *from* the target host is guessed by asking the OS which
    // local address it would route through to reach it — usually right, but
    // not guaranteed to be reachable *back* from the host (NAT, asymmetric
    // routing), which is what the override is for.
    let address = config.getOptional('iscsi.advertisedAddress')
    if (address === undefined) {
      const hostAddress = await xapi.getField('host', hostRef, 'address')
      address = await this.#detectAddress(hostAddress)
    }

    const id = randomBytes(16).toString('hex')
    const iqn = `iqn.2026-07.tech.vates.xo:live-mount-${id}`
    const chap = createChapCredentials(id)

    // the chain must keep its block allocation tables: they tell which blocks
    // are allocated, and reading an unallocated one throws
    const disk = await this.#openDisk({ handler, path: diskPath })
    $defer.onFailure(() => disk.close())

    const lun = new DiskBlockDevice({ disk })
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
      nameLabel,
      diskPath,
    })

    const vdiUuid = await introduceVdi({ xapi, srRef, SCSIid, size: lun.getSize(), diskPath, readOnly: true })

    info('mounted', { id, address, port, srUuid, vdiUuid, diskPath })

    return { address, disk, diskPath, id, iqn, port, release, srRef, srUuid, target, vdiUuid, xapi }
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
   * One listener per XAPI connection, whatever the number of mounts on it: `xapi.objects` reports
   * every removal of the pool anyway, and a listener per mount would pile up on a shared
   * connection. It is never removed, it simply ends up watching for nothing — what is tracked,
   * and dropped as soon as it is of no use, is the uuid it looks for.
   *
   * @param {object} mount - mount record, as built by `#createDiskMount`
   */
  #watchVdi({ id, vdiUuid, xapi }) {
    const objects = xapi.objects
    if (typeof objects?.on !== 'function') {
      // a connection which does not watch the pool objects: the mount works, it just has to be
      // unmounted explicitly
      warn('cannot watch the live mounted VDI, this mount will not be released on its own', { id, vdiUuid })
      return
    }

    let mountIds = this.#mountIdsByVdiUuid.get(xapi)
    if (mountIds === undefined) {
      mountIds = new Map()
      this.#mountIdsByVdiUuid.set(xapi, mountIds)

      // the collection is keyed by uuid for every record which has one, so a removed VDI is
      // reported under the very uuid `introduceVdi` resolved
      objects.on('remove', removed => {
        for (const uuid of Object.keys(removed)) {
          const mountId = mountIds.get(uuid)
          if (mountId !== undefined) {
            // a VDI is removed once and for all, and a mount introduces exactly one: nothing else
            // will ever come for this uuid
            mountIds.delete(uuid)
            info('the live mounted VDI was removed, unmounting', { id: mountId, vdiUuid: uuid })
            this.unmountDisk(mountId).catch(error => {
              warn('failed to unmount after the VDI was removed', { error, id: mountId })
            })
          }
        }
      })
    }
    mountIds.set(vdiUuid, id)
  }

  /** Stop expecting the removal of a mount's VDI, because this unmount is what removes it. */
  #unwatchVdi({ vdiUuid, xapi }) {
    this.#mountIdsByVdiUuid.get(xapi)?.delete(vdiUuid)
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
      throw new Error(`no such live mount ${id}`)
    }
    // drop it first, so a failing teardown cannot be retried against a
    // half-released mount
    this.#mounts.delete(id)
    // and stop watching before forgetting the SR, which removes the VDI: that removal is ours,
    // not the deletion this mixin reacts to
    this.#unwatchVdi(mount)

    const { xapi, srRef, target, release } = mount

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

  /** Live disk mounts, in creation order. */
  listMountedDisks() {
    return [...this.#mounts.values()].map(({ id, srUuid, vdiUuid, diskPath, iqn, address, port }) => ({
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
