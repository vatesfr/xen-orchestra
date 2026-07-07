import {
  Delete,
  Body,
  Example,
  Extension,
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
import { Request as ExRequest } from 'express'
import type { XenApiVdi, XoMessage, XoTask, XoVdi, XoAlarm, XoSr, XoHost } from '@vates/types'
import { SUPPORTED_VDI_FORMAT } from '@vates/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { BASE_URL } from '../index.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { partialSrs, sr, srIds } from '../open-api/oa-examples/sr.oa-example.mjs'
import { vdiId } from '../open-api/oa-examples/vdi.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { taskIds, partialTasks, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { SrService } from './sr.service.mjs'

@Route('srs')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('srs')
@provide(SrController)
export class SrController extends XapiXoController<XoSr> {
  #alarmService: AlarmService
  #srService: SrService
  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(SrService) srService: SrService
  ) {
    super('SR', restApi)
    this.#alarmService = alarmService
    this.#srService = srService
  }

  /**
   * Returns all SRs that match the following privilege:
   * - resource: sr, action: read
   *
   * @example fields "uuid,name_label,allocationStrategy"
   * @example filter "allocationStrategy:thin"
   * @example limit 42
   */
  @Example(srIds)
  @Example(partialSrs)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  getSrs(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoSr>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'sr' },
    })
  }

  /**
   * Required privilege:
   * - resource: sr, action: read
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(sr)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(acl({ resource: 'sr', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getSr(@Path() id: string): Unbrand<XoSr> {
    return this.getObject(id as XoSr['id'])
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
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
  getSrAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const sr = this.getObject(id as XoSr['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${sr.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Import an exported VDI
   *
   * Required privilege:
   * - resource: sr, action: import:vdi
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example name_label "VDI_foo_import"
   * @example name_description "VDI imported by the REST API"
   * @example raw true
   */
  @Example(vdiId)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/vdis')
  @Middlewares(acl({ resource: 'sr', action: 'import:vdi', objectId: 'params.id' }))
  @Tags('vdis')
  @SuccessResponse(createdResp.status, 'VDI imported')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async srImportVdi(
    @Request() req: ExRequest & { length?: number },
    @Path() id: string,
    @Query() name_label?: string,
    @Query() name_description?: string,
    @Query() raw?: boolean
  ): Promise<{ id: Unbrand<XoVdi>['id'] }> {
    const xapiSr = this.getXapiObject(id as XoSr['id'])
    const xapi = xapiSr.$xapi

    if (req.headers['content-length'] !== undefined) {
      req.length = +req.headers['content-length']
    }

    const vdiRef = await xapi.SR_importVdi(xapiSr.$ref, req, {
      format: raw ? SUPPORTED_VDI_FORMAT.raw : SUPPORTED_VDI_FORMAT.vhd,
      name_label,
      name_description,
    })
    const vdiId = await xapi.getField<XenApiVdi, 'uuid'>('VDI', vdiRef, 'uuid')

    this.setHeader('Location', `${BASE_URL}/vdis/${vdiId}`)

    return { id: vdiId }
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
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
  getSrMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoSr['id'], { filter })

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
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
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
  async getSrTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoSr['id'], { filter })
    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: sr, action: update:tags
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'sr', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putSrTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const sr = this.getXapiObject(id as XoSr['id'])
    await sr.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: sr, action: update:tags
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'sr', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteSrTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const sr = this.getXapiObject(id as XoSr['id'])
    await sr.$call('remove_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: sr, action: reclaim-space
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/reclaim_space')
  @Middlewares(acl({ resource: 'sr', action: 'reclaim-space', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async reclaimSpaceSr(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const srId = id as XoSr['id']
    const action = async () => {
      const sr = this.getXapiObject(srId)
      await sr.$xapi.SR_reclaimSpace(sr.$ref)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'SR reclaim space',
        objectId: srId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: sr, action: scan
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/scan')
  @Middlewares(acl({ resource: 'sr', action: 'scan', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async scanSr(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const srId = id as XoSr['id']
    const action = async () => {
      const sr = this.getXapiObject(srId)
      await sr.$xapi.callAsync('SR.scan', sr.$ref)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'SR scan',
        objectId: srId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: sr, action: forget
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/forget')
  @Middlewares(acl({ resource: 'sr', action: 'forget', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async forgetSr(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const srId = id as XoSr['id']
    const action = async () => {
      const xapiSr = this.getXapiObject(srId)
      await xapiSr.$xapi.forgetSr(srId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'forget sr',
        objectId: srId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: sr, action: delete
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}')
  @Middlewares(acl({ resource: 'sr', action: 'delete', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteSr(@Path() id: string): Promise<void> {
    await this.#srService.delete(id as XoSr['id'])
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example server "192.168.1.1"
   * @example nfsVersion "4"
   */
  @Get('{id}/probe/nfs')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeNfs(@Path() id: string, @Query() server: string, @Query() nfsVersion?: string) {
    return this.#srService.probeNfs(id as XoHost['id'], server, nfsVersion)
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Get('{id}/probe/zfs')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeZfs(@Path() id: string) {
    return this.#srService.probeZfs(id as XoHost['id'])
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Get('{id}/probe/hba')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeHba(@Path() id: string) {
    return this.#srService.probeHba(id as XoHost['id'])
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   */
  @Get('{id}/probe/iscsiiqns')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiIqns(
    @Path() id: string,
    @Query() targetIp: string,
    @Query() port?: number,
    @Query() chapUser?: string,
    @Query() chapPassword?: string
  ) {
    return this.#srService.probeIscsiIqns(id as XoHost['id'], targetIp, port, chapUser, chapPassword)
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   * @example targetIqn ""
   */
  @Get('{id}/probe/iscsiluns')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiLuns(
    @Path() id: string,
    @Query() targetIp: string,
    @Query() targetIqn: string,
    @Query() port?: number,
    @Query() chapUser?: string,
    @Query() chapPassword?: string
  ) {
    return this.#srService.probeIscsiLuns(id as XoHost['id'], targetIp, targetIqn, port, chapUser, chapPassword)
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   * @example targetIqn ""
   */
  @Get('{id}/probe/iscsi/exists')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiExists(
    @Path() id: string,
    @Query() targetIp: string,
    @Query() targetIqn: string,
    @Query() scsiId: string,
    @Query() port?: number,
    @Query() chapUser?: string,
    @Query() chapPassword?: string
  ) {
    return this.#srService.probeIscsiExists(
      id as XoHost['id'],
      targetIp,
      targetIqn,
      scsiId,
      port,
      chapUser,
      chapPassword
    )
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example scsiId ""
   */
  @Get('{id}/probe/hba/exists')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeHbaExists(@Path() id: string, @Query() scsiId: string) {
    return this.#srService.probeHbaExists(id as XoHost['id'], scsiId)
  }

  /**
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example scsiId ""
   */
  @Get('{id}/probe/nfs/exists')
  @Extension('x-mcp-exposure', 'confirm')
  @SuccessResponse(200, 'OK')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeNfsExists(
    @Path() id: string,
    @Query() server: string,
    @Query() serverPath: string,
    @Query() nfsVersion?: string
  ) {
    return this.#srService.probeNfsExists(id as XoHost['id'], server, serverPath, nfsVersion)
  }
}
