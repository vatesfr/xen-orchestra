import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

// a backup archive id is `<backup repository id>/<metadata path>`
const getBackupRepositoryId = archiveId => archiveId.split('/')[0]

/**
 * Resolution layer between XO objects and the `LiveMount` shared mixin: it
 * turns a backup archive id + disk id + host id into a remote handler, a disk
 * path and a XAPI connection. The mounting itself lives in
 * `@xen-orchestra/mixins/live-mount/` so xo-proxy can reuse it, and so can any
 * future feature that mounts a disk from somewhere other than a backup.
 */
export default class BackupDiskMountsResolver {
  #app

  constructor(app) {
    this.#app = app
  }

  /**
   * Serve one disk of a backup archive as a read-only iSCSI LUN and attach it to
   * a host as an SR.
   *
   * @param {object} params
   * @param {string} params.archiveId - `<backup repository id>/<metadata path>`
   * @param {string} params.diskId - id of one of the archive's disks
   * @param {string} params.hostId - id of the host the disk is attached to
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
      return await app.liveMount.mountDisk({
        diskPath: diskId,
        handler: adapter.value.handler,
        hostRef: host._xapiRef,
        nameLabel: `[XO backup] ${archive.vm.name_label}`,
        release: () => adapter.dispose(),
        xapi: app.getXapi(host),
      })
    } catch (error) {
      await adapter.dispose()
      throw error
    }
  }

  /**
   * @param {string} id - identifier returned by `mountBackupArchiveDisk`
   */
  unmountBackupArchiveDisk(id) {
    return this.#app.liveMount.unmountDisk(id)
  }

  listMountedBackupArchiveDisks() {
    return this.#app.liveMount.listMountedDisks()
  }

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
