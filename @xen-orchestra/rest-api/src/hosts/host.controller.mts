import {
  Body,
  Delete,
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
import { HOST_POWER_STATE } from '@vates/types'
import { asyncEach } from '@vates/async-each'
import { type Defer, defer } from 'golike-defer'
import { json } from 'express'
import type { Request as ExRequest, Response as ExResponse } from 'express'
import { inject } from 'inversify'
import { incorrectState, invalidParameters } from 'xo-common/api-errors.js'
import { pipeline } from 'node:stream/promises'
import { provide } from 'inversify-binding-decorators'
import type {
  XapiHostStats,
  XapiStatsGranularity,
  XcpPatches,
  XoAlarm,
  XoHost,
  XoMessage,
  XoPif,
  XoPool,
  XoTask,
  XoVm,
  XsPatches,
} from '@vates/types'

import { acl } from '../middlewares/acl.middleware.mjs'
import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
import {
  nfsExport,
  srUuids,
  hbaExport,
  iscsiIqnExport,
  iscsiLunExport,
} from '../open-api/oa-examples/sr.oa-example.mjs'
import {
  host,
  hostIds,
  hostSmt,
  hostMissingPatches,
  hostStats,
  partialHosts,
} from '../open-api/oa-examples/host.oa-example.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'
import type { SendObjects } from '../helpers/helper.type.mjs'
import { XapiXoController } from '../abstract-classes/xapi-xo-controller.mjs'
import {
  asynchronousActionResp,
  badRequestResp,
  featureUnauthorized,
  forbiddenOperationResp,
  internalServerErrorResp,
  invalidParameters as invalidParametersResp,
  incorrectStateResp,
  noContentResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import type { CreateActionReturnType } from '../abstract-classes/base-controller.mjs'
import { HostService } from './host.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'
import { partialTasks, taskIds, taskLocation } from '../open-api/oa-examples/task.oa-example.mjs'
import type { SupportedActions } from '@xen-orchestra/acl'
import { XoSrHbaExport, XoSrIscsiIqnsExport, XoSrIscsiLunsExport, XoSrNfsExport, XoSrsExport } from './host.type.mjs'

@Route('hosts')
@Security('*')
@Response(badRequestResp.status, badRequestResp.description)
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('hosts')
@provide(HostController)
export class HostController extends XapiXoController<XoHost> {
  #alarmService: AlarmService
  #hostService: HostService

  constructor(
    @inject(RestApi) restApi: RestApi,
    @inject(AlarmService) alarmService: AlarmService,
    @inject(HostService) hostService: HostService
  ) {
    super('host', restApi)
    this.#alarmService = alarmService
    this.#hostService = hostService
  }

  /**
   * Returns all hosts that match the following privilege:
   * - resource: host, action: read
   *
   * @example fields "id,name_label,productBrand"
   * @example filter "productBrand:XCP-ng"
   * @example limit 42
   */
  @Example(hostIds)
  @Example(partialHosts)
  @Extension('x-mcp-exposure', 'allow')
  @Get('')
  @Security('*', ['acl'])
  getHosts(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoHost>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter })), req, {
      limit,
      privilege: { action: 'read', resource: 'host' },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: read
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(host)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  getHost(@Path() id: string): Unbrand<XoHost> {
    return this.getObject(id as XoHost['id'])
  }

  /**
   * Required privilege:
   * - resource: host, action: read
   *
   * Host must be running
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostStats)
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/stats')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid granularity')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getHostStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiHostStats> {
    return this.restApi.xoApp.getXapiHostStats(id as XoHost['id'], granularity)
  }

  /**
   * Required privilege:
   * - resource: host, action: export:logs
   *
   * Host must be running
   *
   * Download the audit log of a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   *
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/audit.txt')
  @Middlewares(acl({ resource: 'host', action: 'export:logs', objectId: 'params.id' }))
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async getAuditLog(@Request() req: ExRequest, @Path() id: string) {
    const xapiHost = this.getXapiObject(id as XoHost['id'])
    const res = req.res as ExResponse

    const response = await xapiHost.$xapi.getResource('/audit_log', { host: xapiHost })

    const date = new Date().toISOString()
    const headers = new Headers({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${host.name_label}-${date}-audit.txt"`,
    })
    res.setHeaders(headers)

    await pipeline(response.body, this.maybeCompressResponse(req, res))
  }

  /**
   * Required privilege:
   * - resource: host, action: export:logs
   *
   * Host must be running
   *
   * Download all logs of a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   *
   */
  @Extension('x-mcp-exposure', 'deny')
  @Get('{id}/logs.tgz')
  @Middlewares(acl({ resource: 'host', action: 'export:logs', objectId: 'params.id' }))
  @SuccessResponse(200, 'Download started', 'application/gzip')
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async getHostLogs(@Request() req: ExRequest, @Path() id: string) {
    const xapiHost = this.getXapiObject(id as XoHost['id'])
    const res = req.res as ExResponse

    const response = await xapiHost.$xapi.getResource('/host_logs_download', { host: xapiHost })

    res.setHeader('Content-Type', 'application/gzip')

    await pipeline(response.body, res)
  }

  /**
   * Returns all alarms that match the following privilege:
   * - resource: alarm, action: read
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
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
  getHostAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const host = this.getObject(id as XoHost['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${host.uuid}`,
    })

    return this.sendObjects(Object.values(alarms), req, {
      path: 'alarms',
      limit,
      privilege: { action: 'read', resource: 'alarm' },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: read
   *
   * Returns a boolean indicating whether SMT (Simultaneous Multi-Threading) is enabled
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostSmt)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/smt')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async gethostSmt(@Path() id: string): Promise<{ enabled: boolean }> {
    const hostId = id as XoHost['id']

    const xapiHost = this.getXapiObject(hostId)
    const enabled = Boolean(await xapiHost.$xapi.isHyperThreadingEnabled(hostId))

    return { enabled }
  }

  /**
   * Required privilege:
   * - resource: host, action: read
   *
   * Host must be running
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostMissingPatches)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/missing_patches')
  @Middlewares(acl({ resource: 'host', action: 'read', objectId: 'params.id' }))
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  async getMissingPatches(@Path() id: string): Promise<XcpPatches[] | XsPatches[]> {
    const { missingPatches } = await this.#hostService.getMissingPatchesInfo({ filter: host => host.id === id })
    return missingPatches
  }

  /**
   * Returns all messages that match the following privilege:
   * - resource: message, action: read
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example fields "name,id,$object"
   * @example filter "name:PBD_PLUG_FAILED_ON_SERVER_START"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Extension('x-mcp-exposure', 'allow')
  @Get('{id}/messages')
  @Security('*', ['acl'])
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getHostMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoHost['id'], { filter })

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
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
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
  async getHostTasks(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() markdown?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoTask>>> {
    const tasks = await this.getTasksForObject(id as XoHost['id'], { filter })

    return this.sendObjects(Object.values(tasks), req, {
      path: 'tasks',
      limit,
      privilege: { action: 'read', resource: 'task' },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: update:tags
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Put('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'host', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async putHostTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const host = this.getXapiObject(id as XoHost['id'])
    await host.$call('add_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: host, action: update:tags
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example tag "from-rest-api"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Delete('{id}/tags/{tag}')
  @Middlewares(acl({ resource: 'host', action: 'update:tags', objectId: 'params.id' }))
  @SuccessResponse(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async deleteHostTag(@Path() id: string, @Path() tag: string): Promise<void> {
    const host = this.getXapiObject(id as XoHost['id'])
    await host.$call('remove_tags', tag)
  }

  /**
   * Required privilege:
   * - resource: pif, action: update:management
   *
   * Reconfigure the management interface of the host to use the given PIF.
   *
   * The target PIF must already have an IP address configured.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body { "pif": "d9e42451-3794-089f-de81-4ee0e6137bee" }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/management_reconfigure')
  @Middlewares([json(), acl({ resource: 'pif', action: 'update:management', objectId: 'body.pif' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  managementReconfigure(
    @Path() id: string,
    @Body() body: { pif: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      const host = this.getObject(hostId)
      const pif = this.restApi.getObject<XoPif>(body.pif as XoPif['id'], 'PIF')
      if (pif.$host !== host.id) {
        throw invalidParameters(`the PIF ${pif.uuid} does not belong to host ${host.uuid}`)
      }
      const xapiHost = this.getXapiObject(hostId)
      await xapiHost.$xapi.callAsync('host.management_reconfigure', pif._xapiRef)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'reconfigure host management interface',
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privileges:
   * - resource: host, action: disable
   * - resource: host, action: evacuate (if `evacuate: true`)
   *
   * Disable a host.
   *
   * Set `evacuate` to `true` to also evacuate all running VMs to other hosts in the pool.
   *
   * Use `vmIdsToForceMigrate` to unblock VMs whose migration is currently blocked (e.g. by `pool_migrate` or `migrate_send` blocked operations).
   *
   * Use `force` to ignore evacuation errors.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body { "evacuate": true, "vmIdsToForceMigrate": ["f07ab729-c0e8-721c-45ec-f11276377030"] }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/disable')
  @Middlewares([
    json(),
    acl({
      resource: 'host',
      actions: ({ req }) => {
        const actions: SupportedActions<'host'>[] = ['disable']
        if (req.body?.evacuate) {
          actions.push('evacuate')
        }
        return actions
      },
      objectId: 'params.id',
    }),
  ])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(invalidParametersResp.status, invalidParametersResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  disable(
    @Path() id: string,
    // mark `evacuate` as optional to workaround a TSOA issue. See https://github.com/lukeautry/tsoa/pull/1840
    @Body() body?: { evacuate?: false } | { evacuate: true; force?: boolean; vmIdsToForceMigrate?: string[] },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = defer(async ($defer: Defer) => {
      const xapiHost = this.getXapiObject(hostId)
      const xapi = xapiHost.$xapi

      if (body?.evacuate !== true) {
        await xapi.call('host.disable', xapiHost.$ref)
        return
      }

      if (body.vmIdsToForceMigrate !== undefined) {
        await asyncEach(body.vmIdsToForceMigrate, async vmId => {
          const xoVm = this.restApi.getObject<XoVm>(vmId as XoVm['id'], 'VM')
          for (const operation of ['pool_migrate', 'migrate_send'] as const) {
            const reason = xoVm.blockedOperations[operation]
            if (reason !== undefined) {
              await xapi.call('VM.remove_from_blocked_operations', xoVm._xapiRef, operation)
              $defer(() => xapi.call('VM.add_to_blocked_operations', xoVm._xapiRef, operation, reason))
            }
          }
        })
      }

      await xapi.clearHost(xapiHost, body.force)
    })

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: body?.evacuate === true ? 'disable and evacuate host' : 'disable host',
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: enable
   *
   * Enable a host, taking it out of disabled state.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/enable')
  @Middlewares(acl({ resource: 'host', action: 'enable', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  enable(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.getXapiObject(hostId).$xapi.enableHost(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'enable host',
        objectId: hostId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: start
   *
   * Start a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/start')
  @Middlewares(acl({ resource: 'host', action: 'start', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  startHost(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.getXapiObject(hostId).$xapi.powerOnHost(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'start host',
        objectId: hostId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: shutdown:clean
   *
   * Shutdown a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body { "bypassBackupCheck": false, "bypassEvacuate": false }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/clean_shutdown')
  @Middlewares([json(), acl({ resource: 'host', action: 'shutdown:clean', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  cleanShutdownHost(
    @Path() id: string,
    @Body()
    body?: {
      /** Skip the backup safety check before shutting down. Defaults to false. */
      bypassBackupCheck?: boolean
      /** Shut down without evacuating running VMs first. Defaults to false. */
      bypassEvacuate?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.#hostService.cleanShutdownHost(hostId, body)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'clean shutdown host',
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: reboot:clean
   *
   * Reboot a host by evacuating its VMs to other hosts first.
   *
   * Checks for active backup jobs and version compatibility before rebooting.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body {
   *  "force": false,
   *  "bypassBackupCheck": false,
   *  "bypassVersionCheck": false
   * }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/clean_reboot')
  @Middlewares([json(), acl({ resource: 'host', action: 'reboot:clean', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  cleanRebootHost(
    @Path() id: string,
    @Body()
    body?: {
      /** Force the reboot, ignoring evacuation errors. Defaults to false. */
      force?: boolean
      /** Skip the backup safety check before rebooting. Defaults to false. */
      bypassBackupCheck?: boolean
      /** Skip the version/upgrade compatibility check before rebooting. Defaults to false. */
      bypassVersionCheck?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const force = body?.force ?? false
    const opts = {
      force,
      bypassBackupCheck: body?.bypassBackupCheck ?? force,
      bypassVersionCheck: body?.bypassVersionCheck ?? force,
    }

    const hostId = id as XoHost['id']
    const action = async () => {
      await this.#hostService.cleanRebootHost(hostId, opts)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'clean reboot host',
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: reboot:smart
   *
   * Reboot a host by suspending its VMs in place.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example body {
   *  "bypassBackupCheck": false,
   *  "bypassVersionCheck": false,
   *  "bypassBlockedSuspend": false,
   *  "bypassCurrentVmCheck": false
   * }
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/smart_reboot')
  @Middlewares([json(), acl({ resource: 'host', action: 'reboot:smart', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  smartRebootHost(
    @Path() id: string,
    @Body()
    body?: {
      /** Skip the backup safety check before rebooting. Defaults to false. */
      bypassBackupCheck?: boolean
      /** Skip the version/upgrade compatibility check before rebooting. Defaults to false. */
      bypassVersionCheck?: boolean
      /** Allow suspending VMs even if suspend is blocked. Defaults to false. */
      bypassBlockedSuspend?: boolean
      /** Skip the check that blocks smart reboot when XOA is running on this host. Defaults to false. */
      bypassCurrentVmCheck?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const opts = {
      bypassBackupCheck: body?.bypassBackupCheck ?? false,
      bypassVersionCheck: body?.bypassVersionCheck ?? false,
      bypassBlockedSuspend: body?.bypassBlockedSuspend ?? false,
      bypassCurrentVmCheck: body?.bypassCurrentVmCheck ?? false,
    }

    const hostId = id as XoHost['id']
    const action = async () => {
      await this.#hostService.smartRebootHost(hostId, opts)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'smart reboot host',
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: restart-toolstack
   *
   * Restart a host's toolstack.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/restart_toolstack')
  @Middlewares([json(), acl({ resource: 'host', action: 'restart-toolstack', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  restartHostToolstack(
    @Path() id: string,
    @Body()
    body?: {
      /** Skip the backup safety check before restarting the toolstack. Defaults to false. */
      bypassBackupCheck?: boolean
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.#hostService.restartToolstack(hostId, body)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: "restart host's toolstack",
        objectId: hostId,
        params: body,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: shutdown:emergency
   *
   * Shut down a host by disabling it, suspending its VMs in place, and powering off without migrating them.
   *
   * Unlike `clean_shutdown`, VMs are not evacuated to other hosts, they are suspended
   * on the same host (errors are ignored) before the host shuts down.
   * No backup check is performed.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/emergency_shutdown')
  @Middlewares(acl({ resource: 'host', action: 'shutdown:emergency', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  emergencyShutdownHost(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.getXapiObject(hostId).$xapi.emergencyShutdownHost(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'emergency shutdown host',
        objectId: hostId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: detach
   *
   * Detaches a host from its pool.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/detach')
  @Middlewares(acl({ resource: 'host', action: 'detach', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  detachHost(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      await this.restApi.xoApp.detachHostFromPool(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'detach host',
        objectId: hostId,
      },
    })
  }

  /**
   * Required privilege:
   * - resource: host, action: forget
   *
   * Forgets a host, host must not be running.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(taskLocation)
  @Extension('x-mcp-exposure', 'deny')
  @Post('{id}/actions/forget')
  @Middlewares(acl({ resource: 'host', action: 'forget', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(noContentResp.status, noContentResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(incorrectStateResp.status, incorrectStateResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  forgetHost(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<void> {
    const hostId = id as XoHost['id']
    const action = async () => {
      const host = this.getObject(hostId)
      if (host.power_state === HOST_POWER_STATE.RUNNING) {
        throw incorrectState({
          actual: host.power_state,
          expected: HOST_POWER_STATE.HALTED,
          object: host.id,
          property: 'power_state',
        })
      }
      await this.getXapiObject(hostId).$xapi.forgetHost(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: noContentResp.status,
      taskProperties: {
        name: 'forget host',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects all NFS shares (exports) on a NFS server and returns a table of exports with their paths and ACLs
   *
   * Required privilege:
   * - resource: host, action: probe:nfs
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example server "192.168.1.1"
   * @example nfsVersion "4"
   */
  @Example(nfsExport)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_nfs')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:nfs', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeNfs(
    @Path() id: string,
    @Body()
    request: {
      server: string
      nfsVersion?: string
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrNfsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeNfs(hostId, request.server, request.nfsVersion)
    }

    return this.createAction<XoSrNfsExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe nfs',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects all ZFS pools and returns a dict of pools with their parameters { <poolname>: {<paramdict>}}
   *
   * Required privilege:
   * - resource: host, action: probe:zfs
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_zfs')
  @Middlewares(acl({ resource: 'host', action: 'probe:zfs', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeZfs(@Path() id: string, @Query() sync?: boolean) {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeZfs(hostId)
    }

    return this.createAction<void>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe zfs',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects all HBA devices on the host
   *
   * Required privilege:
   * - resource: host, action: probe:hba
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   */
  @Example(hbaExport)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_hba')
  @Middlewares(acl({ resource: 'host', action: 'probe:hba', objectId: 'params.id' }))
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeHba(@Path() id: string, @Query() sync?: boolean): CreateActionReturnType<XoSrHbaExport[]> {
    const hostId = id as XoHost['id']

    const action = () => {
      return this.#hostService.probeHba(hostId)
    }

    return this.createAction<XoSrHbaExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe hba',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects all iSCSI IQN on a Target (iSCSI "server")
   * returns a table of IQN or empty table if no iSCSI connection to the target
   *
   * Required privilege:
   * - resource: host, action: probe:iscsiiqn
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   */
  @Example(iscsiIqnExport)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_iscsi_iqns')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:iscsiiqn', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiIqns(
    @Path() id: string,
    @Body()
    request: {
      targetIp: string
      port?: number
      chapUser?: string
      chapPassword?: string
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrIscsiIqnsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeIscsiIqns(
        hostId,
        request.targetIp,
        request.port,
        request.chapUser,
        request.chapPassword
      )
    }

    return this.createAction<XoSrIscsiIqnsExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe iscsiiqn',
        objectId: id as XoHost['id'],
      },
    })
  }

  /**
   * Detects all iSCSI ID and LUNs on a Target and return a LUN table
   *
   * Required privilege:
   * - resource: host, action: probe:iscsilun
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   * @example targetIqn ""
   */
  @Example(iscsiLunExport)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_iscsi_luns')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:iscsilun', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiLuns(
    @Path() id: string,
    @Body()
    request: {
      targetIp: string
      targetIqn: string
      port?: number
      chapUser?: string
      chapPassword?: string
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrIscsiLunsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeIscsiLuns(
        hostId,
        request.targetIp,
        request.targetIqn,
        request.port,
        request.chapUser,
        request.chapPassword
      )
    }

    return this.createAction<XoSrIscsiLunsExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe iscsilun',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects if this target already exists in XAPI
   * returns a table of SR UUID, empty if no existing connections
   *
   * Required privilege:
   * - resource: host, action: probe:iscsi-exists
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example targetIp ""
   * @example targetIqn ""
   */
  @Example(srUuids)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_iscsi_exists')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:iscsi-exists', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeIscsiExists(
    @Path() id: string,
    @Body()
    request: {
      targetIp: string
      targetIqn: string
      scsiId: string
      port?: number
      chapUser?: string
      chapPassword?: string
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeIscsiExists(
        hostId,
        request.targetIp,
        request.targetIqn,
        request.scsiId,
        request.port,
        request.chapUser,
        request.chapPassword
      )
    }

    return this.createAction<XoSrsExport[]>(action, {
      sync,
      statusCode: asynchronousActionResp.status,
      taskProperties: {
        name: 'probe iscsi-exists',
        objectId: hostId,
      },
    })
  }

  /**
   * Detect if this HBA already exists in XAPI
   * returns a table of SR UUID, empty if no existing connections
   *
   * Required privilege:
   * - resource: host, action: probe:hba-exists
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example scsiId ""
   */
  @Example(srUuids)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_hba_exists')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:hba-exists', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  async probeHbaExists(
    @Path() id: string,
    @Body() request: { scsiId: string },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeHbaExists(hostId, request.scsiId)
    }

    return this.createAction<XoSrsExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe hba-exists',
        objectId: hostId,
      },
    })
  }

  /**
   * Detects if this NFS SR already exists in XAPI
   * returns a table of SR UUID, empty if no existing connections
   *
   * Required privilege:
   * - resource: host, action: probe:nfs-exists
   *
   * @example id "c4284e12-37c9-7967-b9e8-83ef229c3e03"
   * @example scsiId ""
   */
  @Example(srUuids)
  @Extension('x-mcp-exposure', 'confirm')
  @Post('{id}/actions/probe_nfs_exists')
  @Middlewares([json(), acl({ resource: 'host', action: 'probe:nfs-exists', objectId: 'params.id' })])
  @SuccessResponse(asynchronousActionResp.status, asynchronousActionResp.description)
  @Response(forbiddenOperationResp.status, forbiddenOperationResp.description)
  @Response(notFoundResp.status, notFoundResp.description)
  probeNfsExists(
    @Path() id: string,
    @Body()
    request: {
      server: string
      serverPath: string
      nfsVersion?: string
    },
    @Query() sync?: boolean
  ): CreateActionReturnType<XoSrsExport[]> {
    const hostId = id as XoHost['id']
    const action = () => {
      return this.#hostService.probeNfsExists(hostId, request.server, request.serverPath, request.nfsVersion)
    }

    return this.createAction<XoSrsExport[]>(action, {
      sync,
      statusCode: 200,
      taskProperties: {
        name: 'probe nfs-exists',
        objectId: hostId,
      },
    })
  }
}
