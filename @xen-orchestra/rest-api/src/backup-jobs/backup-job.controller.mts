import * as CM from 'complex-matcher'
import {
  AnyXoBackupJob,
  XoVmBackupJob,
  XoMetadataBackupJob,
  XoMirrorBackupJob,
  AnyXoLog,
  XoBackupLog,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { inject } from 'inversify'
import { noSuchObject } from 'xo-common/api-errors.js'
import {
  Deprecated,
  Example,
  Get,
  Hidden,
  Middlewares,
  Path,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from 'tsoa'
import type { Request as ExRequest, Response as ExResponse } from 'express'
import { provide } from 'inversify-binding-decorators'

import { backupLog, backupLogIds, partialBackupLogs } from '../open-api/oa-examples/backup-log.oa-example.mjs'
import { BackupLogService } from '../backup-logs/backup-log.service.mjs'
import { notFoundResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { limitAndFilterArray } from '../helpers/utils.helper.mjs'
import type {
  UnbrandAnyXoBackupJob,
  UnbrandXoMetadataBackupJob,
  UnbrandXoMirrorBackupJob,
  UnbrandXoVmBackupJob,
} from './backup-job.type.mjs'
import { SendObjects } from '../helpers/helper.type.mjs'
import { XoController } from '../abstract-classes/xo-controller.mjs'
import {
  metadataBackupJob,
  metadataBackupJobIds,
  mirrorBackupJob,
  mirrorBackupJobIds,
  partialMetadataBackupJobs,
  partialMirrorBackupJobs,
  partialVmBackupJobs,
  vmBackupJob,
  vmBackupJobIds,
} from '../open-api/oa-examples/backup-job.oa-example.mjs'
import { BASE_URL } from '../index.mjs'

const log = createLogger('xo:rest-api:backupJob-controller')

@Route('backup-jobs')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('backup-jobs')
@provide(BackupJobController)
export class BackupJobController extends XoController<AnyXoBackupJob> {
  async getAllCollectionObjects(): Promise<AnyXoBackupJob[]> {
    const allJobs = await this.restApi.xoApp.getAllJobs()
    const backupJobs = allJobs.filter(job => 'type' in job)
    return backupJobs
  }

  async getCollectionObject(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    const job = await this.restApi.xoApp.getJob(id)
    if (!('type' in job)) {
      // not a backup job
      throw noSuchObject(id, 'backup-job')
    }

    return job
  }

  /**
   *
   * @example fields "name,mode,type,id"
   * @example filter "type:backup"
   * @example limit 42
   */
  @Example(vmBackupJobIds)
  @Example(partialVmBackupJobs)
  @Get('')
  async getBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<UnbrandAnyXoBackupJob>>> {
    const backupJobs = await this.getObjects({ filter, limit })
    return this.sendObjects(Object.values(backupJobs), req, 'backup-jobs')
  }

  /**
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Example(vmBackupJob)
  @Response(notFoundResp.status, notFoundResp.description)
  @Get('{id}')
  getBackupJob(@Path() id: string): Promise<UnbrandAnyXoBackupJob> {
    return this.getObject(id as AnyXoBackupJob['id'])
  }
}

// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
@Route('backup')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Middlewares((_req, _res, next) => {
  log.warn(
    'You are calling a deprecated route. It will be removed in the futur. Please use `/rest/v0/backup-jobs` or `/rest/v0/backup-logs` instead'
  )
  next()
})
@provide(DeprecatedBackupController)
export class DeprecatedBackupController extends XoController<AnyXoBackupJob> {
  #backupLogService: BackupLogService

  constructor(@inject(RestApi) restApi: RestApi, @inject(BackupLogService) backupLogService: BackupLogService) {
    super(restApi)
    this.#backupLogService = backupLogService
  }

  async getAllCollectionObjects(): Promise<AnyXoBackupJob[]> {
    const backupJobs = await this.restApi.xoApp.getAllJobs()
    return backupJobs.filter(job => 'type' in job)
  }

  async getCollectionObject(id: AnyXoBackupJob['id']): Promise<AnyXoBackupJob> {
    const backupJob = await this.restApi.xoApp.getJob(id)
    if (!('type' in backupJob)) {
      throw noSuchObject(id, 'backup-job')
    }

    return backupJob
  }

  override async getObject<T extends AnyXoBackupJob>(id: T['id']): Promise<AnyXoBackupJob>
  override async getObject<T extends AnyXoBackupJob>(
    id: T['id'],
    type: T['type']
  ): Promise<Extract<AnyXoBackupJob, { type: T }>>
  override async getObject<T extends AnyXoBackupJob>(id: T['id'], type?: T['type']): Promise<AnyXoBackupJob> {
    const backupJob = await super.getObject(id)
    if (backupJob.type !== type) {
      throw noSuchObject(id, type)
    }

    return backupJob
  }

  /**
   *
   * @example fields "name,mode,id"
   * @example filter "mode:delta"
   * @example limit 42
   */
  @Example(vmBackupJobIds)
  @Example(partialVmBackupJobs)
  @Deprecated()
  @Get('jobs/vm')
  @Tags('backup-jobs')
  async getVmBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<UnbrandXoVmBackupJob>>> {
    const vmBackupJobs = await this.restApi.xoApp.getAllJobs('backup')
    return this.sendObjects(limitAndFilterArray(vmBackupJobs, { filter, limit }), req, 'backup-jobs')
  }

  // For compatibility, redirect /backup/jobs/:id to /backup/jobs/vm/:id
  @Hidden()
  @Get('jobs/{id}')
  @Tags('backup-jobs')
  async redirectToVmBackupJob(@Request() req: ExRequest, @Path() id: string) {
    const res = req.res as ExResponse
    res.redirect(308, BASE_URL + '/backup/jobs/vm/' + id)
  }

  /**
   * @example id "d33f3dc1-92b4-469c-ad58-4c2a106a4721"
   */
  @Example(vmBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Get('jobs/vm/{id}')
  @Tags('backup-jobs')
  getVmBackupJob(@Path() id: string): Promise<UnbrandXoVmBackupJob> {
    return this.getObject(id as XoVmBackupJob['id'], 'backup')
  }

  /**
   *
   * @example fields "name,xoMetadata,id"
   * @example filter "xoMetadata?"
   * @example limit 42
   */
  @Example(metadataBackupJobIds)
  @Example(partialMetadataBackupJobs)
  @Deprecated()
  @Get('jobs/metadata')
  @Tags('backup-jobs')
  async getMetadataBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<UnbrandXoMetadataBackupJob>>> {
    const metadataBackupJobs = await this.restApi.xoApp.getAllJobs('metadataBackup')
    return this.sendObjects(limitAndFilterArray(metadataBackupJobs, { filter, limit }), req, 'backup-jobs')
  }

  /**
   * @example id "b50f95fd-f6b7-4027-87b6-6a02c7dcd5f5"
   */
  @Example(metadataBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Get('jobs/metadata/{id}')
  @Tags('backup-jobs')
  getMetadataBackupJob(@Path() id: string): Promise<UnbrandXoMetadataBackupJob> {
    return this.getObject(id as XoMetadataBackupJob['id'], 'metadataBackup')
  }

  /**
   *
   * @example fields "name,mode,id"
   * @example filter "mode:delta"
   * @example limit 42
   */
  @Example(mirrorBackupJobIds)
  @Example(partialMirrorBackupJobs)
  @Deprecated()
  @Get('jobs/mirror')
  @Tags('backup-jobs')
  async getMirrorBackupJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<UnbrandXoMirrorBackupJob>>> {
    const mirrorBackupJobs = await this.restApi.xoApp.getAllJobs('mirrorBackup')
    return this.sendObjects(limitAndFilterArray(mirrorBackupJobs, { filter, limit }), req, 'backup-jobs')
  }

  /**
   * @example id "e680c14c-ab52-45c8-bb0e-bd4ca12ea8f9"
   */
  @Example(mirrorBackupJob)
  @Deprecated()
  @Response(notFoundResp.status, notFoundResp.description)
  @Get('jobs/mirror/{id}')
  @Tags('backup-jobs')
  getMirrorBackupJob(@Path() id: string): Promise<UnbrandXoMirrorBackupJob> {
    return this.getObject(id as XoMirrorBackupJob['id'], 'mirrorBackup')
  }

  /**
   * @example fields "jobName,status,data"
   * @example filter "status:success"
   * @example limit 42
   */
  @Example(backupLogIds)
  @Example(partialBackupLogs)
  @Deprecated()
  @Get('logs')
  @Tags('backup-logs')
  async getDeprecatedBackupLogs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoBackupLog>>>> {
    const userFilter = filter === undefined ? () => true : CM.parse(filter).createPredicate()

    const predicate = (log: AnyXoLog) => {
      if (!this.#backupLogService.isBackupLog(log)) {
        return false
      }

      return userFilter(log)
    }
    const logs = (await this.restApi.xoApp.getBackupNgLogsSorted({ filter: predicate, limit })) as XoBackupLog[]
    return this.sendObjects(logs, req, 'backup-logs')
  }

  /**
   * @example id "1753776067468"
   */
  @Example(backupLog)
  @Deprecated()
  @Get('logs/{id}')
  @Tags('backup-logs')
  async getDeprecatedBackupLog(@Path() id: string): Promise<Unbrand<XoBackupLog>> {
    const log = await this.restApi.xoApp.getBackupNgLogs(id as XoBackupLog['id'])
    if (!this.#backupLogService.isBackupLog(log)) {
      throw noSuchObject('backup-log')
    }

    return log
  }
}
// ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (09-12-2026)--------------------
