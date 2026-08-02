import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'

import { canSrHaveNewVdiOfSize } from '../xapi/utils.mjs'
import { getCurrentVmUuid } from '../_XenStore.mjs'

// a backup archive id is `<backup repository id>/<metadata path>`
const getBackupRepositoryId = archiveId => archiveId.split('/')[0]

/**
 * Resolution layer between XO objects and the `BackupDiskMounts` shared mixin:
 * it turns a backup archive id + disk id + SR id into a remote handler, a disk
 * path, this appliance's VM and a XAPI connection. The mounting itself lives in
 * `@xen-orchestra/mixins/BackupDiskMounts.mjs` so xo-proxy can reuse it.
 */
export default class BackupDiskMountsResolver {
  #app

  constructor(app) {
    this.#app = app
  }

  /**
   * Serve one disk of a backup archive as an iSCSI LUN and attach it to the host
   * running this appliance, cached in a new disk on `srId`.
   *
   * @param {object} params
   * @param {string} params.archiveId - `<backup repository id>/<metadata path>`
   * @param {string} params.diskId - id of one of the archive's disks
   * @param {string} params.srId - SR holding the cache disk
   */
  async mountBackupArchiveDisk({ archiveId, diskId, srId }) {
    const app = this.#app

    const archive = await this.#getArchive(archiveId)
    if (!archive.disks.some(disk => disk.id === diskId)) {
      // `diskId` is a path on the backup repository, an unchecked one would
      // expose any file it contains
      throw invalidParameters(`disk ${diskId} does not belong to backup archive ${archiveId}`)
    }

    const vm = await this.#getApplianceVm()
    const cacheSr = this.#getCacheSr(srId, vm)

    const remote = await app.getRemoteWithCredentials(getBackupRepositoryId(archiveId))
    const adapter = await app.getBackupsRemoteAdapter(remote)
    try {
      return await app.backupDiskMounts.mount({
        cacheSrRef: cacheSr.$ref,
        diskPath: diskId,
        handler: adapter.value.handler,
        nameLabel: `[XO backup] ${archive.vm.name_label}`,
        release: () => adapter.dispose(),
        vmRef: vm.$ref,
        xapi: vm.$xapi,
      })
    } catch (error) {
      await adapter.dispose()
      throw error
    }
  }

  /**
   * The VM this appliance runs in: the cache disk is plugged into it, and its
   * host is where the mount is served.
   */
  async #getApplianceVm() {
    const uuid = await getCurrentVmUuid()
    try {
      return this.#app.getXapiObject(uuid, 'VM')
    } catch (error) {
      throw invalidParameters(
        `this appliance's VM (${uuid}) is not handled by this XO, maybe it is not connected to the pool running it`,
        { cause: error }
      )
    }
  }

  /**
   * The SR for the cache disk: it must be able to hold a new VDI and be reachable
   * from the host running this appliance.
   *
   * Free space is left to XAPI to enforce at creation time — the disk's virtual
   * size is only known once its chain has been opened, inside the mixin.
   */
  #getCacheSr(srId, vm) {
    const app = this.#app
    const sr = app.getObject(srId, 'SR')
    const srRecord = app.getXapiObject(srId, 'SR')

    const host = vm.$resident_on
    if (host === undefined) {
      throw invalidParameters("this appliance's VM is not running on a host of a connected pool")
    }
    if (sr.$pool !== vm.$xapi.pool.uuid) {
      throw invalidParameters(`SR ${srId} is not in the pool running this appliance`)
    }
    // covers ISO and removable SRs
    if (!canSrHaveNewVdiOfSize(srRecord, 0)) {
      throw invalidParameters(`SR ${srId} cannot hold a new disk: it is an ISO or removable SR`)
    }
    if (!sr.shared && sr.$container !== host.uuid) {
      throw invalidParameters(`SR ${srId} is local to another host than the one running this appliance`)
    }
    if (!sr.$PBDs.some(pbdId => app.getObject(pbdId, 'PBD').attached)) {
      throw invalidParameters(`SR ${srId} has no attached PBD`)
    }

    return srRecord
  }

  /**
   * @param {string} id - identifier returned by `mountBackupArchiveDisk`
   */
  unmountBackupArchiveDisk(id) {
    return this.#app.backupDiskMounts.unmount(id)
  }

  listMountedBackupArchiveDisks() {
    return this.#app.backupDiskMounts.list()
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
