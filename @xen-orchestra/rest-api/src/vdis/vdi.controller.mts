import {
  Delete,
  Example,
  Get,
  Middlewares,
  Path,
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
import { provide } from 'inversify-binding-decorators'
import type { Readable } from 'node:stream'
import type { Request as ExRequest, Response as ExResponse } from 'express'
import type { SUPPORTED_VDI_FORMAT, XoAlarm, XoMessage, XoTask, XoVdi } from '@vates/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVdis, vdi, vdiIds } from '../open-api/oa-examples/vdi.oa-example.mjs'
import { VdiService } from './vdi.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('vdis')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vdis')
@provide(VdiController)
export class VdiController extends XapiXoController<XoVdi> {
  #alarmService: AlarmService
  #vdiService: VdiService
  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(VdiService) vdiService
  ) {
    super('VDI', restApi)
    this.#alarmService = alarmService
    this.#vdiService = vdiService
  }

  /**
   * Returns all VDIs that match the following privilege:
   * - resource: vdi, action: read
   *
   * @example fields "*"
   * @example filter "snapshots:length:>2"
   * @example limit 42
   */
  @Example(vdiIds)
  @Example(partialVdis)
  @Get('')
  @Security('*', ['acl'])
  getVdis(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdi>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'vdi' },
    })
  }

  /**
   *
   * Export VDI content
   *
   * Required privilege:
   * - resource: vdi, action: export-content
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Get('{id}.{format}')
  @Middlewares(acl({ resource: 'vdi', action: 'export-content', objectId: 'params.id' }))
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format')
  async exportVdiContent(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: Exclude<SUPPORTED_VDI_FORMAT, 'qcow2'>
  ): Promise<Readable> {
    const res = req.res as ExResponse
    const stream = await this.#vdiService.exportContent(id as XoVdi['id'], 'VDI', { format, response: res })
    process.on('SIGTERM', () => req.destroy())
    req.on('close', () => stream.destroy())
    return stream
  }

  /**
   *
   * Import VDI content
   *
   * Required privilege:
   * - resource: vdi, action: import-content
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Put('{id}.{format}')
  @Middlewares(acl({ resource: 'vdi', action: 'import-content', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async importVdiContent(
    @Request() req: ExRequest & { length?: number },
    @Path() id: string,
    @Path() format: Exclude<SUPPORTED_VDI_FORMAT, 'qcow2'>
  ): Promise<void> {
    const xapiVdi = this.getXapiObject(id as XoVdi['id'])

    if (req.headers['content-length'] !== undefined) {
      req.length = +req.headers['content-length']
    }
    process.on('SIGTERM', () => req.destroy())
    await xapiVdi.$xapi.VDI_importContent(xapiVdi.$ref, req, { format })
  }

  /**
   * Required privilege:
   * - resource: vdi, action: read
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Example(vdi)
  @Get('{id}')
  @Middlewares(acl({ resource: 'vdi', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVdi(@Path() id: string): Unbrand<XoVdi> {
    return this.getObject(id as XoVdi['id'])
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Security('*', ['acl'])
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vdi = this.getObject(id as XoVdi['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vdi.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Required privilege:
   * - resource: vdi, action: delete
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Delete('{id}')
  @Middlewares(acl({ resource: 'vdi', action: 'delete', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdi(@Path() id: string): Promise<void> {
    const xapiVdi = this.getXapiObject(id as XoVdi['id'])
    await xapiVdi.$xapi.VDI_destroy(xapiVdi.$ref)
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
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
  getVdiMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVdi['id'], { filter })

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
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
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
  async getVdiTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoVdi['id'], { filter })
    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: vdi, action: update:tags
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'vdi', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putVdiTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdi = this.getXapiObject(id as XoVdi['id'])
    await vdi.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: vdi, action: update:tags
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'vdi', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdiTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdi = this.getXapiObject(id as XoVdi['id'])
    await vdi.$call('remove_tags', tag)
  }
}
