import {
  Example,
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

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  asynchronousActionResp,
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
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('backup-repositories')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-repositories')
@provide(BackupRepositoryController)
export class BackupRepositoryController extends XoController<XoBackupRepository> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('backup-repository', restApi)
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
   * Required privilege:
   * - resource: backup-repository, action: connect
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(taskLocation)
  @Post('{id}/actions/connect')
  @Middlewares(
    acl({
      resource: 'backup-repository',
      action: 'connect',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getRemote,
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  connectBackupRepository(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const backupRepositoryId = id as XoBackupRepository['id']
    return this.createAction<void>(() => this.restApi.xoApp.updateRemote(backupRepositoryId, { enabled: true }), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'connect backup repository', objectId: backupRepositoryId },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-repository, action: disable
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(taskLocation)
  @Post('{id}/actions/disable')
  @Middlewares(
    acl({
      resource: 'backup-repository',
      action: 'disable',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getRemote,
    })
  )
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  disableBackupRepository(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const backupRepositoryId = id as XoBackupRepository['id']
    return this.createAction<void>(() => this.restApi.xoApp.updateRemote(backupRepositoryId, { enabled: false }), {
      statusCode: noContentResp.status,
      sync,
      taskProperties: { name: 'disable backup repository', objectId: backupRepositoryId },
    })
  }
}
