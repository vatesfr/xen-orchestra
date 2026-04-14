import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import { Example, Get, Middlewares, Path, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import type { XoPbd } from '@vates/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialPbds, pbd, pbdIds } from '../open-api/oa-examples/pbd.oa-example.mjs'

@Route('pbds')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Response(badRequestResp.status, badRequestResp.description)
@Tags('pbds')
@provide(PbdController)
export class PbdController extends XapiXoController<XoPbd> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('PBD', restApi)
  }

  /**
   * Returns all PBDs that match the following privilege:
   * - resource: pbd, action: read
   *
   * @example fields "attached,id,device_config"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(pbdIds)
  @Example(partialPbds)
  @Get('')
  @Security('*', ['acl'])
  getPbds(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPbd>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'pbd' },
    })
  }

  /**
   * Required privilege:
   * - resource: pbd, action: read
   *
   * @example id "16b2a60f-7c4d-f45f-7c7a-963b06fc587d"
   */
  @Example(pbd)
  @Get('{id}')
  @Middlewares(acl({ resource: 'pbd', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getPbd(@Path() id: string): Unbrand<XoPbd> {
    return this.getObject(id as XoPbd['id'])
  }
}
