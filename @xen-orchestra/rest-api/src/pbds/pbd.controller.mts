import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest } from 'express'
import { Route, Security, Request, Response, Get, Query, Path, Tags, Example, Post, SuccessResponse } from 'tsoa'
import { incorrectState } from 'xo-common/api-errors.js'
import type { XoPbd } from '@vates/types'

import {
  asynchronousActionResp,
  badRequestResp,
  incorrectStateResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialPbds, pbd, pbdIds } from '../open-api/oa-examples/pbd.oa-example.mjs'
import { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

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
   * @example fields "attached,id,device_config"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(pbdIds)
  @Example(partialPbds)
  @Get('')
  getPbds(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPbd>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "16b2a60f-7c4d-f45f-7c7a-963b06fc587d"
   */
  @Example(pbd)
  @Get('{id}')
  getPbd(@Path() id: string): Unbrand<XoPbd> {
    return this.getObject(id as XoPbd['id'])
  }

  /**
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Post('{id}/actions/plug')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async plugPbd(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pbdId = id as XoPbd['id']
    const action = async () => {
      const pbd = this.getXapiObject(pbdId)

      if (!pbd.currently_attached) {
        await pbd.$xapi.callAsync('PBD.plug', pbd.$ref)
      } else {
        throw new incorrectState({
          actual: pbd.currently_attached,
          expected: false,
          object: pbd,
          property: 'currently_attached',
        })
      }
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'plug pbd',
        objectId: pbdId,
      },
    })
  }

  /**
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Post('{id}/actions/unplug')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async unplugPbd(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const pbdId = id as XoPbd['id']
    const action = async () => {
      const pbd = this.getXapiObject(pbdId)

      if (pbd.currently_attached) {
        await pbd.$xapi.callAsync('PBD.unplug', pbd.$ref)
      } else {
        throw new incorrectState({
          actual: pbd.currently_attached,
          expected: true,
          object: pbd,
          property: 'currently_attached',
        })
      }
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'unplug pbd',
        objectId: pbdId,
      },
    })
  }
}
