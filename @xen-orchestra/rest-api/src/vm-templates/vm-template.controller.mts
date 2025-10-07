import { Example, Get, Security, Query, Request, Response, Route, Tags, Path, Delete, SuccessResponse } from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import type { XoAlarm, XoMessage, XoVdi, XoTask, XoVmTemplate } from '@vates/types'
import { Readable } from 'node:stream'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher, limitAndFilterArray } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  forbiddenOperationResp,
  incorrectStateResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'

import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import {
  partialVmTemplates,
  vmTemplate,
  vmTemplateIds,
  vmTemplateVdis,
} from '../open-api/oa-examples/vm-template.oa-example.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { partialTasks, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('vm-templates')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmTemplateController)
export class VmTemplateController extends XapiXoController<XoVmTemplate> {
  #alarmService: AlarmService
  #vmService: VmService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(VmService) vmService: VmService
  ) {
    super('VM-template', restApi)
    this.#alarmService = alarmService
    this.#vmService = vmService
  }

  /**
   * @example fields "id,isDefaultTemplate,name_label"
   * @example filter "isDefaultTemplate?"
   * @example limit 42
   * */
  @Example(vmTemplateIds)
  @Example(partialVmTemplates)
  @Get('')
  getVmTemplates(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmTemplate>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * Export VM-template. Compress is only used for XVA format
   *
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d"
   */
  @Get('{id}.{format}')
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format, Invalid compress')
  async exportVmTemplate(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: 'xva' | 'ova',
    @Query() compress?: boolean
  ): Promise<Readable> {
    const stream = await this.#vmService.export(id as XoVmTemplate['id'], 'VM-template', {
      compress,
      format,
      response: req.res,
    })
    process.on('SIGTERM', () => req.destroy())
    req.on('close', () => stream.destroy())

    return stream
  }

  /**
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d"
   * */
  @Example(vmTemplate)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplate(@Path() id: string): Unbrand<XoVmTemplate> {
    return this.getObject(id as XoVmTemplate['id'])
  }

  /**
   * @example id "6d50ba76-0f11-1ff1-4f6a-b502afc31b8e"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  async deleteVmTemplate(@Path() id: string): Promise<void> {
    const xapiVmTemplate = this.getXapiObject(id as XoVmTemplate['id'])
    await xapiVmTemplate.$xapi.VM_destroy(xapiVmTemplate.$ref)
  }

  /**
   * @example id "b7569d99-30f8-178a-7d94-801de3e29b5b-f873abe0-b138-4995-8f6f-498b423d234d"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplateAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vmTemplate = this.getObject(id as XoVmTemplate['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vmTemplate.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "6d50ba76-0f11-1ff1-4f6a-b502afc31b8e"
   * @example fields "VDI_type,id,name_label"
   * @example filter "VDI_type:user"
   * @example limit 42
   */
  @Example(vmTemplateVdis)
  @Get('{id}/vdis')
  @Tags('vdis')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplateVdis(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdi>>> {
    const vdis = this.#vmService.getVmVdis(id as XoVmTemplate['id'], 'VM-template')
    return this.sendObjects(limitAndFilterArray(vdis, { filter, limit }), req, obj => obj.type.toLowerCase() + 's')
  }

  /**
   * @example id "6d50ba76-0f11-1ff1-4f6a-b502afc31b8e"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmTemplateMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVmTemplate['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVmTemplateTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVmTemplate['id'], { filter, limit })

    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }
}
