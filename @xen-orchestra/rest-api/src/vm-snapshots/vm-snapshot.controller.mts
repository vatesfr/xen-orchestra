import {
  Delete,
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
  Middlewares,
} from 'tsoa'
import { Request as ExRequest } from 'express'
import { inject } from 'inversify'
import { Readable } from 'node:stream'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher, limitAndFilterArray } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { partialTasks, taskIds } from '../open-api/oa-examples/task.oa-example.mjs'
import {
  badRequestResp,
  forbiddenOperationResp,
  incorrectStateResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { acl } from '../middlewares/acl.middleware.mjs'
import type { XoAlarm, XoMessage, XoVdiSnapshot, XoTask, XoVmSnapshot } from '@vates/types'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { provide } from 'inversify-binding-decorators'
import {
  partialVmSnapshots,
  vmSnapshot,
  vmSnapshotIds,
  vmSnapshotVdis,
} from '../open-api/oa-examples/vm-snapshot.oa-example.mjs'
import { VmService } from '../vms/vm.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'

@Route('vm-snapshots')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
@provide(VmSnapshotController)
export class VmSnapshotController extends XapiXoController<XoVmSnapshot> {
  #alarmService: AlarmService
  #vmService: VmService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(VmService) vmService: VmService
  ) {
    super('VM-snapshot', restApi)
    this.#alarmService = alarmService
    this.#vmService = vmService
  }

  /**
   * Returns all VM snapshots that match the following privilege:
   * - resource: vm-snapshot, action: read
   *
   * @example fields "uuid,snapshot_time,$snapshot_of"
   * @example filter "snapshot_time:>1725020038"
   * @example limit 42
   */
  @Example(vmSnapshotIds)
  @Example(partialVmSnapshots)
  @Get('')
  getVmSnapshots(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVmSnapshot>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'vm-snapshot' },
    })
  }

  /**
   *
   * Export VM-snapshot. Compress is only used for XVA format
   *
   * Required privilege:
   * - resource: vm-snapshot, action: read
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   */
  @Get('{id}.{format}')
  @Middlewares(acl({ resource: 'vm-snapshot', action: 'read', objectId: 'params.id' }))
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format, Invalid compress')
  async exportVmSnapshot(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: 'xva' | 'ova',
    @Query() compress?: boolean
  ): Promise<Readable> {
    const stream = await this.#vmService.export(id as XoVmSnapshot['id'], 'VM-snapshot', {
      compress,
      format,
      response: req.res,
    })
    process.on('SIGTERM', () => req.destroy())
    req.on('close', () => stream.destroy())

    return stream
  }

  /**
   * Required privilege:
   * - resource: vm-snapshot, action: read
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   */
  @Example(vmSnapshot)
  @Get('{id}')
  @Middlewares(acl({ resource: 'vm-snapshot', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshot(@Path() id: string): Unbrand<XoVmSnapshot> {
    return this.getObject(id as XoVmSnapshot['id'])
  }

  /**
   * Required privilege:
   * - resource: vm-snapshot, action: delete
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   */
  @Delete('{id}')
  @Middlewares(acl({ resource: 'vm-snapshot', action: 'delete', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  async deleteVmSnapshot(@Path() id: string): Promise<void> {
    const xapiVmSnapshot = this.getXapiObject(id as XoVmSnapshot['id'])
    await xapiVmSnapshot.$xapi.VM_destroy(xapiVmSnapshot.$ref)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshotAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const vmSnapshot = this.getObject(id as XoVmSnapshot['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${vmSnapshot.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Returns all VDIs that match the following privilege:
   * - resource: vdi, action: read
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "VDI_type,id,name_label"
   * @example filter "VDI_type:user"
   * @example limit 42
   */
  @Example(vmSnapshotVdis)
  @Get('{id}/vdis')
  @Tags('vdis')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshotVdis(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdiSnapshot>>> {
    const vdis = this.#vmService.getVmVdis(id as XoVmSnapshot['id'], 'VM-snapshot')
    return this.sendObjects(limitAndFilterArray(vdis, { filter }), req, {
      path: obj => obj.type.toLowerCase() + 's',
      limit,
      privilege: { action: 'read', resource: 'vdi' },
    })
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmSnapshotsMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVmSnapshot['id'], { filter })

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
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example fields "id,status,properties"
   * @example filter "status:failure"
   * @example limit 42
   */
  @Example(taskIds)
  @Example(partialTasks)
  @Get('{id}/tasks')
  @Tags('tasks')
  @Response(notFoundResp.status, notFoundResp.description)
  async getVmSnapshotTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoVmSnapshot['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: vm-snapshot, action: update:tags
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'vm-snapshot', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putVmSnapshotTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vmSnapshot = this.getXapiObject(id as XoVmSnapshot['id'])
    await vmSnapshot.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: vm-snapshot, action: update:tags
   *
   * @example id "d68fca2c-41e6-be87-d790-105c1642a090"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'vm-snapshot', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmSnapshotTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vmSnapshot = this.getXapiObject(id as XoVmSnapshot['id'])
    await vmSnapshot.$call('remove_tags', tag)
  }
}
