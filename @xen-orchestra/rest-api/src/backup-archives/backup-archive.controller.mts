import {
  Body,
  Example,
  Extension,
  Get,
  Middlewares,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest } from 'express'
import type {
  BackupArchiveDiskMount,
  BackupArchiveDiskMountProgress,
  XoBackupRepository,
  XoHost,
  XoSr,
  XoVm,
  XoVmBackupArchive,
} from '@vates/types'

import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  invalidParameters,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  backupArchive,
  backupArchiveDiskMount,
  backupArchiveDiskMountProgress,
  backupArchiveIds,
  partialBackupArchives,
} from '../open-api/oa-examples/backup-archive.oa-example.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { BackupArchiveService } from './backup-archive.service.mjs'
import type { HydrateLiveDiskBody, MountLiveDiskBody, UnmountLiveDiskBody } from './backup-archive.type.mjs'
import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'

@Route('backup-archives')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-archives')
@provide(BackupArchiveController)
export class BackupArchiveController extends XoController<XoVmBackupArchive> {
  #backupArchiveService: BackupArchiveService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(BackupArchiveService) backupArchiveService: BackupArchiveService
  ) {
    super('backup-archive', restApi)
    this.#backupArchiveService = backupArchiveService
  }

  async getAllCollectionObjects({
    backupRepositories = [],
  }: { backupRepositories?: (XoBackupRepository['id'] | '*')[] } = {}): Promise<XoVmBackupArchive[]> {
    const backupRepositoryIds: XoBackupRepository['id'][] = []

    if (backupRepositories.includes('*')) {
      const allBackupRepositories = await this.restApi.xoApp.getAllRemotes()
      allBackupRepositories.forEach(br => backupRepositoryIds.push(br.id))
    } else {
      for (const brId of backupRepositories) {
        const br = await this.restApi.xoApp.getRemote(brId as XoBackupRepository['id'])
        backupRepositoryIds.push(br.id)
      }
    }

    const backupArchivesByRemote = await this.restApi.xoApp.listVmBackupsNg(backupRepositoryIds)
    const vmBackupArchives = Object.values(backupArchivesByRemote)
      .filter(backupsByVm => backupsByVm !== undefined)
      .map(backupsByVm => Object.values(backupsByVm))
      .flat(2)

    return vmBackupArchives
  }

  getCollectionObject(id: XoVmBackupArchive['id']): Promise<XoVmBackupArchive> {
    return this.#backupArchiveService.getBackupArchive(id)
  }

  /**
   * Returns all backup archives that match the following privilege:
   * - resource: backup-archive, action: read
   *
   * You can use the alias "*" in "backup-repository" to select all backup repositories.
   *
   * @example backupRepositories ["c4284e12-37c9-7967-b9e8-83ef229c3e03", "1af95910-01b4-4e87-9c2f-d895cafe0776"]
   * @example fields "id,backupRepository,disks"
   * @example filter "disks:length:>0"
   * @example limit 42
   */
  @Example(backupArchiveIds)
  @Example(partialBackupArchives)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchives(
    @Request() req: ExRequest,
    @Query('backup-repository') backupRepositories?: string[],
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmBackupArchive>>> {
    const backupArchives = await this.getObjects({ backupRepositories, filter })
    return this.sendObjects(Object.values(backupArchives), req, {
      limit,
      privilege: { action: 'read', resource: 'backup-archive' },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-archive, action: read
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   */
  @Example(backupArchive)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'backup-archive',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchive(@Path() id: string): Promise<Unbrand<XoVmBackupArchive>> {
    const backupArchive = await this.getObject(id as XoVmBackupArchive['id'])
    return backupArchive
  }

  /**
   * Required privilege:
   * - resource: backup-archive, action: mount-live-disk
   *
   * Serve one disk of this archive as an iSCSI LUN and attach it, as an SR, to a host — so its
   * content is readable without being restored first.
   *
   * When `srId` is given, a disk is created there to cache what has been read: nothing is copied up
   * front, but a block fetched from the backup is kept, so re-reading it is local. Once the whole disk
   * has been read that cache holds a complete copy of it (see the `hydrateLiveDisk` action to force
   * that upfront). Writes are then accepted and land in the cache, which means the mount stops
   * matching the backup as soon as anything writes to it. The cache disk is destroyed on unmount.
   *
   * Without `srId` the mount has no local storage: every read goes straight to the backup (slower on
   * repeated access), writes are refused, and — since nothing needs to be plugged into the appliance
   * running this XO — `hostId` can be any host reachable by it, not just its own.
   *
   * `hostId` defaults to the host running this XO when `srId` is given, and is required otherwise.
   *
   * The returned `id` is the handle to pass to the `unmountLiveDisk` and `hydrateLiveDisk` actions.
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example body {
   *  "diskId": "/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/vdis/8b650248-ddd6-4188-ad8b-c0502865ac6c/f1f3c902-dcaa-4ec6-943e-6162c9d85fb2/20250801T080832Z.vhd",
   *  "srId": "7a44d4fa-2de6-0bff-7d91-d73ccaca5978"
   * }
   */
  @Example(backupArchiveDiskMount)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/mountLiveDisk')
  @Middlewares([
    json(),
    // the cache disk is created on an SR the caller chooses, and the disk can be
    // attached to any host the caller names: both get their own privilege, like
    // migrateVdi does for its destination SR — but only checked when actually
    // given, since both otherwise default to this appliance's own host
    acl([
      {
        resource: 'backup-archive',
        action: 'mount-live-disk',
        objectId: 'params.id',
        getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
      },
      {
        resource: 'sr',
        action: ({ req }) => (req.body.srId !== undefined ? 'import:vdi' : undefined),
        objectId: 'body.srId',
      },
      {
        resource: 'host',
        action: ({ req }) => (req.body.hostId !== undefined ? 'mount-live-disk' : undefined),
        objectId: 'body.hostId',
      },
    ]),
  ])
  @Tags('srs')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  mountLiveDisk(
    @Path() id: string,
    @Body() body: MountLiveDiskBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<BackupArchiveDiskMount> {
    const archiveId = id as XoVmBackupArchive['id']

    const action = () =>
      this.restApi.xoApp.mountBackupArchiveDisk({
        archiveId,
        diskId: body.diskId,
        hostId: body.hostId as XoHost['id'] | undefined,
        srId: body.srId as XoSr['id'] | undefined,
      })

    return this.createAction<BackupArchiveDiskMount>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: { name: 'mount live backup archive disk', objectId: archiveId, params: body },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-archive, action: unmount-live-disk
   *
   * Detach a disk mounted by the `mountLiveDisk` action: the SR is unplugged and forgotten, and the
   * iSCSI target is stopped.
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example body { "mountId": "6b1f0e9c2a7d4f83b5c1d9e0a4f76b28" }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/unmountLiveDisk')
  @Middlewares([
    json(),
    acl({
      resource: 'backup-archive',
      action: 'unmount-live-disk',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    }),
  ])
  @Tags('srs')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  unmountLiveDisk(
    @Path() id: string,
    @Body() body: UnmountLiveDiskBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const action = () => this.restApi.xoApp.unmountBackupArchiveDisk(body.mountId)

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'unmount live backup archive disk',
        objectId: id as XoVmBackupArchive['id'],
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-archive, action: hydrate-live-disk
   *
   * Force every block of a disk mounted by the `mountLiveDisk` action into its cache, so it becomes a
   * complete copy of the backup's disk without waiting for something else to read it. Fails if the
   * mount was created without a cache (no `srId` given to `mountLiveDisk`).
   *
   * @example id "231264c3-af43-4ec0-a3be-394c5b1fdbfc/xo-vm-backups/6ef7c09e-677b-1e6f-0546-7ab30413c61c/20250801T080832Z.json"
   * @example body { "mountId": "6b1f0e9c2a7d4f83b5c1d9e0a4f76b28" }
   */
  @Example(backupArchiveDiskMountProgress)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/hydrateLiveDisk')
  @Middlewares([
    json(),
    acl({
      resource: 'backup-archive',
      action: 'hydrate-live-disk',
      objectId: 'params.id',
      getObject: autoBindService(BackupArchiveService, 'getBackupArchive'),
    }),
  ])
  @Tags('srs')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParameters.status, invalidParameters.description)
  hydrateLiveDisk(
    @Path() id: string,
    @Body() body: HydrateLiveDiskBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: string; materialized: BackupArchiveDiskMountProgress }> {
    const action = () => this.restApi.xoApp.hydrateBackupArchiveDisk(body.mountId)

    return this.createAction(action, {
      sync,
      taskProperties: {
        name: 'hydrate live backup archive disk',
        objectId: id as XoVmBackupArchive['id'],
        params: body,
      },
    })
  }
}
