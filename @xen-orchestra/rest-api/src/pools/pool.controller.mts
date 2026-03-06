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
  Put,
  Delete,
} from 'tsoa'
import { inject } from 'inversify'
import { invalidParameters } from 'xo-common/api-errors.js'
import { PassThrough } from 'node:stream'
import { provide } from 'inversify-binding-decorators'
import { json, type Request as ExRequest, type Response as ExResponse } from 'express'
import type { VatesTask } from '@vates/types/lib/vates/task'

import { RestApi } from '../rest-api/rest-api.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  featureUnauthorized,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import type {
  XapiPoolStats,
  XapiStatsGranularity,
  XcpPatches,
  XenApiSr,
  XenApiVm,
  XoAlarm,
  XoGpuGroup,
  XoHost,
  XoMessage,
  XoNetwork,
  XoPif,
  XoPool,
  XoSr,
  XoTask,
  XoVdi,
  XoVgpuType,
  XoVm,
  XoVmTemplate,
  XsPatches,
} from '@vates/types'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  createVm,
  importVm,
  partialPools,
  pool,
  poolDashboard,
  poolIds,
  poolMissingPatches,
  poolStats,
} from '../open-api/oa-examples/pool.oa-example.mjs'
import type { CreateNetworkBody, CreateVmBody, CreateVmParams, PoolDashboard } from './pool.type.mjs'
import { partialTasks, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import { createNetwork } from '../open-api/oa-examples/schedule.oa-example.mjs'
import { BASE_URL } from '../index.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { PoolService } from './pool.service.mjs'
import { escapeUnsafeComplexMatcher, NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

@Route('pools')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('pools')
@provide(PoolController)
export class PoolController extends XapiXoController<XoPool> {
  #vmService: VmService
  #poolService: PoolService
  #alarmService: AlarmService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(VmService) vmService: VmService,
    @inject(PoolService) poolService: PoolService,
    @inject(AlarmService) alarmService: AlarmService
  ) {
    super('pool', restApi)
    this.#vmService = vmService
    this.#poolService = poolService
    this.#alarmService = alarmService
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
  @Response(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  createNetwork(
    @Path() id: string,
    @Body() body: CreateNetworkBody,
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: Unbrand<XoNetwork>['id'] }> {
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
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  emergencyShutdown(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
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
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  rollingReboot(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const poolId = id as XoPool['id']
    const action = async (task: VatesTask) => {
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
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  rollingUpdate(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const poolId = id as XoPool['id']
    const action = async (task: VatesTask) => {
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

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   * @example body {
   * "name_label": "new VM from REST API",
   * "template": "9bbcc5d1-ad4b-06f1-18f6-03125e809c38",
   * "boot": true
   * }
   */
  @Example(taskLocation)
  @Example(createVm)
  @Post('{id}/actions/create_vm')
  @Middlewares(json())
  @Tags('vms')
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async createVm(
    @Path() id: string,
    @Body() body: Unbrand<CreateVmBody>,
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: Unbrand<XoVm>['id'] }> {
    const poolId = id as XoPool['id']
    const action = async () => {
      const { affinity, template, install, vgpuType, gpuGroup, vdis, ...rest } = body

      // rebrand all branded type
      const vmId = await this.#vmService.create({
        affinityHost: affinity as XoHost['id'] | undefined,
        installRepository: install?.repository as XoVdi['id'] | '' | undefined,
        pool: poolId,
        template: template as XoVmTemplate['id'],
        vdis: vdis as CreateVmParams['vdis'],
        vgpuType: vgpuType as XoVgpuType['id'] | undefined,
        gpuGroup: gpuGroup as XoGpuGroup['id'] | undefined,
        ...rest,
      })

      return { id: vmId }
    }

    return this.createAction<{ id: XoVm['id'] }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        args: body,
        name: 'create VM',
        objectId: poolId,
      },
    })
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   */
  @Example(poolStats)
  @Get('{id}/stats')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid granularity')
  getStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiPoolStats> {
    return this.restApi.xoApp.getXapiPoolStats(id as XoPool['id'], granularity)
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629677"
   */
  @Example(poolDashboard)
  @Get('{id}/dashboard')
  @Response(notFoundResp.status, notFoundResp.description)
  async getPoolDashboard(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() ndjson?: boolean
  ): Promise<PoolDashboard | void> {
    const poolId = id as XoPool['id']
    // throw if pool not found
    this.getObject(poolId)

    const stream = ndjson ? new PassThrough() : undefined
    const isStream = ndjson && stream !== undefined
    if (isStream) {
      const res = req.res as ExResponse
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)
      stream.pipe(res)
    }

    const dashboard = await this.#poolService.getDashboard(poolId, { stream })

    if (isStream) {
      stream.end()
    } else {
      return dashboard
    }
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getPoolAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const pool = this.getObject(id as XoPool['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${pool.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   */
  @Example(poolMissingPatches)
  @Get('{id}/missing_patches')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  async getPoolMissingPatches(@Path() id: string): Promise<XcpPatches[] | XsPatches[]> {
    const pool = this.getObject(id as XoPool['id'])
    const { missingPatches } = await this.#poolService.getMissingPatches(pool.id)

    return missingPatches
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example fields "name,id,$object"
   * @example filter "name:IP_CONFIGURED_PIF_CAN_UNPLUG"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getPoolMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoPool['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putPoolTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const pool = this.getXapiObject(id as XoPool['id'])
    await pool.$call('add_tags', tag)
  }

  /**
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deletePoolTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const pool = this.getXapiObject(id as XoPool['id'])
    await pool.$call('remove_tags', tag)
  }

  /**
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getPoolTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoPool['id'], { filter, limit })

    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }

  /**
   * Reconfigure the management interface for all hosts in the pool to use the given network.
   *
   * Each host in the pool will switch their management interface to a PIF on the specified network.
   * The PIFs on the target network must already have IP addresses configured.
   *
   * @example id "355ee47d-ff4c-4924-3db2-fd86ae629676"
   * @example body { "network": "c787b75c-3e0d-70fa-d0c3-cbfd382d7e33" }
   */
  @Example(taskLocation)
  @Post('{id}/actions/management_reconfigure')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  managementReconfigure(
    @Path() id: string,
    @Body() body: { network: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const poolId = id as XoPool['id']
    const action = async () => {
      const pool = this.getObject(poolId)
      const network = this.restApi.getObject<XoNetwork>(body.network as XoNetwork['id'], 'network')
      if (network.$pool !== pool.id) {
        throw invalidParameters(`the network ${network.uuid} does not belong to pool ${pool.uuid}`)
      }
      const xapiPool = this.getXapiObject(poolId)
      await xapiPool.$xapi.callAsync('pool.management_reconfigure', network._xapiRef)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'reconfigure pool management interface',
        objectId: poolId,
        args: body,
      },
    })
  }
}
