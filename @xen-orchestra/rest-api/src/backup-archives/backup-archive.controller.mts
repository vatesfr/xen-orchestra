import { Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { noSuchObject } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import type { XoBackupRepository, XoVm, XoVmBackupArchive } from '@vates/types'

import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import {
  backupArchive,
  backupArchiveIds,
  partialBackupArchives,
} from '../open-api/oa-examples/backup-archive.oa-example.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { inject } from 'inversify'
import { BackupArchiveService } from './backup-archive.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
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
    super(restApi)
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
  @Get('')
  @Security('*', ['acl'])
  @Response(notFoundResp.status, notFoundResp.description)
  async getBackupArchives(
    @Request() req: ExRequest,
    @Query('backup-repository') backupRepositories?: string[],
    @Query() fields?: string,
    @Query() ndjson?: boolean,
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
}
