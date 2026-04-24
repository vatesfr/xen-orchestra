import { AnyXoLog, XoRestoreLog } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { Deprecated, Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'

import { acl, autoBindService } from '../middlewares/acl.middleware.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  Unbrand,
} from '../open-api/common/response.common.mjs'
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

  getCollectionObject(id: AnyXoLog['id']): Promise<XoRestoreLog> {
    return this.#backupLogService.getRestoreLog(id)
  }

  /**
   * Returns all restore logs that match the following privilege:
   * - resource: restore-log, action: read
   *
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(restoreLogIds)
  @Example(partialRestoreLogs)
  @Get('')
  @Security('*', ['acl'])
  async getRestoreLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoRestoreLog>>>> {
    const restoreLogs = await this.getObjects({ filter })
    return this.sendObjects(Object.values(restoreLogs), req, {
      limit,
      privilege: { action: 'read', resource: 'restore-log' },
    })
  }

  /**
   * Required privilege:
   * - resource: restore-log, action: read
   *
   * @example id "1758180544428"
   */
  @Example(restoreLog)
  @Get('{id}')
  @Middlewares(
    acl({
      resource: 'restore-log',
      action: 'read',
      objectId: 'params.id',
      getObject: autoBindService(BackupLogService, 'getRestoreLog'),
    })
  )
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
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

  getCollectionObject(id: AnyXoLog['id']): Promise<XoRestoreLog> {
    return this.#backupLogService.getRestoreLog(id)
  }

  /**
   * Returns all restore logs that match the following privilege:
   * - resource: restore-log, action: read
   *
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
  ): SendObjects<Partial<Unbrand<XoRestoreLog>>> {
    const restoreLogs = await this.getObjects({ filter })
    return this.sendObjects(Object.values(restoreLogs), req, {
      path: 'restore-logs',
      limit,
      privilege: { action: 'read', resource: 'restore-log' },
    })
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
