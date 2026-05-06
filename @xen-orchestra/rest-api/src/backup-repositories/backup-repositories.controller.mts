import { Delete, Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { IdOr, XoBackupRepository } from '@vates/types'
import { forbiddenOperation } from 'xo-common/api-errors.js'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
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
   * Deletes a backup repository configuration.
   *
   * A repository cannot be deleted if it is referenced by any backup job (enabled or disabled).
   *
   * Required privilege:
   * - resource: backup-repository, action: delete
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Delete('{id}')
  @Middlewares(
    acl({
      resource: 'backup-repository',
      action: 'delete',
      objectId: 'params.id',
      getObject: ({ restApi }) => restApi.xoApp.getRemote,
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async forgetRepository(@Path() id: string): Promise<void> {
    const repositoryId = id as XoBackupRepository['id']

    const allJobs = await this.restApi.xoApp.getAllJobs()
    const referencingJobs = allJobs.filter(job => {
      if (job.type === 'backup' || job.type === 'metadataBackup') {
        return this.isRepositoryInRemotes(job.remotes, repositoryId)
      } else if (job.type === 'mirrorBackup') {
        return job.sourceRemote === repositoryId || this.isRepositoryInRemotes(job.remotes, repositoryId)
      }
      return false
    })

    if (referencingJobs.length > 0) {
      throw forbiddenOperation(
        'forget backup repository',
        `repository is referenced by ${referencingJobs.length} backup job(s)`
      )
    }

    await this.restApi.xoApp.removeRemote(repositoryId)
  }

  // remotes in stored jobs use the complex-matcher shape: { id: 'uuid' } or { id: { __or: [...] } }
  private isRepositoryInRemotes(
    remotes: IdOr<XoBackupRepository['id']> | undefined,
    repositoryId: XoBackupRepository['id']
  ): boolean {
    if (remotes === undefined) {
      return false
    }
    const { id } = remotes
    const ids = typeof id === 'string' ? [id] : id.__or
    return ids.includes(repositoryId)
  }
}
