import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { Branded, XoJob, XoMirrorJob } from '@vates/types'

import { notFoundResp, type Unbrand } from '../../open-api/common/response.common.mjs'
import type { SendObjects } from '../../helpers/helper.type.mjs'
import { XoController } from '../../abstract-classes/xo-controller.mjs'
import { RestApi } from '../../rest-api/rest-api.mjs'
import { inject } from 'inversify'
import { JobService } from '../jobs.service.mjs'
import { job, jobIds, partialJobs } from '../../open-api/oa-examples/jobs.oa-example.mjs'

type UnbrandedXoMirrorJob = Unbrand<Omit<XoMirrorJob, 'settings'>>

@Security('*')
@Route('backup/jobs')
@Response(notFoundResp.status, notFoundResp.description)
@Tags('backup')
@provide(MirrorJobController)
export class MirrorJobController extends XoController<XoMirrorJob> {
  #jobService: JobService
  constructor(@inject(RestApi) restApi: RestApi) {
    super(restApi)
    this.#jobService = new JobService(this.restApi)
  }
  async getAllCollectionObjects(): Promise<XoMirrorJob[]> {
    return this.#jobService.getMirrorJobs()
  }

  async getCollectionObject(id: Branded<'job'>): Promise<XoMirrorJob> {
    return this.restApi.xoApp.getJob(id) as Promise<XoMirrorJob>
  }

  /**
   * @example fields "name,type,remotes"
   * @example filter "name:test"
   * @example limit 42
   */
  @Example(jobIds)
  @Example(partialJobs)
  @Get('mirror')
  async getMirrorJobs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<UnbrandedXoMirrorJob>> {
    return this.sendObjects(Object.values(await this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "7d98fee4-3357-41a7-ac3f-9124212badb7"
   */
  @Example(job)
  @Get('mirror/{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  async getMirrorJob(@Path() id: string): Promise<UnbrandedXoMirrorJob> {
    return this.getObject(id as XoJob['id'])
  }
}
