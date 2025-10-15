import { AnyXoLog, XoRestoreLog } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { Deprecated, Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { noSuchObject } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { badRequestResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { partialRestoreLogs, restoreLog, restoreLogIds } from '../open-api/oa-examples/restore-log.oa-example.mjs'

const log = createLogger('xo:rest-api:restoreLog-controller')

@Route('restore-logs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('restore-logs')
@provide(RestoreLogController)
export class RestoreLogController extends XoController<XoRestoreLog> {
  #backupLogService: BackupLogService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupLogService) backupLogService: BackupLogService) {
    super(restApi)
    this.#backupLogService = backupLogService
  }

  getAllCollectionObjects(): Promise<XoRestoreLog[]> {
    const filter = log => !this.#backupLogService.isBackupLog(log)
    return this.restApi.xoApp.getBackupNgLogsSorted({ filter }) as Promise<XoRestoreLog[]>
  }

  async getCollectionObject(id: AnyXoLog['id']): Promise<XoRestoreLog> {
    const log = await this.restApi.xoApp.getBackupNgLogs(id)
    if (this.#backupLogService.isBackupLog(log)) {
      throw noSuchObject('restore-log')
    }
    return log
  }

  /**
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(restoreLogIds)
  @Example(partialRestoreLogs)
  @Get('')
  async getRestoreLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoRestoreLog>>>> {
    const restoreLogs = await this.getObjects({ filter, limit })
    return this.sendObjects(Object.values(restoreLogs), req)
  }

  /**
   * @example id "fo"
   */
  @Example(restoreLog)
  @Get('{id}')
  getRestoreLog(@Path() id: string): Promise<Unbrand<XoRestoreLog>> {
    return this.getObject(id as XoRestoreLog['id'])
  }
}

// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
@Route('restore/logs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Middlewares((_req, _res, next) => {
  log.warn(
    'You are calling a deprecated route. It will be removed in the futur. Please use `/rest/v0/restore-logs` instead'
  )
  next()
})
@Tags('restore-logs')
@provide(DeprecatedRestoreController)
export class DeprecatedRestoreController extends XoController<XoRestoreLog> {
  #backupLogService: BackupLogService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupLogService) backupLogService: BackupLogService) {
    super(restApi)
    this.#backupLogService = backupLogService
  }

  getAllCollectionObjects(): Promise<XoRestoreLog[]> {
    const filter = log => !this.#backupLogService.isBackupLog(log)
    return this.restApi.xoApp.getBackupNgLogsSorted({ filter }) as Promise<XoRestoreLog[]>
  }

  async getCollectionObject(id: AnyXoLog['id']): Promise<XoRestoreLog> {
    const log = await this.restApi.xoApp.getBackupNgLogs(id)
    if (this.#backupLogService.isBackupLog(log)) {
      throw noSuchObject('restore-log')
    }
    return log
  }

  /**
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(restoreLogIds)
  @Example(partialRestoreLogs)
  @Deprecated()
  @Get('')
  async getDeprecatedRestoreLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoRestoreLog>>>> {
    const restoreLogs = await this.getObjects({ filter, limit })
    return this.sendObjects(Object.values(restoreLogs), req, 'restore-logs')
  }

  /**
   * @example id "1758180544428"
   */
  @Example(restoreLog)
  @Deprecated()
  @Get('{id}')
  getDeprecatedRestoreLog(@Path() id: string): Promise<Unbrand<XoRestoreLog>> {
    return this.getObject(id as XoRestoreLog['id'])
  }
}
// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
