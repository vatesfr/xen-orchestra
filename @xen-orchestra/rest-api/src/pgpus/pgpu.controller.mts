import { inject } from 'inversify'
import type { XoPgpu } from '@vates/types'
import type { Request as ExRequest } from 'express'

import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { Example, Get, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { notFoundResp, unauthorizedResp, Unbrand } from '../open-api/common/response.common.mjs'
import { provide } from 'inversify-binding-decorators'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { partialPgpus, pgpu, pgpuIds } from '../open-api/oa-examples/pgpu.oa-example.mjs'

@Route('pgpus')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pgpus')
@provide(PgpuController)
export class PgpuController extends XapiXoController<XoPgpu> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('PGPU', restApi)
  }

  /**
   * @example fields "id,dom0Access,gpuGroup"
   * @example filter "dom0Access:enabled"
   * @example limit 42
   */
  @Example(pgpuIds)
  @Example(partialPgpus)
  @Get('')
  getPgpus(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPgpu>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "838335fa-ee21-15e1-760a-a37a3a4ef1db"
   */
  @Example(pgpu)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPgpu(@Path() id: string): Unbrand<XoPgpu> {
    return this.getObject(id as XoPgpu['id'])
  }
}
