import type { AnyXoLog, XoBackupLog } from '@vates/types'
import { Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import { backupLog, backupLogIds, partialBackupLogs } from '../open-api/oa-examples/backup-log.oa-example.mjs'
import { BackupLogService } from './backup-log.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'

@Route('backup-logs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-logs')
@provide(BackupLogController)
export class BackupLogController extends XoController<XoBackupLog> {
  #backupLogService: BackupLogService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupLogService) backupLogService: BackupLogService) {
    super(restApi)
    this.#backupLogService = backupLogService
  }

  getAllCollectionObjects(): Promise<XoBackupLog[]> {
    return this.restApi.xoApp.getBackupNgLogsSorted({ filter: this.#backupLogService.isBackupLog }) as Promise<
      XoBackupLog[]
    >
  }

  getCollectionObject(id: AnyXoLog['id']): Promise<XoBackupLog> {
    return this.#backupLogService.getBackupLog(id)
  }

  /**
   * Returns all backup logs that match the following privilege:
   * - resource: backup-log, action: read
   *
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(backupLogIds)
  @Example(partialBackupLogs)
  @Get('')
  @Security('*', ['acl'])
  async getBackupLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoBackupLog>>> {
    const backupLogs = await this.getObjects({ filter })
    return this.sendObjects(Object.values(backupLogs), req, {
      limit,
      privilege: { action: 'read', resource: 'backup-log' },
    })
  }

  /**
   * Required privilege:
   * - resource: backup-log, action: read
   *
   * @example id "1753776067468"
   */
  @Example(backupLog)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'backup-log',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(BackupLogService, 'getBackupLog'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getBackupLog(@Path() id: string): Promise<Unbrand<XoBackupLog>> {
    return this.getObject(id as XoBackupLog['id'])
  }
}
