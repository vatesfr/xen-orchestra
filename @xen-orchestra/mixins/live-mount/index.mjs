import { asyncEach } from '@vates/async-each'
import { CachedDiskBlockDevice, DiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { randomBytes } from 'node:crypto'
import { Task } from '@vates/task'

import { createCache, openLocalDevice } from './_cache.mjs'
import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

/**
 * Serve a disk as an iSCSI LUN and attach it, as an SR, to a host — so its
 * content is usable without copying it first.
 *
 * Caching is optional. With a cache, a local disk plugged into the
 * appliance's VM absorbs reads (fetched from the source once, then served
 * locally) and accepts writes, so a written-to mount no longer matches its
 * source; once fully read, the cache is a complete copy (see `hydrateDisk` to
 * force that). Without a cache, every read hits the source directly, writes
 * are refused, and the mount can target any host — nothing needs to be
 * plugged into the appliance's own VM.
 *
 * Only `app.config`/`app.hooks` are used from `app`: the source disk, XAPI
 * connection, appliance VM and cache SR are all passed in by the caller, so
 * both xo-server and xo-proxy can use this mixin.
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
   * @param {object} params.xapi - XAPI connection of the pool owning `hostRef`
   * @param {string} params.hostRef - opaque ref of the host the disk is attached to as an SR
   * @param {object} [params.cache] - enables the read/write cache; omit for a lower-performance,
   * read-only, no-local-storage mount that can target any host
   * @param {string} params.cache.srRef - opaque ref of the SR holding the cache disk; must be writable and
   * reachable from the appliance's own host, which is the caller's job to check
   * @param {string} params.cache.vmRef - opaque ref of *this* appliance's VM, where the cache disk is plugged;
   * must be on the same XAPI connection as `hostRef` (`xapi` is used for both)
   * @param {string} [params.nameLabel] - name of the created SR
   * @param {() => Promise<void>} [params.release] - called on unmount, e.g. to dispose the remote handler
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string, cacheVdiUuid?: string, iqn: string, address: string, port: number }>}
   */
  async mountDisk(params) {
    const mount = await this.#createDiskMount(params)
    this.#mounts.set(mount.id, mount)
    return {
      id: mount.id,
      srUuid: mount.srUuid,
      vdiUuid: mount.vdiUuid,
      cacheVdiUuid: mount.cache?.vdiUuid,
      iqn: mount.iqn,
      address: mount.address,
      port: mount.port,
    }
  }

  #createDiskMount = defer(
    async ($defer, { handler, diskPath, xapi, hostRef, cache: cacheParams, nameLabel, release }) => {
      const config = this.#app.config
      const address = config.get('iscsi.advertisedAddress')

      const id = randomBytes(16).toString('hex')
      const iqn = `iqn.2026-07.tech.vates.xo:live-mount-${id}`
      const chap = createChapCredentials(id)

      // the chain must keep its block allocation tables: they tell which blocks
      // are allocated, and reading an unallocated one throws
      const disk = await Task.run({ properties: { name: 'open source disk' } }, () =>
        this.#openDisk({ handler, path: diskPath })
      )
      $defer.onFailure(() => disk.close())

      let cache
      let lun
      if (cacheParams !== undefined) {
        cache = await createCache($defer, {
          diskPath,
          size: disk.getVirtualSize(),
          srRef: cacheParams.srRef,
          vmRef: cacheParams.vmRef,
          xapi,
          openCache: this.#openCache,
        })

        // the cache owns the reads: the source is only ever touched for a block
        // that is not in it yet
        lun = new CachedDiskBlockDevice({ cache: cache.device, disk })
      } else {
        lun = new DiskBlockDevice({ disk })
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
      await Task.run({ properties: { name: 'start iSCSI target' } }, () => target.listen())
      $defer.onFailure(() => target.close())
      const { port } = target.address()

      const deviceConfig = {
        chapuser: chap.user,
        chappassword: chap.secret,
        port: String(port),
        target: address,
        targetIQN: iqn,
      }

      const SCSIid = await Task.run({ properties: { name: 'probe target SCSIid' } }, () =>
        probeScsiId({ xapi, hostRef, deviceConfig, address })
      )
      const fullDeviceConfig = { ...deviceConfig, SCSIid }

      const { srRef, srUuid } = await introduceSr($defer, {
        xapi,
        hostRef,
        deviceConfig: fullDeviceConfig,
        id,
        nameLabel,
        diskPath,
      })

      const vdiUuid = await introduceVdi({
        xapi,
        srRef,
        SCSIid,
        size: lun.getSize(),
        diskPath,
        readOnly: cache === undefined,
      })

      info('mounted', { id, address, port, srUuid, vdiUuid, cacheVdiUuid: cache?.vdiUuid, diskPath })

      return {
        address,
        cache,
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
    }
  )

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
        await Task.run({ properties: { name: what } }, fn)
      } catch (error) {
        warn(`failed to ${what}`, { error, id })
        errors.push(error)
      }
    }

    await step('forget the SR', () => forgetSr(xapi, srRef))
    // stop serving first, so no I/O is left in flight
    await step('close the target', () => target.close())
    if (cache !== undefined) {
      // whatever fraction it reached: there is no more source to cache from,
      // so its job ends here rather than being left pending forever
      // the LUN closes the cache device too; doing it again is a no-op, and
      // makes sure the descriptor is gone before XAPI is asked to take the
      // disk away
      await step('close the cache device', () => cache.device.close())
      // unplugs on the way, and the VDI destroy retries on VDI_IN_USE
      await step('destroy the cache VBD', () => xapi.VBD_destroy(cache.vbdRef))
      await step('destroy the cache VDI', () => xapi.VDI_destroy(cache.vdiRef))
    }
    await step('release the caller resources', () => release?.())

    if (errors.length !== 0) {
      const error = new Error(`failed to unmount live mount ${id}`)
      error.cause = errors[0]
      error.errors = errors
      throw error
    }
    info('unmounted', { id, srUuid: mount.srUuid, cacheVdiUuid: mount.cache?.vdiUuid })
  }

  /**
   * Force every block of a cached mount into its cache disk, so it becomes a
   * complete copy of the source without waiting for something else to read it.
   *
   * @param {string} id - identifier returned by {@link LiveMount#mountDisk}
   * @returns {Promise<{ id: string, materialized: { blocks: number, total: number } }>}
   */
  async hydrateDisk(id) {
    const mount = this.#mounts.get(id)
    if (mount === undefined) {
      throw new Error(`no such live mount ${id}`)
    }
    if (mount.cache === undefined) {
      throw new Error(`live mount ${id} has no cache to hydrate`)
    }
    await Task.run({ properties: { name: 'hydrate' } }, () => mount.lun.hydrate())
    return { id, materialized: mount.lun.getMaterialized() }
  }

  /** Live disk mounts, in creation order. */
  listMountedDisks() {
    return [...this.#mounts.values()].map(({ id, srUuid, vdiUuid, cache, diskPath, iqn, address, port, lun }) => ({
      id,
      srUuid,
      vdiUuid,
      cacheVdiUuid: cache?.vdiUuid,
      diskPath,
      iqn,
      address,
      port,
      // how much of the source has been pulled into the cache: once every
      // block is there, the cache disk holds the whole disk. Not applicable
      // to an uncached mount, which never retains anything.
      materialized: lun.getMaterialized?.(),
    }))
  }
}
