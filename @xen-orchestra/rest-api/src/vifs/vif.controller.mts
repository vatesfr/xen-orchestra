import {
  Body,
  Delete,
  Example,
  Extension,
  Get,
  Middlewares,
  Patch,
  Path,
  Post,
  Put,
  Query,
  Request,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from 'tsoa'
import { inject } from 'inversify'
import { json, type Request as ExRequest } from 'express'
import type {
  EditVifProps,
  Xapi,
  XenApiNetwork,
  XenApiVif,
  XenApiVm,
  XoAlarm,
  XoMessage,
  XoNetwork,
  XoPif,
  XoTask,
  XoVif,
  XoVm,
} from '@vates/types'

import { SUPPORTED_ACTIONS_BY_RESOURCE, type SupportedActions } from '@xen-orchestra/acl'

import { acl, actionsFromBody } from '../middlewares/acl.middleware.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { provide } from 'inversify-binding-decorators'
import { RestApi } from '../rest-api/rest-api.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  forbiddenOperationResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { invalidParameters } from 'xo-common/api-errors.js'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVifs, vif, vifId, vifIds } from '../open-api/oa-examples/vif.oa-example.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

type UnbrandedXoVif = Unbrand<XoVif>

/**
 * @isInt vlan must be an integer
 * @minimum 0 vlan must be between 0 and 4094
 * @maximum 4094 vlan must be between 0 and 4094
 */
type VlanTag = number

type CreateVifParams = Parameters<Xapi['VIF_create']>
type CreateVifBody = Omit<CreateVifParams[0], 'network' | 'VM' | 'other_config' | 'qos_algorithm_params' | 'trunks'> &
  CreateVifParams[1] & {
    networkId: string
    vmId: string
    other_config?: { [key: string]: string } //  "ethtool-tx" : "false"
    qos_algorithm_params?: { [key: string]: string } // "kbps": "1000"
    trunks?: VlanTag[]
  }

type UpdateVifRequestBody = Omit<EditVifProps, 'ipv4Allowed' | 'ipv6Allowed' | 'trunks'> & {
  allowedIpv4Addresses?: EditVifProps['ipv4Allowed']
  allowedIpv6Addresses?: EditVifProps['ipv6Allowed']
  trunks?: VlanTag[]
}

const UPDATE_VIF_ACTIONS = Object.keys(SUPPORTED_ACTIONS_BY_RESOURCE.vif.update).map(
  k => `update:${k}` as SupportedActions<'vif'>
)

@Route('vifs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vifs')
@provide(VifController)
export class VifController extends XapiXoController<XoVif> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('VIF', restApi)
    this.#alarmService = alarmService
  }

  // Same rule as XAPI's assert_network_compatible_with_trunks_on_pif: a VIF on a network with a VLAN
  // is an access port, and XAPI refuses trunks there with NETWORK_INCOMPATIBLE_WITH_TRUNKS, which the
  // client would get as a 500
  #assertTrunksAllowed(networkId: XoNetwork['id']) {
    const network = this.restApi.getObject<XoNetwork>(networkId, 'network')
    if (network.PIFs.some(pifId => this.restApi.getObject<XoPif>(pifId, 'PIF').vlan !== -1)) {
      throw invalidParameters(`VLAN filtering needs a network without VLAN, network ${networkId} has one`)
    }
  }

  /**
   * Returns all VIFs that match the following privilege:
   * - resource: vif, action: read
   *
   * @example fields "attached,id,device"
   * @example filter "attached?"
   * @example limit 42
   */
  @Example(vifIds)
  @Example(partialVifs)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  getVifs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<UnbrandedXoVif>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'vif' },
    })
  }

  /**
   * Required privilege:
   * - resource: vif, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   */
  @Example(vif)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(acl({ resource: 'vif', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVif(@Path() id: string): UnbrandedXoVif {
    return this.getObject(id as XoVif['id'])
  }

  /**
   * Partial update of a VIF: only the fields present in the body are modified.
   * Setting the allowed IPs to a non-empty list switches the locking mode to `locked`.
   * `rateLimit` is expressed in kB/s (kilobytes per second).
   * `trunks` restricts a VIF on a network without VLAN to these 802.1Q VLANs (VLAN filtering, XCP-ng 8.3
   * with xapi 26.1.16 or later); `[]` lets every VLAN through again.
   *
   * Required privilege per field provided in the body:
   * - resource: vif, action: update:&lt;field&gt;
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example body { "lockingMode": "locked", "allowedIpv4Addresses": ["192.168.0.42"], "rateLimit": 1000, "trunks": [10, 20] }
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Patch('{id}')
  @Middlewares([
    json(),
    acl({
      resource: 'vif',
      actions: actionsFromBody(UPDATE_VIF_ACTIONS),
      objectId: 'params.id',
    }),
  ])
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async updateVif(@Path() id: string, @Body() body: UpdateVifRequestBody): Promise<void> {
    const vifId = id as XoVif['id']
    const { allowedIpv4Addresses, allowedIpv6Addresses, lockingMode, rateLimit, trunks, txChecksumming } = body

    // resolve first so a missing VIF 404s before any side effect
    const vif = this.getObject(vifId)
    if (Object.keys(body).length === 0) {
      return
    }

    if (trunks !== undefined && trunks.length !== 0) {
      this.#assertTrunksAllowed(vif.$network)
    }

    // keep XO's IP-pool accounting in sync when the allowed IPs change
    if (allowedIpv4Addresses !== undefined || allowedIpv6Addresses !== undefined) {
      const oldIpAddresses = vif.allowedIpv4Addresses.concat(vif.allowedIpv6Addresses)
      const newIpAddresses = (allowedIpv4Addresses ?? vif.allowedIpv4Addresses).concat(
        allowedIpv6Addresses ?? vif.allowedIpv6Addresses
      )
      await this.restApi.xoApp.allocIpAddresses(
        vifId,
        newIpAddresses.filter(address => !oldIpAddresses.includes(address)),
        oldIpAddresses.filter(address => !newIpAddresses.includes(address))
      )
    }

    await this.getXapi(vifId).editVif(vifId, {
      ipv4Allowed: allowedIpv4Addresses,
      ipv6Allowed: allowedIpv6Addresses,
      lockingMode,
      rateLimit,
      trunks,
      txChecksumming,
    })
  }

  /**
   * Adds an 802.1Q VLAN to the ones this VIF is restricted to (VLAN filtering, XCP-ng 8.3 with xapi
   * 26.1.16 or later). Only a VIF on a network without VLAN can be restricted.
   *
   * Required privilege:
   * - resource: vif, action: update:trunks
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example vlan 20
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/trunks/{vlan}')
  @Middlewares(acl({ resource: 'vif', action: 'update:trunks', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async putVifTrunk(@Path() id: string, @Path() vlan: VlanTag): Promise<void> {
    const vifId = id as XoVif['id']
    this.#assertTrunksAllowed(this.getObject(vifId).$network)
    await this.getXapiObject(vifId).$call('add_trunks', vlan)
  }

  /**
   * Removes an 802.1Q VLAN from the ones this VIF is restricted to. Removing the last one lets every
   * VLAN through again.
   *
   * Required privilege:
   * - resource: vif, action: update:trunks
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example vlan 20
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/trunks/{vlan}')
  @Middlewares(acl({ resource: 'vif', action: 'update:trunks', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async deleteVifTrunk(@Path() id: string, @Path() vlan: VlanTag): Promise<void> {
    await this.getXapiObject(id as XoVif['id']).$call('remove_trunks', vlan)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/alarms')
  @Security('*', ['acl'])
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vif = this.getObject(id as XoVif['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vif.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/messages')
  @Security('*', ['acl'])
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVifMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVif['id'], { filter })

    return this.sendObjects(Object.values(messages), req, {
      path: 'messages',
      limit,
      privilege: { action: 'read', resource: 'message' },
    })
  }

  /**
   * Returns all tasks that match the following privilege:
   * - resource: task, action: read
   *
   * @example id "f028c5d4-578a-332c-394e-087aaca32dd3"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/tasks')
  @Security('*', ['acl'])
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVifTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoVif['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * `trunks` restricts the VIF to these 802.1Q VLANs (VLAN filtering, XCP-ng 8.3 with xapi 26.1.16 or
   * later), only on a network without VLAN.
   *
   * Required privilege:
   * - resource: vif, action: create
   *
   * @example body {
   *  "networkId": "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414",
   *  "vmId": "613f541c-4bed-fc77-7ca8-2db6b68f079c",
   *  "other_config": {
   *    "ethtool-tx": "false"
   *   },
   *  "qos_algorithm_params": {
   *    "kbps": "42"
   *  },
   *  "qos_algorithm_type": "ratelimit",
   *  "trunks": [10, 20]
   * }
   */
  @Example(vifId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('')
  @Middlewares([json(), acl({ resource: 'vif', action: 'create', object: ({ req }) => req.body })])
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  async createVif(
    @Body()
    body: CreateVifBody
  ): Promise<{ id: Unbrand<XoVif>['id'] }> {
    const { MAC, vmId, networkId, ...rest } = body

    const vm = this.restApi.getObject<XoVm>(vmId as XoVm['id'], 'VM')
    const network = this.restApi.getObject<XoNetwork>(networkId as XoNetwork['id'], 'network')

    if (vm.$pool !== network.$pool) {
      throw invalidParameters(`the VM ${vmId} and network ${networkId} do not belong to the same pool`)
    }

    if (rest.trunks !== undefined && rest.trunks.length !== 0) {
      this.#assertTrunksAllowed(network.id)
    }

    const xapi = this.getXapi(vmId as XoVm['id'])
    const vifRef = await xapi.VIF_create(
      {
        ...rest,
        VM: vm._xapiRef as XenApiVm['$ref'],
        network: network._xapiRef as XenApiNetwork['$ref'],
      },
      {
        MAC,
      }
    )

    const xapiVif = await xapi.barrier<XenApiVif>(vifRef)
    return { id: xapiVif.uuid }
  }

  /**
   * Required privilege:
   * - resource: vif, action: delete
   *
   * @example id "6b6ca0f5-6611-0636-4b0a-1fb1c1e96414"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Middlewares(acl({ resource: 'vif', action: 'delete', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async destroyVif(@Path() id: string): Promise<void> {
    const xapi = this.getXapi(id as XoVif['id'])
    await xapi.deleteVif(id as XoVif['id'])
  }

  /**
   * Hotplug the VIF, dynamically attaching it to the running VM
   * Requires PV drivers to be installed on the VM
   *
   * Required privilege:
   * - resource: vif, action: connect
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Middlewares(acl({ resource: 'vif', action: 'connect', objectId: 'params.id' }))
  @Post('{id}/actions/connect')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async connectVif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vifId = id as XoVif['id']

    const action = async () => {
      const xapi = this.getXapi(vifId)
      await xapi.connectVif(vifId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'connect VIF',
        objectId: vifId,
      },
    })
  }

  /**
   * Hot-unplug the VIF, dynamically detaching it from the running VM
   * Requires PV drivers to be installed on the VM
   *
   * Required privilege:
   * - resource: vif, action: disconnect
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/disconnect')
  @Middlewares(acl({ resource: 'vif', action: 'disconnect', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async disconnectVif(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vifId = id as XoVif['id']

    const action = async () => {
      const xapi = this.getXapi(vifId)
      await xapi.disconnectVif(vifId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'disconnect VIF',
        objectId: vifId,
      },
    })
  }
}
