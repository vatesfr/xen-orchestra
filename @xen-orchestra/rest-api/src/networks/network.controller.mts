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
  Delete,
  SuccessResponse,
  Put,
  Middlewares,
} from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Request as ExRequest } from 'express'
import type { XoAlarm, XoMessage, XoNetwork, XoTask } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { network, networkIds, partialNetworks } from '../open-api/oa-examples/network.oa-example.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { partialTasks, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import { acl } from '../middlewares/acl.middleware.mjs'

@Route('networks')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('networks')
@provide(NetworkController)
export class NetworkController extends XapiXoController<XoNetwork> {
  #alarmService: AlarmService
  constructor(@inject(RestApi) restApi: RestApi, @inject(AlarmService) alarmService: AlarmService) {
    super('network', restApi)
    this.#alarmService = alarmService
  }

  /**
   * Returns all networks that match the following privilege:
   * - resource: network, action: read
   *
   * @example fields "nbd,name_label,id"
   * @example filter "nbd?"
   * @example limit 42
   */
  @Example(networkIds)
  @Example(partialNetworks)
  @Get('')
  @Security('*', ['acl'])
  getNetworks(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoNetwork>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'network' },
    })
  }

  /**
   * Required privilege:
   * - resource: network, action: read
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   */
  @Example(network)
  @Get('{id}')
  @Middlewares(acl({ resource: 'network', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getNetwork(@Path() id: string): Unbrand<XoNetwork> {
    return this.getObject(id as XoNetwork['id'])
  }

  /**
   * Required privilege:
   * - resource: network, action: delete
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   */
  @Delete('{id}')
  @Middlewares(acl({ resource: 'network', action: 'delete', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteNetwork(@Path() id: string): Promise<void> {
    const networkId = id as XoNetwork['id']
    await this.getXapiObject(networkId).$xapi.deleteNetwork(networkId)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Security('*', ['acl'])
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getNetworkAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const network = this.getObject(id as XoNetwork['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${network.uuid}`,
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
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Security('*', ['acl'])
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getNetworkMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoNetwork['id'], { filter })

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
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Security('*', ['acl'])
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getNetworkTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoNetwork['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: network, action: update:tags
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'network', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putNetworkTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const network = this.getXapiObject(id as XoNetwork['id'])
    await network.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: network, action: update:tags
   *
   * @example id "9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'network', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteNetworkTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const network = this.getXapiObject(id as XoNetwork['id'])
    await network.$call('remove_tags', tag)
  }
}
