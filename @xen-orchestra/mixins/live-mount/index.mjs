import { asyncEach } from '@vates/async-each'
import { DiskBlockDevice, IscsiTarget } from '@vates/iscsi'
import { createLogger } from '@xen-orchestra/log'
import { defer } from 'golike-defer'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { randomBytes } from 'node:crypto'
import { Task } from '@vates/task'

import { createChapCredentials, probeScsiId } from './_target.mjs'
import { forgetSr, introduceSr, introduceVdi } from './_sr.mjs'

const { info, warn } = createLogger('xo:mixins:LiveMount')

/**
 * Serve a disk as an iSCSI LUN and attach it, as an SR, to a host — so its
 * content is usable without copying it first.
 *
 * Only `app.config`/`app.hooks` are used from `app`: the source disk, XAPI
 * connection, appliance VM are all passed in by the caller, so
 * both xo-server and xo-proxy can use this mixin.
 */
export default class LiveMount {
  #app
  #createTarget
  #openDisk

  // mount id -> mount record
  #mounts = new Map()

  // `openDisk`/`createTarget`/ are injectable for tests only, like
  // xo-server's crypto-credentials mixin does with xenStore/fsPromises
  constructor(app, { openDisk = openDiskChain, createTarget = options => new IscsiTarget(options) } = {}) {
    this.#app = app
    this.#createTarget = createTarget
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
   * @returns {Promise<{ id: string, srUuid: string, vdiUuid: string iqn: string, address: string, port: number }>}
   */
  async mountDisk(params) {
    const mount = await this.#createDiskMount(params)
    this.#mounts.set(mount.id, mount)
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
      readOnly: true,
    })

    info('mounted', { id, address, port, srUuid, vdiUuid, diskPath })

    return {
      address,
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

    const { xapi, srRef, target, release } = mount

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
    await step('release the caller resources', () => release?.())

    if (errors.length !== 0) {
      const error = new Error(`failed to unmount live mount ${id}`)
      error.cause = errors[0]
      error.errors = errors
      throw error
    }
    info('unmounted', { id, srUuid: mount.srUuid })
  }
}
