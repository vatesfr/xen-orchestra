import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

/**
 * @typedef {import('@vates/types').XoApp} XoApp
 * @typedef {import('@vates/types').BackupArchiveDiskMount} BackupArchiveDiskMount
 * @typedef {import('@vates/types').XoBackupRepository} XoBackupRepository
 * @typedef {import('@vates/types').XoHost} XoHost
 * @typedef {import('@vates/types').XoVmBackupArchive} XoVmBackupArchive
 */

/**
 * a backup archive id is `<backup repository id>/<metadata path>`
 *
 * @param {XoVmBackupArchive['id']} archiveId
 * @returns {XoBackupRepository['id']}
 */
const getBackupRepositoryId = archiveId => archiveId.split('/')[0]

/**
 * Resolution layer between XO objects and the `LiveMount` shared mixin: it
 * turns a backup archive id + disk id + host id into a remote handler, a disk
 * path and a XAPI connection. The mounting itself lives in
 * `@xen-orchestra/mixins/live-mount/` so xo-proxy can reuse it, and so can any
 * future feature that mounts a disk from somewhere other than a backup.
 */
export default class BackupDiskMountsResolver {
  /** @type {XoApp} */
  #app

  // mount id -> { archiveId, hostId }, so a mount id can be resolved back to
  // the archive/host it actually belongs to, and a caller-supplied archive id
  // can be checked against the one the mount was created for
  /** @type {Map<BackupArchiveDiskMount['id'], { archiveId: XoVmBackupArchive['id'], hostId: XoHost['id'] }>} */
  #mountOwners = new Map()

  /** @param {XoApp} app */
  constructor(app) {
    this.#app = app

    // a mount also disappears on its own, when the VDI it serves is removed from the pool — e.g.
    // when the VM it was attached to is deleted
    app.liveMount.on('unmounted', id => {
      this.#mountOwners.delete(id)
    })
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

    const remote = await app.getRemoteWithCredentials(getBackupRepositoryId(archiveId))
    const adapter = await app.getBackupsRemoteAdapter(remote)
    try {
      const mount = await app.liveMount.mountDisk({
        diskPath: diskId,
        handler: adapter.value.handler,
        hostRef: host._xapiRef,
        nameLabel: `[XO backup] ${archive.vm.name_label}`,
        release: () => adapter.dispose(),
        xapi: app.getXapi(host),
      })
      this.#mountOwners.set(mount.id, { archiveId, hostId })
      return mount
    } catch (error) {
      await adapter.dispose()
      throw error
    }
  }

  /**
   * Archive/host a mount actually belongs to, so callers (e.g. the REST API's
   * ACL checks) don't have to trust a caller-supplied archive/host id.
   *
   * @param {BackupArchiveDiskMount['id']} id - identifier returned by `mountBackupArchiveDisk`
   * @returns {{ archiveId: XoVmBackupArchive['id'], hostId: XoHost['id'] }}
   */
  getBackupArchiveDiskMountOwner(id) {
    const owner = this.#mountOwners.get(id)
    if (owner === undefined) {
      throw noSuchObject(id, 'backup-archive-disk-mount')
    }
    return owner
  }

  /**
   * @param {BackupArchiveDiskMount['id']} id - identifier returned by `mountBackupArchiveDisk`
   * @returns {Promise<void>}
   */
  unmountBackupArchiveDisk(id) {
    this.#mountOwners.delete(id)
    return this.#app.liveMount.unmountDisk(id)
  }

  /** @returns {import('@vates/types').MountedBackupArchiveDisk[]} */
  listMountedBackupArchiveDisks() {
    return this.#app.liveMount.listMountedDisks()
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
