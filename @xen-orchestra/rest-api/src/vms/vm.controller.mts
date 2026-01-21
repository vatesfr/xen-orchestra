import {
  Example,
  Get,
  Path,
  Post,
  Query,
  Request,
  Response,
  Route,
  Security,
  Tags,
  SuccessResponse,
  Body,
  Put,
  Delete,
  Middlewares,
} from 'tsoa'
import { Request as ExRequest, json } from 'express'
import { inject } from 'inversify'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { provide } from 'inversify-binding-decorators'
import type {
  XapiStatsGranularity,
  XapiVmStats,
  XenApiVm,
  XoAlarm,
  XoVmBackupJob,
  XoHost,
  XoTask,
  XoVdi,
  XoVm,
  XoVmSnapshot,
  XoMessage,
  XoSr,
  XoNetwork,
  XoVif,
  XoPif,
} from '@vates/types'
import { PassThrough, Readable } from 'node:stream'

import {
  asynchronousActionResp,
  badRequestResp,
  createdResp,
  forbiddenOperationResp,
  incorrectStateResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { BASE_URL } from '../index.mjs'
import { limitAndFilterArray, NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import { partialVms, vm, vmDashboard, vmIds, vmStatsExample, vmVdis } from '../open-api/oa-examples/vm.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import { partialTasks, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { AuthenticatedRequest, SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import { VmService } from './vm.service.mjs'
import { BackupJobService } from '../backup-jobs/backup-job.service.mjs'
import type { UnbrandXoVmBackupJob } from '../backup-jobs/backup-job.type.mjs'
import { partialVmBackupJobs, vmBackupJobIds } from '../open-api/oa-examples/backup-job.oa-example.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import type { UnbrandedVmDashboard } from './vm.type.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'

const IGNORED_VDIS_TAG = '[NOSNAP]'

@Route('vms')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('vms')
// the `provide` decorator is mandatory on class that injects/receives dependencies.
// It automatically bind the class to the IOC container that handles dependency injection
@provide(VmController)
export class VmController extends XapiXoController<XoVm> {
  #vmService: VmService
  #backupJobService: BackupJobService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(VmService) vmService: VmService,
    @inject(BackupJobService) backupJobService: BackupJobService
  ) {
    super('VM', restApi)
    this.#vmService = vmService
    this.#backupJobService = backupJobService
  }

  /**
   *
   * @example fields "name_label,power_state,uuid"
   * @example filter "power_state:Running"
   * @example limit 42
   */
  @Example(vmIds)
  @Example(partialVms)
  @Get('')
  getVms(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVm>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   *
   * Export VM. Compress is only used for XVA format
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Get('{id}.{format}')
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid format, Invalid compress')
  async exportVm(
    @Request() req: ExRequest,
    @Path() id: string,
    @Path() format: 'xva' | 'ova',
    @Query() compress?: boolean
  ): Promise<Readable> {
    const stream = await this.#vmService.export(id as XoVm['id'], 'VM', { compress, format, response: req.res })
    process.on('SIGTERM', () => req.destroy())
    req.on('close', () => stream.destroy())

    return stream
  }

  /**
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vm)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getVm(@Path() id: string): Unbrand<XoVm> {
    return this.getObject(id as XoVm['id'])
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Delete('{id}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  async deleteVm(@Path() id: string): Promise<void> {
    const xapiVm = this.getXapiObject(id as XoVm['id'])
    await xapiVm.$xapi.VM_destroy(xapiVm.$ref)
  }

  /**
   *
   *  VM must be running
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(vmStatsExample)
  @Get('{id}/stats')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid granularity, VM is halted or host could not be found')
  async getVmStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiVmStats> {
    try {
      return await this.restApi.xoApp.getXapiVmStats(id as XoVm['id'], granularity)
    } catch (error) {
      if (
        incorrectState.is(error, {
          property: 'resident_on',
        })
      ) {
        throw invalidParameters(`VM ${id} is halted or host could not be found.`, error)
      }
      throw error
    }
  }

  /**
   * The VM must be running
   *
   * List of possible data_source (Based on [Xenserver doc](https://docs.xenserver.com/en-us/xenserver/8/monitor-performance#available-vm-metrics))
   * - **cpu#** : Utilization of vCPU cpu (fraction). Enabled by default. *Condition*: vCPU cpu exists.
   * - **cpu_usage** : Domain CPU usage. *Condition*: None.
   * - **memory** : Memory currently allocated to VM (Bytes). Enabled by default. *Condition*: None.
   * - **memory_target** : Target of VM balloon driver (Bytes). Enabled by default. *Condition*: None.
   * - **memory_internal_free** : Memory used as reported by the guest agent (KiB). Enabled by default. *Condition*: None.
   * - **runstate_fullrun** : Fraction of time that all vCPUs are running. *Condition*: None.
   * - **runstate_full_contention** : Fraction of time that all vCPUs are runnable (waiting for CPU). *Condition*: None.
   * - **runstate_concurrency_hazard** : Fraction of time that some vCPUs are running and some are runnable. *Condition*: None.
   * - **runstate_blocked** : Fraction of time that all vCPUs are blocked or offline. *Condition*: None.
   * - **runstate_partial_run** : Fraction of time that some vCPUs are running, and some are blocked. *Condition*: None.
   * - **runstate_partial_contention** : Fraction of time that some vCPUs are runnable and some are blocked. *Condition*: None.
   * - **vbd_#_write** : Writes to device vbd in bytes per second. Enabled by default. *Condition*: VBD vbd exists.
   * - **vbd_#_read** : Reads from device vbd in bytes per second. Enabled by default. *Condition*: VBD vbd exists.
   * - **vbd_#_write_latency** : Writes to device vbd in microseconds. *Condition*: VBD vbd exists.
   * - **vbd_#_read_latency** : Reads from device vbd in microseconds. *Condition*: VBD vbd exists.
   * - **vbd_#_iops_read** : Read requests per second. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vbd_#_iops_write** : Write requests per second. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vbd_#_iops_total** : I/O requests per second. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vbd_#_iowait** : Percentage of time waiting for I/O. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vbd_#_inflight** : Number of I/O requests currently in flight. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vbd_#_avgqu_sz** : Average I/O queue size. *Condition*: At least one plugged VBD for non-ISO VDI on the host.
   * - **vif_#_rx** : Bytes per second received on virtual interface number vif. Enabled by default. *Condition*: VIF vif exists.
   * - **vif_#_tx** : Bytes per second transmitted on virtual interface vif. Enabled by default. *Condition*: VIF vif exists.
   * - **vif_#_rx_errors** : Receive errors per second on virtual interface vif. Enabled by default. *Condition*: VIF vif exists.
   * - **vif_#_tx_errors** : Transmit errors per second on virtual interface vif. Enabled by default. *Condition*: VIF vif exists.
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example dataSource "cpu0"
   */
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Put('{id}/stats/data_source/{data_source}')
  async addDataSource(@Path() id: string, @Path('data_source') dataSource: string) {
    await this.getXapiObject(id as XoVm['id']).$call('record_data_source', dataSource)
  }

  /**
   * The VM must be running
   *
   * For a list of possible data sources, see the endpoint documentation: `GET {id}/stats/data_source/{data_source}`
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example dataSource "cpu0"
   */
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  @Delete('{id}/stats/data_source/{data_source}')
  async deleteDataSource(@Path() id: string, @Path('data_source') dataSource: string) {
    await this.getXapiObject(id as XoVm['id']).$call('forget_data_source_archives', dataSource)
  }

  /**
   * The VM must be halted
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "hostId": "b61a5c92-700e-4966-a13b-00633f03eea8" }
   */
  @Example(taskLocation)
  @Post('{id}/actions/start')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async startVm(
    @Path() id: string,
    @Body() body?: { hostId?: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapi(vmId).startVm(vmId, { startOnly: true, hostId: body?.hostId as XoHost['id'] })
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        args: body,
        name: 'start VM',
        objectId: vmId,
      },
    })
  }

  /**
   * Requires guest tools to be installed
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/clean_shutdown')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async cleanShutdownVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('clean_shutdown')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'clean shutdown VM',
        objectId: vmId,
      },
    })
  }

  /**
   * Requires guest tools to be installed
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/clean_reboot')
  async cleanRebootVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('clean_reboot')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'clean reboot VM',
        objectId: vmId,
      },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/hard_shutdown')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async hardShutdownVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('hard_shutdown')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'hard shutdown VM',
        objectId: vmId,
      },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/hard_reboot')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async hardRebootVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('hard_reboot')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'hard reboot VM',
        objectId: vmId,
      },
    })
  }

  /**
   * The VM must be running
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/pause')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async pauseVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('pause')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'pause VM',
        objectId: vmId,
      },
    })
  }

  /**
   * The VM must be running
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/suspend')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async suspendVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapiObject(vmId).$callAsync('suspend')
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'suspend VM',
        objectId: vmId,
      },
    })
  }

  /**
   * The VM must be suspended
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/resume')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async resumeVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapi(vmId).resumeVm(vmId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'resume VM',
        objectId: vmId,
      },
    })
  }

  /**
   * The VM must be paused
   *
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   */
  @Example(taskLocation)
  @Post('{id}/actions/unpause')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async unpauseVm(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']
    const action = async () => {
      await this.getXapi(vmId).unpauseVm(vmId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'unpause VM',
        objectId: vmId,
      },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example body { "name_label": "my_awesome_snapshot" }
   */
  @Example(taskLocation)
  @Post('{id}/actions/snapshot')
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(createdResp.status, 'Snapshot created')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async snapshotVm(
    @Path() id: string,
    @Body() body?: { name_label?: XoVmSnapshot['name_label'] },
    @Query() sync?: boolean
  ): CreateActionReturnType<{ id: XenApiVm['uuid'] }> {
    const vmId = id as XoVm['id']
    const action = async () => {
      const xapiVm = this.getXapiObject(vmId)
      const ref = await xapiVm.$snapshot({ ignoredVdisTag: IGNORED_VDIS_TAG, name_label: body?.name_label })
      const snapshotId = await xapiVm.$xapi.getField<XenApiVm, 'uuid'>('VM', ref, 'uuid')

      if (sync) {
        this.setHeader('Location', `${BASE_URL}/vm-snapshots/${snapshotId}`)
      }

      return { id: snapshotId }
    }

    return this.createAction<{ id: XenApiVm['uuid'] }>(action, {
      sync,
      statusCode: createdResp.status,
      taskProperties: {
        name: 'snapshot VM',
        objectId: vmId,
      },
    })
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const alarms = this.#vmService.getVmAlarms(id as XoVm['id'], { filter, limit })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "VDI_type,id,name_label"
   * @example filter "VDI_type:user"
   * @example limit 42
   */
  @Example(vmVdis)
  @Get('{id}/vdis')
  @Tags('vdis')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmVdis(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoVdi>>> {
    const vdis = this.#vmService.getVmVdis(id as XoVm['id'], 'VM')
    return this.sendObjects(limitAndFilterArray(vdis, { filter, limit }), req, obj => obj.type.toLowerCase() + 's')
  }

  /**
   * @example id "f07ab729-c0e8-721c-45ec-f11276377030"
   * @example fields "mode,name,type,id"
   * @example filter "mode:full"
   * @example limit 42
   */
  @Example(vmBackupJobIds)
  @Example(partialVmBackupJobs)
  @Get('{id}/backup-jobs')
  @Tags('backup-jobs')
  @Response(notFoundResp.status, notFoundResp.description)
  async vmGetVmBackupJobs(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<UnbrandXoVmBackupJob>>> {
    const backupJobs = await this.restApi.xoApp.getAllJobs('backup')

    const vmBackupJobs: XoVmBackupJob[] = []
    for (const backupJob of backupJobs) {
      if (await this.#backupJobService.isVmInBackupJob(backupJob.id, id as XoVm['id'])) {
        vmBackupJobs.push(backupJob)
      }
    }

    return this.sendObjects(limitAndFilterArray(vmBackupJobs, { filter, limit }), req, '/backup-jobs')
  }

  /**
   * @example id "cef5f68c-61ae-3831-d2e6-1590d4934acf"
   * @example fields "name,id,$object"
   * @example filter "name:VM_STARTED"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getVmMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoVm['id'], { filter, limit })

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
  async getVmTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): Promise<SendObjects<Partial<Unbrand<XoTask>>>> {
    const tasks = await this.getTasksForObject(id as XoVm['id'], { filter, limit })

    return this.sendObjects(Object.values(tasks), req, 'tasks')
  }

  /**
   * @example id "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * @example tag "from-rest-api"
   */
  @Put('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putVmTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vm = this.getXapiObject(id as XoVm['id'])
    await vm.$call('add_tags', tag)
  }

  /**
   * @example id "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * @example tag "from-rest-api"
   */
  @Delete('{id}/tags/{tag}')
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteVmTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const vm = this.getXapiObject(id as XoVm['id'])
    await vm.$call('remove_tags', tag)
  }

  /**
   * @example id "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   */
  @Example(vmDashboard)
  @Get('{id}/dashboard')
  async getVmDashboard(
    @Request() req: AuthenticatedRequest,
    @Path() id: string,
    @Query() ndjson?: boolean
  ): Promise<UnbrandedVmDashboard | undefined> {
    const vm = this.getObject(id as XoVm['id'])

    const stream = ndjson ? new PassThrough() : undefined
    const isStream = stream !== undefined

    if (isStream) {
      const res = req.res
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)
      stream.pipe(res)
    }

    try {
      const dashboard = await this.#vmService.getVmDashboard(vm.id, { stream })

      if (!isStream) {
        return dashboard
      }
    } finally {
      stream?.end()
    }
  }

  /**
   * VIF mapping is not allowed for intra-pool migration
   *
   * Networks and SRs must belong to the same pool as the destination host
   *
   * @example id "613f541c-4bed-fc77-7ca8-2db6b68f079c"
   * @example body { "hostId": "b61a5c92-700e-4966-a13b-00633f03eea8" }
   */
  @Example(taskLocation)
  @Post('{id}/actions/migrate')
  @Middlewares(json())
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  migrateVm(
    @Path() id: string,
    @Body()
    body:
      | { hostId: string; migrationNetworkId?: string }
      | {
          hostId: string
          migrationNetworkId?: string
          srId?: string
          vdiIdBySrId?: { [key: string]: string }
          vifIdByNetworkId?: { [key: string]: string }
        },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const vmId = id as XoVm['id']

    const action = async () => {
      const { hostId, migrationNetworkId } = body

      const vm = this.getObject(vmId)
      const targetHost = this.restApi.getObject<XoHost>(hostId as XoHost['id'], 'host')
      const migrationNetwork =
        migrationNetworkId !== undefined
          ? this.restApi.getObject<XoNetwork>(migrationNetworkId as XoNetwork['id'], 'network')
          : undefined

      const targetSr =
        'srId' in body && body.srId !== undefined
          ? this.restApi.getObject<XoSr>(body.srId as XoSr['id'], 'SR')
          : undefined

      const networkCheck = (network: XoNetwork) => {
        if (network.$pool !== targetHost.$pool) {
          throw invalidParameters(`network ${network.id} must be in the same pool than the host: ${targetHost.id}`)
        }

        let targetPif: XoPif | undefined
        network.PIFs.forEach(pifId => {
          const pif = this.restApi.getObject<XoPif>(pifId, 'PIF')
          if (pif.$host === targetHost.id) {
            targetPif = pif
          }

          return
        })

        if (targetPif === undefined) {
          throw invalidParameters(`network ${network.id} must be reachable by the host: ${targetHost.id}`)
        }

        if (!targetPif.attached) {
          throw incorrectState({
            actual: targetPif.attached,
            expected: true,
            object: targetPif,
            property: 'attached',
          })
        }
      }

      function srCheck(sr: XoSr) {
        if (sr.shared && sr.$container !== targetHost.$pool) {
          throw invalidParameters(`SR: ${sr.id} must be in the same pool than the host: ${targetHost.id}`)
        }

        if (!sr.shared && sr.$container !== targetHost.id) {
          throw invalidParameters(`SR: ${sr.id} must be reachable by the host: ${targetHost.id}`)
        }
      }

      if (migrationNetwork !== undefined) {
        networkCheck(migrationNetwork)
      }

      if (targetSr !== undefined) {
        srCheck(targetSr)
      }

      if ('vifIdByNetworkId' in body && body.vifIdByNetworkId !== undefined) {
        if (vm.$pool === targetHost.$pool) {
          throw invalidParameters('VIF mapping is not allowed for intra-pool migration')
        }

        for (const networkId of Object.values(body.vifIdByNetworkId)) {
          const network = this.restApi.getObject<XoNetwork>(networkId as XoNetwork['id'], 'network')
          networkCheck(network)
        }
      }

      if ('vdiIdBySrId' in body && body.vdiIdBySrId !== undefined) {
        for (const srId of Object.values(body.vdiIdBySrId)) {
          const sr = this.restApi.getObject<XoSr>(srId as XoSr['id'], 'SR')
          srCheck(sr)
        }
      }

      await this.getXapi(vm.id).migrateVm(vm.id, this.getXapi(targetHost.id), targetHost.id, {
        mapVdisSrs: 'vdiIdBySrId' in body ? (body.vdiIdBySrId as Record<XoVdi['id'], XoSr['id']>) : undefined,
        mapVifsNetworks:
          'vifIdByNetworkId' in body ? (body.vifIdByNetworkId as Record<XoVif['id'], XoNetwork['id']>) : undefined,
        migrationNetworkId: migrationNetwork?.id,
        sr: targetSr?.id,
      })
    }

    return this.createAction(action, {
      sync,
      statusCode: 204,
      taskProperties: { name: 'Migrate VM', objectId: vmId, params: body },
    })
  }
}
