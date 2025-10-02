import { Example, Get, Path, Query, Request, Response, Route, Security, SuccessResponse, Tags } from 'tsoa'
import type { Request as ExRequest, Response as ExResponse } from 'express'
import { inject } from 'inversify'
import { pipeline } from 'node:stream/promises'
import { provide } from 'inversify-binding-decorators'
import type {
  XapiHostStats,
  XapiStatsGranularity,
  XcpPatches,
  XoAlarm,
  XoHost,
  XoMessage,
  XsPatches,
} from '@vates/types'

import { AlarmService } from '../alarms/alarm.service.mjs'
import { escapeUnsafeComplexMatcher } from '../helpers/utils.helper.mjs'
import { genericAlarmsExample } from '../open-api/oa-examples/alarm.oa-example.mjs'
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
  featureUnauthorized,
  internalServerErrorResp,
  notFoundResp,
  unauthorizedResp,
  type Unbrand,
} from '../open-api/common/response.common.mjs'
import { HostService } from './host.service.mjs'
import { messageIds, partialMessages } from '../open-api/oa-examples/message.oa-example.mjs'

@Route('hosts')
@Security('*')
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
   * @example fields "id,name_label,productBrand"
   * @example filter "productBrand:XCP-ng"
   * @example limit 42
   */
  @Example(hostIds)
  @Example(partialHosts)
  @Get('')
  getHosts(
    @Request() req: ExRequest,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoHost>>> {
    return this.sendObjects(Object.values(this.getObjects({ filter, limit })), req)
  }

  /**
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(host)
  @Get('{id}')
  @Response(notFoundResp.status, notFoundResp.description)
  getHost(@Path() id: string): Unbrand<XoHost> {
    return this.getObject(id as XoHost['id'])
  }

  /**
   * Host must be running
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostStats)
  @Get('{id}/stats')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(422, 'Invalid granularity')
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  getHostStats(@Path() id: string, @Query() granularity?: XapiStatsGranularity): Promise<XapiHostStats> {
    return this.restApi.xoApp.getXapiHostStats(id as XoHost['id'], granularity)
  }

  /**
   * Host must be running
   *
   * Download the audit log of a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   *
   */
  @Get('{id}/audit.txt')
  @SuccessResponse(200, 'Download started', 'application/octet-stream')
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
   * Host must be running
   *
   * Download all logs of a host.
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   *
   */
  @Get('{id}/logs.tgz')
  @SuccessResponse(200, 'Download started', 'application/gzip')
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
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example fields "id,time"
   * @example filter "time:>1747053793"
   * @example limit 42
   */
  @Example(genericAlarmsExample)
  @Get('{id}/alarms')
  @Tags('alarms')
  @Response(notFoundResp.status, notFoundResp.description)
  getHostAlarms(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoAlarm>>> {
    const host = this.getObject(id as XoHost['id'])
    const alarms = this.#alarmService.getAlarms({
      filter: `${escapeUnsafeComplexMatcher(filter) ?? ''} object:uuid:${host.uuid}`,
      limit,
    })

    return this.sendObjects(Object.values(alarms), req, 'alarms')
  }

  /**
   * Returns a boolean indicating whether SMT (Simultaneous Multi-Threading) is enabled
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostSmt)
  @Get('{id}/smt')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(internalServerErrorResp.status, internalServerErrorResp.description)
  async gethostSmt(@Path() id: string): Promise<{ enabled: boolean }> {
    const hostId = id as XoHost['id']

    const xapiHost = this.getXapiObject(hostId)
    const enabled = Boolean(await xapiHost.$xapi.isHyperThreadingEnabled(hostId))

    return { enabled }
  }

  /**
   * Host must be running
   *
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   */
  @Example(hostMissingPatches)
  @Get('{id}/missing_patches')
  @Response(notFoundResp.status, notFoundResp.description)
  @Response(featureUnauthorized.status, featureUnauthorized.description)
  async getMissingPatches(@Path() id: string): Promise<XcpPatches[] | XsPatches[]> {
    const { missingPatches } = await this.#hostService.getMissingPatchesInfo({ filter: host => host.id === id })
    return missingPatches
  }

  /**
   * @example id "b61a5c92-700e-4966-a13b-00633f03eea8"
   * @example fields "name,id,$object"
   * @example filter "name:PBD_PLUG_FAILED_ON_SERVER_START"
   * @example limit 42
   */
  @Example(messageIds)
  @Example(partialMessages)
  @Get('{id}/messages')
  @Tags('messages')
  @Response(notFoundResp.status, notFoundResp.description)
  getHostMessages(
    @Request() req: ExRequest,
    @Path() id: string,
    @Query() fields?: string,
    @Query() ndjson?: boolean,
    @Query() filter?: string,
    @Query() limit?: number
  ): SendObjects<Partial<Unbrand<XoMessage>>> {
    const messages = this.getMessagesForObject(id as XoHost['id'], { filter, limit })

    return this.sendObjects(Object.values(messages), req, 'messages')
  }
}
