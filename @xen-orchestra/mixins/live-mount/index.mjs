import { asyncEach } from '@vates/async-each'
import { CachedDiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { randomBytes } from 'node:crypto'

import { createCache, openLocalDevice } from './_cache.mjs'
import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

/**
 * Serve a disk as an iSCSI LUN and attach it to the host running this
 * appliance, as an SR — so its content is usable without copying it first.
 *
 * A local disk caches what has been read: a block is fetched from the source
 * only the first time it is touched, everything else is served locally. Once
 * every block has been read, the cache disk holds a complete copy of the
 * source. Writes are accepted and land in the cache only, so a mount that has
 * been written to no longer matches its source.
 *
 * Nothing app-specific is read from `app` apart from `config` and `hooks`: the
 * source disk, the XAPI connection, the appliance's VM and the cache SR are all
 * passed in by the caller — so both xo-server and xo-proxy can use this mixin,
 * and so can any future feature built on it (booting a VM straight from a
 * backup, importing one from another hypervisor), each supplying its own way to
 * open the source disk.
 *
 * The implementation is split by concern, each module private to this
 * directory: `_target.mjs` (CHAP + the iSCSI target + SCSI probe), `_cache.mjs`
 * (the local cache disk), `_sr.mjs` (the SR/VDI introduced on the target host).
 * This file is the only public surface.
 *
 * Public methods are named `*Disk` even though the class itself is generic:
 * today it only ever mounts one disk at a time, and a future feature mounting
 * a whole VM (one call per disk, then a VM built on the results) belongs on its
 * own method rather than squatting on a bare `mount`/`unmount`.
 */
export default class LiveMount {
  #app
  #createTarget
  #openCache
  #openDisk

  // mount id -> mount record
  #mounts = new Map()

  // `openDisk`/`createTarget`/`openCache` are injectable for tests only, like
  // xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(
    app,
    { openDisk = openDiskChain, createTarget = options => new IscsiTarget(options), openCache = openLocalDevice } = {}
  ) {
    this.#app = app
    this.#createTarget = createTarget
    this.#openCache = openCache
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
   * @param {object} params.xapi - XAPI connection of the pool running this appliance
   * @param {string} params.vmRef - opaque ref of *this* appliance's VM, where the cache disk is plugged
   * @param {string} params.cacheSrRef - opaque ref of the SR holding the cache disk; must be writable and
   * reachable from the appliance's host, which is the caller's job to check
   * @param {string} [params.nameLabel] - name of the created SR
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, cacheVdiUuid: string, iqn: string, address: string, port: number }>}
   */
  async mountDisk(params) {
    const mount = await this.#createDiskMount(params)
    this.#mounts.set(mount.id, mount)
    return {
      id: mount.id,
      srUuid: mount.srUuid,
      vdiUuid: mount.vdiUuid,
      cacheVdiUuid: mount.cacheVdiUuid,
      iqn: mount.iqn,
      address: mount.address,
      port: mount.port,
    }
  }

  #createDiskMount = defer(async ($defer, { handler, diskPath, xapi, vmRef, cacheSrRef, nameLabel, release }) => {
    const config = this.#app.config
    const address = config.get('iscsi.advertisedAddress')

    const id = randomBytes(16).toString('hex')
    const iqn = `iqn.2026-07.tech.vates.xo:live-mount-${id}`
    const chap = createChapCredentials(id)

    // the chain must keep its block allocation tables: they tell which blocks
    // are allocated, and reading an unallocated one throws
    const disk = await this.#openDisk({ handler, path: diskPath })
    $defer.onFailure(() => disk.close())

    // the appliance's host: the mount is served to whichever host runs us
    const hostRef = await xapi.getField('VM', vmRef, 'resident_on')

    const cache = await createCache($defer, {
      diskPath,
      size: disk.getVirtualSize(),
      srRef: cacheSrRef,
      vmRef,
      xapi,
      openCache: this.#openCache,
    })

    // the cache owns the reads: the source is only ever touched for a block
    // that is not in it yet
    const lun = new CachedDiskBlockDevice({ cache: cache.device, disk })
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

    const vdiUuid = await introduceVdi({ xapi, srRef, SCSIid, size: lun.getSize(), diskPath })

    info('mounted', { id, address, port, srUuid, vdiUuid, cacheVdiUuid: cache.vdiUuid, diskPath })

    return {
      address,
      cache,
      cacheVdiUuid: cache.vdiUuid,
      disk,
      diskPath,
      id,
      iqn,
      lun,
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
   * Detach a mount from its host and stop serving it.
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

    const { cache, xapi, srRef, target, release } = mount

    // Ordered, and each step runs even if an earlier one failed: a mount holds a
    // socket, a file descriptor, a VBD, a VDI and an SR, and giving up halfway
    // would leak whatever came after.
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
    // the LUN closes the cache device too; doing it again is a no-op, and makes
    // sure the descriptor is gone before XAPI is asked to take the disk away
    await step('close the cache device', () => cache.device.close())
    // unplugs on the way, and the VDI destroy retries on VDI_IN_USE
    await step('destroy the cache VBD', () => xapi.VBD_destroy(cache.vbdRef))
    await step('destroy the cache VDI', () => xapi.VDI_destroy(cache.vdiRef))
    await step('release the caller resources', () => release?.())

    if (errors.length !== 0) {
      const error = new Error(`failed to unmount live mount ${id}`)
      error.cause = errors[0]
      error.errors = errors
      throw error
    }
    info('unmounted', { id, srUuid: mount.srUuid, cacheVdiUuid: mount.cacheVdiUuid })
  }

  /** Live disk mounts, in creation order. */
  listMountedDisks() {
    return [...this.#mounts.values()].map(
      ({ id, srUuid, vdiUuid, cacheVdiUuid, diskPath, iqn, address, port, lun }) => ({
        id,
        srUuid,
        vdiUuid,
        cacheVdiUuid,
        diskPath,
        iqn,
        address,
        port,
        // how much of the source has been pulled into the cache: once every
        // block is there, the cache disk holds the whole disk
        materialized: lun.getMaterialized(),
      })
    )
  }
}
