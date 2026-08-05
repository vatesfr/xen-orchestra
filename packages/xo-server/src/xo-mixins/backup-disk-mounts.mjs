import { invalidParameters, noSuchObject } from 'xo-common/api-errors.js'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

import { canSrHaveNewVdiOfSize } from '../xapi/utils.mjs'
import { getCurrentVmUuid } from '../_XenStore.mjs'

// a backup archive id is `<backup repository id>/<metadata path>`
const getBackupRepositoryId = archiveId => archiveId.split('/')[0]

/**
 * Resolution layer between XO objects and the `LiveMount` shared mixin: turns
 * a backup archive id + disk id + SR id into a remote handler, disk path,
 * appliance VM and XAPI connection.
 *
 * Each mount gets its own long-lived XO task (created here, since the generic
 * mixin has no `app.tasks`), kept pending until `unmountBackupArchiveDisk`.
 * `LiveMount`'s steps already wrap themselves in ambient `@vates/task`
 * subtasks, so running the mount call inside this task via `runInside` nests
 * them under it for free.
 */
export default class BackupDiskMountsResolver {
  #app

  // mount id -> the long-lived task representing it, from `mountBackupArchiveDisk`
  #tasks = new Map()

  constructor(app) {
    this.#app = app
  }

  /**
   * Serve one disk of a backup archive as an iSCSI LUN and attach it, as an SR,
   * to a host.
   *
   * @param {object} params
   * @param {string} params.archiveId - `<backup repository id>/<metadata path>`
   * @param {string} params.diskId - id of one of the archive's disks
   * @param {string} [params.hostId] - host the disk is attached to; defaults to the host running this
   * appliance when `srId` is given (required to plug the cache disk there), otherwise required
   * @param {string} [params.srId] - SR for a local read/write cache; omit for a lower-performance,
   * read-only mount that needs no local storage and can target any host
   */
  async mountBackupArchiveDisk({ archiveId, diskId, hostId, srId }) {
    const app = this.#app

    const archive = await this.#getArchive(archiveId)
    if (!archive.disks.some(disk => disk.id === diskId)) {
      // `diskId` is a path on the backup repository, an unchecked one would
      // expose any file it contains
      throw invalidParameters(`disk ${diskId} does not belong to backup archive ${archiveId}`)
    }

    let cache
    let vm
    if (srId !== undefined) {
      vm = await this.#getApplianceVm()
      const cacheSr = this.#getCacheSr(srId, vm)
      cache = { srRef: cacheSr.$ref, vmRef: vm.$ref }
    }

    if (hostId === undefined) {
      if (vm === undefined) {
        throw invalidParameters('host is required when no cache SR is given')
      }
      hostId = vm.$resident_on.uuid
    }
    if (cache !== undefined) {
      // one file per (host, archive) pair, so a later mount of the same
      // archive to the same host resumes instead of starting cold; also
      // doubles as a cheap "is this archive currently live-mounted (or was,
      // and ended ungracefully)" existence check, keyed the same way
      cache.persistPath = join(
        app.config.get('datadir'),
        'live-mount-cache',
        hostId,
        createHash('sha256').update(archiveId).digest('hex')
      )
    }
    const host = app.getObject(hostId, 'host')
    // `vm` (from getXapiObject) has no `.$pool`; `vm.$xapi.pool.uuid` is the
    // established way to get its pool, already used the same way in #getCacheSr
    if (vm !== undefined && host.$pool !== vm.$xapi.pool.uuid) {
      // the mixin uses a single XAPI connection for both the cache disk and
      // the mounted host, so they must be reachable through the same one
      throw invalidParameters(`host ${hostId} is not in the pool running this appliance, required to use a cache`)
    }

    const remote = await app.getRemoteWithCredentials(getBackupRepositoryId(archiveId))
    const adapter = await app.getBackupsRemoteAdapter(remote)

    // independent from the REST call's own task (which only covers this
    // method's return): this one stays pending for as long as the disk is
    // mounted, so it is created as its own root rather than nested under
    // whatever ambient task called us
    const task = app.tasks.create({
      name: `live mount of ${archive.vm.name_label} disk ${diskId}`,
      objectId: archiveId,
      type: 'xo:live-mount',
      diskId,
    })
    try {
      // `LiveMount`'s own steps wrap themselves in ambient `@vates/task`
      // subtasks, so running the call inside `task` is all it takes for them
      // to nest under it
      const result = await task.runInside(() =>
        app.liveMount.mountDisk({
          cache,
          diskPath: diskId,
          handler: adapter.value.handler,
          hostRef: host._xapiRef,
          nameLabel: `[XO backup] ${archive.vm.name_label}`,
          release: () => adapter.dispose(),
          xapi: app.getXapi(host),
        })
      )
      // left pending on purpose: `unmountBackupArchiveDisk` ends it later
      this.#tasks.set(result.id, task)
      return result
    } catch (error) {
      // `runInside` already ended `task` in failure
      await adapter.dispose()
      throw error
    }
  }

  /**
   * The VM this appliance runs in: the cache disk, when there is one, is
   * plugged into it.
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
  async unmountBackupArchiveDisk(id) {
    const task = this.#tasks.get(id)
    // gone whether unmounting succeeds or not: `LiveMount.unmountDisk` drops
    // its own record up front too, so a retry against this id could never
    // find a task to resume anyway
    this.#tasks.delete(id)
    if (task === undefined) {
      return this.#app.liveMount.unmountDisk(id)
    }
    await task.runInside(() => this.#app.liveMount.unmountDisk(id))
    task.success()
  }

  /**
   * @param {string} id - identifier returned by `mountBackupArchiveDisk`; must have been mounted with an `srId`
   */
  async hydrateBackupArchiveDisk(id) {
    // Deliberately *not* run inside the mount's long-lived task, for three
    // reasons that all point the same way:
    //
    // - `runInside` admits a single occupant at a time (it asserts otherwise),
    //   and a hydration holds it for as long as it runs — hours on a large
    //   disk. `unmountBackupArchiveDisk` would then throw an AssertionError
    //   instead of unmounting, having already dropped its `#tasks` entry, so
    //   the mount task stayed pending forever with the disk still mounted.
    // - the mount task's abort signal would become the only way to stop a
    //   hydration, so "stop hydrating" and "unmount" could not be told apart.
    // - a failed hydration must not fail the mount, since the disk stays
    //   mounted either way — which previously took capturing the error and
    //   rethrowing it outside `runInside`.
    //
    // Nothing is lost by not nesting: cache-fill progress is reported on the
    // mount's `caching` subtask, held from mount time and independent of which
    // call materializes a block, and this call is covered by the caller's own
    // task the way any single-call action is.
    return this.#app.liveMount.hydrateDisk(id)
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
