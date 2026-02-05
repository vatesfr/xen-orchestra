import type { AnyXoLog, XoBackupLog } from '@vates/types'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { noSuchObject } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import { backupLog, backupLogIds, partialBackupLogs } from '../open-api/oa-examples/backup-log.oa-example.mjs'
import { BackupLogService } from './backup-log.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { badRequestResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'

@Route('backup-logs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-logs')
@provide(BackupLogController)
export class BackupLogController extends XoController<XoBackupLog> {
  #backupLogService: BackupLogService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupLogService) backupLogService: BackupLogService) {
    super('backup-log', restApi)
    this.#backupLogService = backupLogService
  }

  getAllCollectionObjects(): Promise<XoBackupLog[]> {
    return this.restApi.xoApp.getBackupNgLogsSorted({ filter: this.#backupLogService.isBackupLog }) as Promise<
      XoBackupLog[]
    >
  }

  async getCollectionObject(id: AnyXoLog['id']): Promise<XoBackupLog> {
    const log = await this.restApi.xoApp.getBackupNgLogs(id)
    if (!this.#backupLogService.isBackupLog(log)) {
      throw noSuchObject('backup-log')
    }
    return log
  }

  /**
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(backupLogIds)
  @Example(partialBackupLogs)
  @Get('')
  async getBackupLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoBackupLog>>>> {
    const backupLogs = await this.getObjects({ filter, limit })
    return this.sendObjects(Object.values(backupLogs), req)
  }

  /**
   * @example id "1753776067468"
   */
  @Example(backupLog)
  @Get('{id}')
  getBackupLog(@Path() id: string): Promise<Unbrand<XoBackupLog>> {
    return this.getObject(id as XoBackupLog['id'])
  }
}
