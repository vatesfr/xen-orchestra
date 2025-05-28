import {
  Example,
  Get,
  Path,
  Query,
  Response,
  Request,
  Route,
  Security,
  Tags,
  Post,
  Middlewares,
  Body,
  SuccessResponse,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest } from 'express'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  asynchronousActionResp,
  createdResp,
  featureUnauthorized,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type { XoNetwork, XoPif, XoPool } from '@vates/types'
import { partialPools, pool, poolIds } from '../open-api/oa-examples/pool.oa-example.mjs'
import type { CreateNetworkBody } from './pool.type.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { createNetwork } from '../open-api/oa-examples/schedule.oa-example.mjs'

@Route('pools')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolController)
export class PoolController extends XapiXoController<XoPool> {
  constructor(@inject(RestApi) restApi: RestApi) {
    super('pool', restApi)
  }

  /**
   *
   * @example fields "auto_poweron,name_label,id"
   * @example filter "auto_poweron?"
   * @example limit 42
   */
  @Example(poolIds)
  @Example(partialPools)
  @Get('')
  getPools(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() filter?: string,
    @Query() limit?: number
  ): string[] | WithHref<Partial<Unbrand<XoPool>>>[] {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   */
  @Example(pool)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getPool(@Path() id: string): Unbrand<XoPool> {
    return this.getObject(id as XoPool['id'])
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example body {
   *    "name": "awes0me_network",
   *    "description": "random description",
   *    "pif": "ad15b2c8-3d9a-194e-c43a-e3dcda74b256",
   *    "vlan": 0
   * }
   */
  @Example(taskLocation)
  @Example(createNetwork)
  @Post('{id}/actions/create_network')
  @Middlewares(json())
  @Tags('networks')
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  createNetwork(
    @Path() id: string,
    @Body() body: CreateNetworkBody,
    @Query() sync?: boolean
  ): Promise<string | { id: Unbrand<XoNetwork>['id'] }> {
    const poolId = id as XoPool['id']
    const action = async () => {
      const { pif, ...rest } = body
      const xapiPool = this.getXapiObject(poolId)
      const xapiNetwork = await xapiPool.$xapi.createNetwork({ pifId: pif as XoPif['id'], ...rest })
      const network = this.restApi.getObject<XoNetwork>(xapiNetwork.uuid as XoNetwork['id'], 'network')

      return { id: network.id }
    }

    return this.createAction<{ id: XoNetwork['id'] }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        name: 'create network',
        objectId: poolId,
        args: body,
      },
    })
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   */
  @Example(taskLocation)
  @Post('{id}/actions/emergency_shutdown')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  emergencyShutdown(@Path() id: string, @Query() sync?: boolean): Promise<void | string> {
    const poolId = id as XoPool['id']
    const action = async () => {
      await this.restApi.xoApp.checkFeatureAuthorization('POOL_EMERGENCY_SHUTDOWN')
      await this.getXapiObject(poolId).$xapi.pool_emergencyShutdown()
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'pool emergency shutdown',
        objectId: poolId,
      },
    })
  }
}
