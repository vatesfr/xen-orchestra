import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { Branded, XoJob, XoMetadataBackupJob } from '@vates/types'

import { notFoundResp, type Unbrand } from '../../open-api/common/response.common.mjs'
import type { SendObjects } from '../../helpers/helper.type.mjs'
import { XoController } from '../../abstract-classes/xo-controller.mjs'
import { RestApi } from '../../rest-api/rest-api.mjs'
import { inject } from 'inversify'
import { JobService } from '../jobs.service.mjs'
import { job, jobIds, partialJobs } from '../../open-api/oa-examples/jobs.oa-example.mjs'

type UnbrandedXoMetadataJob = Unbrand<Omit<XoMetadataBackupJob, 'settings'>>

@Security('*')
@Route('backup/jobs')
@Response(notFoundResp.status, notFoundResp.description)
@Tags('backup')
@provide(MetadataJobController)
export class MetadataJobController extends XoController<XoMetadataBackupJob> {
  #jobService: JobService
  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
    this.#jobService = new JobService(this.restApi)
  }
  async getAllCollectionObjects(): Promise<XoMetadataBackupJob[]> {
    return this.#jobService.getMetadataJobs()
  }

  async getCollectionObject(id: Branded<'job'>): Promise<XoMetadataBackupJob> {
    return this.restApi.xoApp.getJob(id) as Promise<XoMetadataBackupJob>
  }

  /**
   * @example fields "name,type,remotes"
   * @example filter "name:test"
   * @example limit 42
   */
  @Example(jobIds)
  @Example(partialJobs)
  @Get('metadata')
  async getMetadataJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<UnbrandedXoMetadataJob>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "7d98fee4-3357-41a7-ac3f-9124212badb7"
   */
  @Get('metadata/{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getMetadataJob(@Path() id: string): Promise<UnbrandedXoMetadataJob> {
    return this.getObject(id as XoJob['id'])
  }
}
