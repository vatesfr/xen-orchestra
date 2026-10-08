import { createLogger } from '@xen-orchestra/log'
import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { liveMountXapiLabels } from '@xen-orchestra/backups/liveMountXapiLabels.mjs'

import { getCurrentVmUuid } from '../_XenStore.mjs'

const { info, warn } = createLogger('xo:xo-mixins:backup-disk-mounts')

/**
 * @typedef {import('@vates/types').XoApp} XoApp
 * @typedef {import('@vates/types').BackupArchiveDiskMount} BackupArchiveDiskMount
 * @typedef {import('@vates/types').XoBackupRepository} XoBackupRepository
 * @typedef {import('@vates/types').XoHost} XoHost
 * @typedef {import('@vates/types').XoProxy} XoProxy
 * @typedef {import('@vates/types').XoSr} XoSr
 * @typedef {import('@vates/types').XoVmBackupArchive} XoVmBackupArchive
 * @typedef {import('@vates/types').Xapi} Xapi
 */

/**
 * `XoApp` does not declare the app's own events nor the live mount mixin
 *
 * @typedef {XoApp & Pick<import('node:events').EventEmitter, 'on'> & {
 *   liveMount: import('@xen-orchestra/mixins/live-mount/index.mjs').default
 * }} App
 */

/**
 * a backup archive id is `<backup repository id>/<metadata path>`
 *
 * @param {XoVmBackupArchive['id']} archiveId
 * @returns {XoBackupRepository['id']}
 */
const getBackupRepositoryId = archiveId => archiveId.split('/')[0]

// JSON-RPC code of a method the proxy does not implement
const METHOD_NOT_FOUND = -32601

/**
 * A proxy which predates the live mount API answers `method not found`, which says nothing about
 * what is missing: report the actual reason, an upgrade is needed.
 */
const wrapProxyError = (error, proxyId) =>
  error?.code === METHOD_NOT_FOUND
    ? new Error(`the proxy ${proxyId} is too old to live mount a disk, upgrade it`, { cause: error })
    : error

/**
 * Resolution layer between XO objects and the `LiveMount` shared mixin: it
 * turns a backup archive id + disk id + host id into a remote handler, a disk
 * path and a XAPI connection. The mounting itself lives in
 * `@xen-orchestra/mixins/live-mount/` so xo-proxy can reuse it, and so can any
 * future feature that mounts a disk from somewhere other than a backup.
 *
 * A backup repository linked to a proxy is the one case this appliance cannot
 * serve itself: only the proxy can read it, so the LUN is served *by the
 * proxy*, which runs the very same mixin behind `backup.mountDisk`.
 *
 * Either way, the mounts are tracked here and only here — a proxy is driven by
 * a single XO, so it has no listing API of its own and is only ever told to
 * mount and to unmount.
 */
export default class BackupDiskMountsResolver {
  /** @type {App} */
  #app

  // every live mount this XO created, in creation order, whoever serves it: a mount id resolves
  // back to the archive/host it belongs to, so a caller-supplied archive id can be checked against
  // the one the mount was created for, and to the proxy serving it, if any
  /**
   * @type {Map<
   *   BackupArchiveDiskMount['id'],
   *   {
   *     archiveId: XoVmBackupArchive['id']
   *     hostId: XoHost['id']
   *     proxyId?: XoProxy['id']
   *     srUuid?: BackupArchiveDiskMount['srUuid']
   *   }
   * >}
   */
  #mounts = new Map()

  // SR uuid -> id of the mount it serves, for the mounts served by a proxy only: a uuid is unique
  // across pools, so a single map serves every connection
  /** @type {Map<BackupArchiveDiskMount['srUuid'], BackupArchiveDiskMount['id']>} */
  #proxyMountIdsBySrUuid = new Map()

