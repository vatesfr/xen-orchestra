import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoBackupRepository } from '@vates/types'

import { badRequestResp, notFoundResp, unauthorizedResp, type Unbrand } from '../open-api/common/response.common.mjs'
import {
  backupRepositoryIds,
  partialBackupRepositories,
  backupRepository,
} from '../open-api/oa-examples/backup-repository.oa-example.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('backup-repositories')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-repositories')
@provide(BackupRepositoryController)
export class BackupRepositoryController extends XoController<XoBackupRepository> {
  // --- abstract methods
  getAllCollectionObjects(): Promise<XoBackupRepository[]> {
    return this.restApi.xoApp.getAllRemotes()
  }
  getCollectionObject(id: XoBackupRepository['id']): Promise<XoBackupRepository> {
    return this.restApi.xoApp.getRemote(id)
  }

  /**
   * @example fields "id,name,enabled"
   * @example filter "enabled?"
   * @example limit 42
   */
  @Example(backupRepositoryIds)
  @Example(partialBackupRepositories)
  @Get('')
  async getRepositories(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoBackupRepository>>>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(backupRepository)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getRepository(@Path() id: string): Promise<Unbrand<XoBackupRepository>> {
    return this.getObject(id as XoBackupRepository['id'])
  }
}
