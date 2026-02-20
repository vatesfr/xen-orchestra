import {
  Body,
  Delete,
  Example,
  Get,
  Middlewares,
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
import { provide } from 'inversify-binding-decorators'
import type { Readable } from 'node:stream'
import { json, type Request as ExRequest, type Response as ExResponse } from 'express'
import type { SUPPORTED_VDI_FORMAT, Xapi, XoAlarm, XoMessage, XoSr, XoTask, XoVdi } from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  internalServerErrorResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { partialVdis, vdi, vdiId, vdiIds } from '../open-api/oa-examples/vdi.oa-example.mjs'
import { VdiService } from './vdi.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'

type CreateVdiParams = Parameters<Xapi['VDI_create']>
type CreateVdiBody = Omit<CreateVdiParams[0], 'SR'> & { srId: string } & CreateVdiParams[1]

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
   * @example fields "*"
   * @example filter "snapshots:length:>2"
   * @example limit 42
   */
  @Example(vdiIds)
  @Example(partialVdis)
  @Get('')
  getVdis(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdi>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * Export VDI content
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Get('{id}.{format}')
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
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
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Put('{id}.{format}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
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
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Example(vdi)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVdi(@Path() id: string): Unbrand<XoVdi> {
    return this.getObject(id as XoVdi['id'])
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
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
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * Create an empty VDI on the given SR.
   *
   * @example body { "srId": "c4284e12-37c9-7967-b9e8-83ef229c3e03", "virtual_size": 10737418240, "name_label": "test VDI" }
   */
  @Example(vdiId)
  @Post('')
  @Middlewares(json())
  @SuccessResponse(createdResp.status, createdResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async createVdi(@Body() body: CreateVdiBody): Promise<{ id: string }> {
    const { srId, sm_config, ...rest } = body
    const xapiSr = this.restApi.getXapiObject<XoSr>(srId as XoSr['id'], 'SR')
    const xapi = xapiSr.$xapi

    const vdiRef = await xapi.VDI_create(
      {
        ...rest,
        SR: xapiSr.$ref,
      },
      {
        sm_config,
      }
    )

    const vdiUuid = await xapi.call<string>('VDI.get_uuid', vdiRef)

    this.setHeader('Location', `${BASE_URL}/vdis/${vdiUuid}`)

    return { id: vdiUuid }
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdi(@Path() id: string): Promise<void> {
    const xapiVdi = this.getXapiObject(id as XoVdi['id'])
    await xapiVdi.$xapi.VDI_destroy(xapiVdi.$ref)
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
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
    const messages = this.getMessagesForObject(id as XoVdi['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVdiTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVdi['id'], { filter, limit })
    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }

  /**
   * Migrate a VDI to another SR.
   *
   * Note: After migration, the VDI will have a new ID. The new ID is returned in the response.
   *
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example body { "srId": "4cb0d74e-a7c1-0b7d-46e3-09382c012abb" }
   */
  @Example(taskLocation)
  @Example(vdiId)
  @Post('{id}/actions/migrate')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(200, 'Ok')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async migrateVdi(
    @Path() id: string,
    @Body() body: { srId: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: Unbrand<XoVdi>['id'] }> {
    const vdiId = id as XoVdi['id']

    return this.createAction(
      async () => {
        const newVdi = await this.getXapi(vdiId).moveVdi(vdiId, body.srId as XoSr['id'])
        return { id: newVdi.uuid as Unbrand<XoVdi>['id'] }
      },
      {
        sync,
        taskProperties: {
          name: 'migrate VDI',
          objectId: vdiId,
        },
      }
    )
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putVdiTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdi = this.getXapiObject(id as XoVdi['id'])
    await vdi.$call('add_tags', tag)
  }

  /**
   * @example id "c77f9955-c1d2-4b39-aa1c-73cdb2dacb7e"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVdiTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vdi = this.getXapiObject(id as XoVdi['id'])
    await vdi.$call('remove_tags', tag)
  }
}