  /** @param {App} app */
  constructor(app) {
    this.#app = app

    // a mount served here also disappears on its own, when the VDI it serves is removed from the
    // pool — e.g. when the VM it was attached to is deleted, or its SR forgotten by hand
    app.liveMount.on('unmounted', id => {
      this.#mounts.delete(id)
    })

    // a reconnection is a new connection, the previous one no longer reports anything, nor answers:
    // for the mounts served here too, which the mixin has to be told about
    app.on('server:connected', ({ xapi }) => {
      this.#watchConnection(xapi)
      app.liveMount.watchConnection(xapi)
    })
  }

  /**
   * Serve one disk of a backup archive as an iSCSI LUN and attach it to a host
   * as an SR: read-only, unless `cacheSrId` is set.
   *
   * @param {object} params
   * @param {XoVmBackupArchive['id']} params.archiveId - `<backup repository id>/<metadata path>`
   * @param {string} params.diskId - id of one of the archive's disks, a path on the backup repository
   * @param {XoHost['id']} params.hostId - id of the host the disk is attached to
   * @param {XoSr['id']} [params.cacheSrId] - SR of a local VDI the disk is materialized into as it is
   * read, plugged onto the VM serving the mount (this appliance or the proxy). Unset, nothing is cached.
   * @returns {Promise<BackupArchiveDiskMount>}
   */
  async mountBackupArchiveDisk({ archiveId, cacheSrId, diskId, hostId }) {
    const app = this.#app

    const archive = await this.#getArchive(archiveId)
    const disk = archive.disks.find(disk => disk.id === diskId)
    if (disk === undefined) {
      // `diskId` is a path on the backup repository, an unchecked one would
      // expose any file it contains
      throw invalidParameters(`disk ${diskId} does not belong to backup archive ${archiveId}`)
    }

    const host = app.getObject(hostId, 'host')
    const xapiLabels = liveMountXapiLabels({
      readWrite: cacheSrId !== undefined,
      timestamp: archive.timestamp,
      vdiNameLabel: disk.name,
      vmNameLabel: archive.vm.name_label,
    })

    const remote = await app.getRemoteWithCredentials(getBackupRepositoryId(archiveId))
    const proxyId = remote.proxy

    const mount =
      proxyId === undefined
        ? await this.#mountHere({ cacheSrId, diskId, host, remote, xapiLabels })
        : await this.#mountOnProxy({ cacheSrId, diskId, host, proxyId, remote, xapiLabels })

    this.#trackMount(mount.id, { archiveId, hostId, proxyId, srUuid: mount.srUuid })
    return mount
  }

  /**
   * Archive/host a mount actually belongs to, so callers (e.g. the REST API's
   * ACL checks) don't have to trust a caller-supplied archive/host id.
   *
   * @param {BackupArchiveDiskMount['id']} id - identifier returned by `mountBackupArchiveDisk`
   * @returns {{ archiveId: XoVmBackupArchive['id'], hostId: XoHost['id'], proxyId?: XoProxy['id'] }}
   */
  getBackupArchiveDiskMountOwner(id) {
    const entry = this.#mounts.get(id)
    if (entry === undefined) {
      throw noSuchObject(id, 'backup-archive-disk-mount')
    }
    const { archiveId, hostId, proxyId } = entry
    return { archiveId, hostId, proxyId }
  }

  /**
   * Record the live mounts a proxy created on its own, during a restore it ran itself.
   *
   * Such a restore never goes through `mountBackupArchiveDisk`: the whole import happens on the
   * proxy, mounts included. Without this, the disks would be served but no longer addressable —
   * nothing would know which proxy to ask to unmount them.
   *
   * @param {object} params
   * @param {XoVmBackupArchive['id']} params.archiveId
   * @param {{ id: BackupArchiveDiskMount['id'], hostId: XoHost['id'], srUuid?: BackupArchiveDiskMount['srUuid'] }[]} params.mounts - as reported by the restore
   * @param {XoProxy['id']} params.proxyId - proxy serving the mounts
   */
  registerProxyBackupArchiveDiskMounts({ archiveId, mounts, proxyId }) {
    for (const { id, hostId, srUuid } of mounts) {
      this.#trackMount(id, { archiveId, hostId, proxyId, srUuid })
    }
  }

