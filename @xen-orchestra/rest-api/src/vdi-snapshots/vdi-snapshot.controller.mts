import {
  Delete,
  Deprecated,
  Example,
  Get,
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
import type { SUPPORTED_VDI_FORMAT, XoAlarm, XoMessage, XoTask, XoVdiSnapshot } from '@vates/types'

import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import {
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { partialVdiSnapshots, vdiSnapshot, vdiSnapshotIds } from '../open-api/oa-examples/vdi-snapshot.oa-example.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { VdiService } from '../vdis/vdi.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks } from '../open-api/oa-examples/task.oa-example.mjs'

@Route('vdi-snapshots')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vdis')
@provide(VdiSnapshotController)
export class VdiSnapshotController extends XapiXoController<XoVdiSnapshot> {
  #alarmService: AlarmService
  #vdiService: VdiService
  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(VdiService) vdiService: VdiService
  ) {
    super('VDI-snapshot', restApi)
    this.#alarmService = alarmService
    this.#vdiService = vdiService
  }

  /**
   * @example fields "uuid,snapshot_time,$snapshot_of"
   * @example filter "snapshot_time:>1725020038"
   * @example limit 42
   */
  @Example(vdiSnapshotIds)
  @Example(partialVdiSnapshots)
  @Get('')
  getVdiSnapshots(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdiSnapshot>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * Export VDI-snapshot content
   *
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   */
  @Get('{id}.{format}')
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format')
  async exportVdiSnapshotContent(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: Exclude<SUPPORTED_VDI_FORMAT, 'qcow2'>
  ): Promise<Readable> {
    const res = req.res as ExResponse
    const stream = await this.#vdiService.exportContent(id as XoVdiSnapshot['id'], 'VDI-snapshot', {
      format,
      response: res,
    })
    process.on('SIGTERM', () => req.destroy())
    req.on('close', () => stream.destroy())
    return stream
  }

  // ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (10-01-2026)--------------------
  // Do not forget to also remove the spec in tsoa.json
  /**
   *
   * Import VDI-snapshot content
   *
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   */
  @Deprecated()
  @Put('{id}.{format}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async importVdiSnapshotContent(
    @Request() req: ExRequest & { length?: number },
    @Path() id: string,
    @Path() format: Exclude<SUPPORTED_VDI_FORMAT, 'qcow2'>
  ) {
    const xapiVdiSnapshot = this.getXapiObject(id as XoVdiSnapshot['id'])

    if (req.headers['content-length'] !== undefined) {
      req.length = +req.headers['content-length']
    }
    process.on('SIGTERM', () => req.destroy())
    await xapiVdiSnapshot.$xapi.VDI_importContent(xapiVdiSnapshot.$ref, req, { format })
  }
  // ----------- DEPRECATED TO BE REMOVED IN ONE YEAR  (10-01-2026)--------------------

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   */
  @Example(vdiSnapshot)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiSnapshot(@Path() id: string): Unbrand<XoVdiSnapshot> {
    return this.getObject(id as XoVdiSnapshot['id'])
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiSnapshotAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vdiSnapshot = this.getObject(id as XoVdiSnapshot['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vdiSnapshot.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdiSnapshot(@Path() id: string): Promise<void> {
    const xapiVdiSnapshot = this.getXapiObject(id as XoVdiSnapshot['id'])
    await xapiVdiSnapshot.$xapi.VDI_destroy(xapiVdiSnapshot.$ref)
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdiSnapshotMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVdiSnapshot['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVdiSnapshotTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVdiSnapshot['id'], { filter, limit })
    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putVdiSnapshotTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdiSnapshot = this.getXapiObject(id as XoVdiSnapshot['id'])
    await vdiSnapshot.$call('add_tags', tag)
  }

  /**
   * @example id "d2727772-735b-478f-b6f9-11e7db56dfd0"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdiSnapshotTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdiSnapshot = this.getXapiObject(id as XoVdiSnapshot['id'])
    await vdiSnapshot.$call('remove_tags', tag)
  }
}
