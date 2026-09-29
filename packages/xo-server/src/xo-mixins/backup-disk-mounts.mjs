import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

/**
 * @typedef {import('@vates/types').XoApp} XoApp
 * @typedef {import('@vates/types').BackupArchiveDiskMount} BackupArchiveDiskMount
 * @typedef {import('@vates/types').XoBackupRepository} XoBackupRepository
 * @typedef {import('@vates/types').XoHost} XoHost
 * @typedef {import('@vates/types').XoProxy} XoProxy
 * @typedef {import('@vates/types').XoVmBackupArchive} XoVmBackupArchive
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
  /** @type {XoApp} */
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
   *   }
   * >}
   */
  #mounts = new Map()

  /** @param {XoApp} app */
  constructor(app) {
    this.#app = app
  }

  /**
   * Serve one disk of a backup archive as a read-only iSCSI LUN and attach it to
   * a host as an SR.
   *
   * @param {object} params
   * @param {XoVmBackupArchive['id']} params.archiveId - `<backup repository id>/<metadata path>`
   * @param {string} params.diskId - id of one of the archive's disks, a path on the backup repository
   * @param {XoHost['id']} params.hostId - id of the host the disk is attached to
   * @returns {Promise<BackupArchiveDiskMount>}
   */
  async mountBackupArchiveDisk({ archiveId, diskId, hostId }) {
    const app = this.#app

    const archive = await this.#getArchive(archiveId)
    if (!archive.disks.some(disk => disk.id === diskId)) {
      // `diskId` is a path on the backup repository, an unchecked one would
      // expose any file it contains
      throw invalidParameters(`disk ${diskId} does not belong to backup archive ${archiveId}`)
    }

    const host = app.getObject(hostId, 'host')
    const nameLabel = `[XO backup] ${archive.vm.name_label}`

    const remote = await app.getRemoteWithCredentials(getBackupRepositoryId(archiveId))
    const proxyId = remote.proxy

    const mount =
      proxyId === undefined
        ? await this.#mountHere({ diskId, host, nameLabel, remote })
        : await this.#mountOnProxy({ diskId, host, nameLabel, proxyId, remote })

    this.#mounts.set(mount.id, { archiveId, hostId, proxyId })
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
   * @param {{ id: BackupArchiveDiskMount['id'], hostId: XoHost['id'] }[]} params.mounts - as reported by the restore
   * @param {XoProxy['id']} params.proxyId - proxy serving the mounts
   */
  registerProxyBackupArchiveDiskMounts({ archiveId, mounts, proxyId }) {
    for (const { id, hostId } of mounts) {
      this.#mounts.set(id, { archiveId, hostId, proxyId })
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

    try {
      await this.#app.callProxyMethod(proxyId, 'backup.unmountDisk', { id })
    } catch (error) {
      // a proxy which no longer knows the mount (restarted, or a previous teardown failed after
      // forgetting it) makes the entry stale. Any other failure may not have reached the proxy,
      // which would still serve the LUN: keep the entry so the unmount can be retried
      if (noSuchObject.is(error, { type: 'live-mount' })) {
        this.#mounts.delete(id)
      }
      throw error
    }
    this.#mounts.delete(id)
  }

  /**
   * Serve the disk from this appliance, which reads the backup repository itself.
   *
   * @returns {Promise<BackupArchiveDiskMount>}
   */
  async #mountHere({ diskId, host, nameLabel, remote }) {
    const app = this.#app
    const adapter = await app.getBackupsRemoteAdapter(remote)
    try {
      return await app.liveMount.mountDisk({
        diskPath: diskId,
        handler: adapter.value.handler,
        hostRef: host._xapiRef,
        nameLabel,
        release: () => adapter.dispose(),
        xapi: app.getXapi(host),
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
  async #mountOnProxy({ diskId, host, nameLabel, proxyId, remote }) {
    const app = this.#app
    // httpProxy is ignored when using XO Proxy
    const {
      allowUnauthorized,
      host: url,
      password,
      username,
    } = await app.getXenServerWithCredentials(app.getXenServerIdByObject(host))

    try {
      return await app.callProxyMethod(proxyId, 'backup.mountDisk', {
        disk: diskId,
        host: host.uuid,
        nameLabel,
        remote: {
          url: remote.url,
          options: remote.options,
        },
        xapi: {
          allowUnauthorized,
          credentials: { username, password },
          url,
        },
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