  /**
   * @param {BackupArchiveDiskMount['id']} id - identifier returned by `mountBackupArchiveDisk`
   * @returns {Promise<void>}
   */
  async unmountBackupArchiveDisk(id) {
    const proxyId = this.#mounts.get(id)?.proxyId

    if (proxyId === undefined) {
      // the mixin forgets the mount even when its teardown fails: there is nothing left to retry
      this.#mounts.delete(id)
      return this.#app.liveMount.unmountDisk(id)
    }

    // stop watching before the proxy forgets the SR: that removal is ours, not one to react to
    const srUuid = this.#mounts.get(id)?.srUuid
    if (srUuid !== undefined) {
      this.#proxyMountIdsBySrUuid.delete(srUuid)
    }

    try {
      await this.#app.callProxyMethod(proxyId, 'backup.unmountDisk', { id })
    } catch (error) {
      // a proxy which no longer knows the mount (restarted, or a previous teardown failed after
      // forgetting it) makes the entry stale. Any other failure may not have reached the proxy,
      // which would still serve the LUN: keep the entry, and its watch, so the unmount can be retried
      if (noSuchObject.is(error, { type: 'live-mount' })) {
        this.#mounts.delete(id)
      } else if (srUuid !== undefined) {
        this.#proxyMountIdsBySrUuid.set(srUuid, id)
      }
      throw error
    }
    this.#mounts.delete(id)
  }

  /**
   * Track a mount, and for one served by a proxy, watch its SR: nothing on the proxy side tells XO
   * when it disappears (its VM deleted, or the SR forgotten by hand), unlike the mounts served here,
   * which the mixin releases on its own.
   *
   * @param {BackupArchiveDiskMount['id']} id
   * @param {{ archiveId: XoVmBackupArchive['id'], hostId: XoHost['id'], proxyId?: XoProxy['id'], srUuid?: BackupArchiveDiskMount['srUuid'] }} entry
   */
  #trackMount(id, entry) {
    this.#mounts.set(id, entry)

    const { hostId, proxyId, srUuid } = entry
    if (proxyId === undefined) {
      return
    }
    if (srUuid === undefined) {
      // an older proxy, which does not report it: the mount works, it just has to be unmounted explicitly
      warn('the SR of this live mount is unknown, it will not be released on its own', { id, proxyId })
      return
    }
    this.#proxyMountIdsBySrUuid.set(srUuid, id)

