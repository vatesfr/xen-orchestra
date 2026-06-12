import {
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
import { Request as ExRequest } from 'express'
import type { XoBackupRepository } from '@vates/types'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import {
  backupRepositoryIds,
  partialBackupRepositories,
  backupRepository,
} from '../open-api/oa-examples/backup-repository.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { BackupRepositoryService } from './backup-repository.service.mjs'

@Route('backup-repositories')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-repositories')
@provide(BackupRepositoryController)
export class BackupRepositoryController extends XoController<XoBackupRepository> {
  #backupRepositoryService: BackupRepositoryService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(BackupRepositoryService) backupRepositoryService: BackupRepositoryService
  ) {
    super('backup-repository', restApi)
    this.#backupRepositoryService = backupRepositoryService
  }

  // --- abstract methods
  getAllCollectionObjects(): Promise<XoBackupRepository[]> {
    return this.restApi.xoApp.getAllRemotes()
  }
  getCollectionObject(id: XoBackupRepository['id']): Promise<XoBackupRepository> {
    return this.restApi.xoApp.getRemote(id)
  }

  /**
   * Returns all backup repositories that match the following privilege:
   * - resource: backup-repository, action: read
   *
   * @example fields "id,name,enabled"
   * @example filter "enabled?"
   * @example limit 42
   */
  @Example(backupRepositoryIds)
  @Example(partialBackupRepositories)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  async getRepositories(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoBackupRepository>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'backup-repository' },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-repository, action: read
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(backupRepository)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'backup-repository',
      action: 'read',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getRemote,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getRepository(@Path() id: string): Promise<Unbrand<XoBackupRepository>> {
    return this.getObject(id as XoBackupRepository['id'])
  }

  /**
   * Forgets a backup repository configuration.
   *
   * A backup repository cannot be forgotten if it is referenced by any backup job (enabled or disabled).
   *
   * Required privilege:
   * - resource: backup-repository, action: forget
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/forget')
  @Middlewares(
    acl({
      resource: 'backup-repository',
      action: 'forget',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getRemote,
    })
  )
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async forgetBackupRepository(@Path() id: string): Promise<void> {
    const repositoryId = id as XoBackupRepository['id']

    const referencingJobs = await this.#backupRepositoryService.getReferencingJobs(repositoryId)
    if (referencingJobs.length > 0) {
      throw forbiddenOperation(
        'forget backup repository',
        `repository is referenced by ${referencingJobs.length} backup job(s): ${referencingJobs.join(', ')}`
      )
    }
    await this.restApi.xoApp.removeRemote(repositoryId)
  }
}
