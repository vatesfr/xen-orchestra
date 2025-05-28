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
import type { Task } from '@vates/types/lib/vates/task'

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
import type { SendObjects, WithHref } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'

import type { Xapi, XenApiSr, XenApiVm, XoGpuGroup, XoHost, XoNetwork, XoPif, XoPool, XoSr, XoVm } from '@vates/types'
import { importVm, partialPools, pool, poolIds } from '../open-api/oa-examples/pool.oa-example.mjs'
import type { CreateNetworkBody, CreateVmBody } from './pool.type.mjs'
import { taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { createNetwork } from '../open-api/oa-examples/schedule.oa-example.mjs'
import { BASE_URL } from '../index.mjs'

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
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoPool>>> {
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

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   */
  @Example(taskLocation)
  @Post('{id}/actions/rolling_reboot')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  rollingReboot(@Path() id: string, @Query() sync?: boolean): Promise<void | string> {
    const poolId = id as XoPool['id']
    const action = async (task: Task) => {
      const pool = this.getObject(poolId)
      await this.restApi.xoApp.rollingPoolReboot(pool, { parentTask: task })
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'rolling pool reboot',
        objectId: poolId,
        progress: 0,
      },
    })
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   */
  @Example(taskLocation)
  @Post('{id}/actions/rolling_update')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description, asynchronousActionResp.produce)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  rollingUpdate(@Path() id: string, @Query() sync?: boolean): Promise<void | string> {
    const poolId = id as XoPool['id']
    const action = async (task: Task) => {
      const pool = this.getObject(poolId)
      await this.restApi.xoApp.rollingPoolUpdate(pool, { parentTask: task })
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'rolling pool update',
        objectId: poolId,
        progress: 0,
      },
    })
  }

  // For this endpoint, the requestBody type is written directly to `tsoa.json` because TSOA does not provide a decorator for "octet-stream" file uploads
  /**
   *  Import an XVA VM into a pool
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   * @example sr "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33"
   *
   */
  @Example(importVm)
  @Post('{id}/vms')
  @Tags('vms')
  @SuccessResponse(createdResp.status, 'VM imported')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async importVm(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() sr?: string
  ): Promise<{ id: Unbrand<XoVm>['id'] }> {
    const pool = this.getXapiObject(id as XoPool['id'])
    const xapi = pool.$xapi

    let srRef: XenApiSr['$ref'] | undefined
    if (sr !== undefined) {
      srRef = this.restApi.getXapiObject<XoSr>(sr as XoSr['id'], 'SR').$ref
    }

    const vmRef = await xapi.VM_import(req, srRef)
    const vmId = await xapi.getField<XenApiVm, 'uuid'>('VM', vmRef, 'uuid')

    this.setHeader('Location', `${BASE_URL}/vms/${vmId}`)

    return { id: vmId }
  }

  @Post('{id}/actions/create_vm')
  async createVm(
    @Path() id: string,
    @Body() body: CreateVmBody,
    @Query() sync?: boolean
  ): Promise<string | { id: Unbrand<XoVm>['id'] }> {
    const poolId = id as XoPool['id']
    const action = async () => {
      const app = this.restApi.xoApp
      const xapi = app.getXapi(poolId)
      // @TODO: see if possible to enhance the type checking without this ugly workaround
      const vdis = body.vdis as Parameters<Xapi['createVm']>[1]['vdis']

      const xenApiVm = await xapi.createVm(
        body.templateUuid,
        {
          name_label: body.name_label,
          clone: body.clone,
          installRepository: body.install?.repository,
          vdis,
          vifs: body.vifs,
          vgpuType: body.vgpuType,
          gpuGroup: body.gpuGroup as XoGpuGroup['_xapiRef'],
          copyHostBiosStrings: body.copyHostBiosStrings,
          affinityHost: body.affinity as XoHost['id'],
        },
        undefined,
        app.apiContext.user.id
      )
      const vm = this.restApi.getObject<XoVm>(xenApiVm.uuid as XoVm['id'])

      return { id: vm.id }

      // $defer.onFailure.call($xapi, 'VM_destroy', vm.$ref);
      let cloudConfigVdiUuid
      // if (cloud_config !== undefined) {
      //   cloudConfigVdiUuid = await xapi.VM_createCloudInitConfig(vm.$ref, cloud_config, {
      //     networkConfig: network_config
      //   });
      // }
      let timeLimit
      // if (boot) {
      //   timeLimit = Date.now() + 10 * 60 * 1000;
      //   await xapi.callAsync('VM.start', vm.$ref, false, false);
      // }
      // if (destroy_cloud_config_vdi && cloudConfigVdiUuid !== undefined && boot) {
      //   try {
      //     await xapi.VDI_destroyCloudInitConfig(xapi.getObject(cloudConfigVdiUuid).$ref, {
      //       timeLimit
      //     });
      //   } catch (error) {
      //     console.error('destroy cloud init config VDI failed', {
      //       error,
      //       vdi: {
      //         uuid: cloudConfigVdiUuid
      //       },
      //       vm: {
      //         uuid: vm.uuid
      //       }
      //     });
      //   }
      // }
      // return vm.uuid;
    }

    return this.createAction<string | { id: XoVm['id'] }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        name: 'create VM',
        objectId: poolId,
      },
    })
  }
}