    // `server:connected` covers the connections to come, this one may predate this mount
    let xapi
    try {
      xapi = this.#app.getXapi(this.#app.getObject(hostId, 'host'))
    } catch (error) {
      warn('cannot watch the SR of this live mount, the host is unknown', { error, hostId, id })
      return
    }
    this.#watchConnection(xapi)
  }

  /**
   * One listener per XAPI connection, whatever the number of mounts on it, never removed: it looks
   * up the SRs to watch at each removal.
   *
   * The SR events of the connection's own `objects`, not `app.objects`: the latter also reports
   * every object of a pool as removed when it is merely disconnected, which would unmount all its
   * disks.
   *
   * @param {Xapi} xapi
   */
  #watchConnection(xapi) {
    const srEvents = xapi.objects.allIndexes.type.getEventEmitterByType('SR')
    // a single handler shared by every connection, so the emitter itself tells whether this one is
    // already listened to
    if (!srEvents.listeners('remove').includes(this.#onSrRemoved)) {
      srEvents.on('remove', this.#onSrRemoved)
    }
  }

  /**
   * The type index reports each removed record on its own, as it was before its removal.
   *
   * @param {unknown} _
   * @param {{ uuid?: BackupArchiveDiskMount['srUuid'] } | undefined} sr
   */
  #onSrRemoved = (_, sr) => {
    const srUuid = sr?.uuid
    if (srUuid === undefined) {
      return
    }
    const id = this.#proxyMountIdsBySrUuid.get(srUuid)
    if (id !== undefined) {
      this.#onProxyMountSrRemoved(id, srUuid)
    }
  }

  /**
   * The SR is gone, but the proxy still serves the LUN and holds the backup repository: have it
   * release them. It fails to forget the SR a second time, it does everything else anyway.
   *
   * @param {BackupArchiveDiskMount['id']} id
   * @param {BackupArchiveDiskMount['srUuid']} srUuid
   */
  #onProxyMountSrRemoved(id, srUuid) {
    info('the SR of a live mount served by a proxy was removed, unmounting', { id, srUuid })
    this.unmountBackupArchiveDisk(id).catch(error => {
      if (!noSuchObject.is(error, { type: 'live-mount' })) {
        warn('failed to unmount after the SR was removed', { error, id, srUuid })
      }
    })
  }

  /**
   * Serve the disk from this appliance, which reads the backup repository itself.
   *
   * @returns {Promise<BackupArchiveDiskMount>}
   */
  async #mountHere({ cacheSrId, diskId, host, remote, xapiLabels }) {
    const app = this.#app
    const vmUuid = cacheSrId === undefined ? undefined : await getCurrentVmUuid()
    const adapter = await app.getBackupsRemoteAdapter(remote)
    try {
      return await app.liveMount.mountDisk({
        cacheSrUuid: cacheSrId,
        diskPath: diskId,
        handler: adapter.value.handler,
        hostRef: host._xapiRef,
        release: () => adapter.dispose(),
        vmUuid,
        xapi: app.getXapi(host),
        xapiLabels,
      })
    } catch (error) {
      await adapter.dispose()
      throw error
    }
  }

  /**
   * Have the proxy serve the disk: it is the only one able to read this backup repository, and it
   * runs the same mixin. The XAPI credentials travel with the call, like for a restore, since the
   * SR is introduced by whoever serves the LUN.
   *
   * @returns {Promise<BackupArchiveDiskMount>}
   */
  async #mountOnProxy({ cacheSrId, diskId, host, proxyId, remote, xapiLabels }) {
    const app = this.#app
    let vmUuid
    if (cacheSrId !== undefined) {
      vmUuid = (await app.getProxy(proxyId)).vmUuid
      // a proxy may be registered by its address only
      if (vmUuid == null) {
        throw invalidParameters(`the proxy ${proxyId} is not a known VM, it cannot hold a live mount cache`)
      }
    }
    // httpProxy is ignored when using XO Proxy
    const {
      allowUnauthorized,
      host: url,
      password,
      username,
    } = await app.getXenServerWithCredentials(app.getXenServerIdByObject(host))

    try {
      return await app.callProxyMethod(proxyId, 'backup.mountDisk', {
        cacheSr: cacheSrId,
        disk: diskId,
        host: host.uuid,
        remote: {
          url: remote.url,
          options: remote.options,
        },
        vm: vmUuid,
        xapi: {
          allowUnauthorized,
          credentials: { username, password },
          url,
        },
        xapiLabels,
      })
    } catch (error) {
      throw wrapProxyError(error, proxyId)
    }
  }

  /**
   * @param {XoVmBackupArchive['id']} archiveId
   * @returns {Promise<XoVmBackupArchive>}
   */
  async #getArchive(archiveId) {
    const backupRepositoryId = getBackupRepositoryId(archiveId)
    const backupsByVm = (await this.#app.listVmBackupsNg([backupRepositoryId]))[backupRepositoryId] ?? {}
    for (const backups of Object.values(backupsByVm)) {
      const archive = backups.find(backup => backup.id === archiveId)
      if (archive !== undefined) {
        return archive
      }
    }
    throw noSuchObject(archiveId, 'backup-archive')
  }
}
