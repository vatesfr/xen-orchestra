import { Controller, Example, Get, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { PassThrough } from 'node:stream'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest, Response as ExResponse } from 'express'

import type { PingResponse, XoaDashboard, XoGuiRoutes } from './xoa.type.mjs'

import { guiRoutes } from '../open-api/oa-examples/gui-routes.oa-example.mjs'
import { pingResponse } from '../open-api/oa-examples/ping.oa-example.mjs'
import { badRequestResp, unauthorizedResp } from '../open-api/common/response.common.mjs'
import { xoaDashboard } from '../open-api/oa-examples/xoa.oa-example.mjs'
import { XoaService } from './xoa.service.mjs'
import { NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

@Route('')
@Security('*')
@Tags('xoa')
@provide(XoaController)
export class XoaController extends Controller {
  #restApi: RestApi
  #xoaService: XoaService

  constructor(@inject(RestApi) restApi: RestApi, @inject(XoaService) xoaService: XoaService) {
    super()
    this.#restApi = restApi
    this.#xoaService = xoaService
  }

  @Example(xoaDashboard)
  @Get('dashboard')
  @Response(badRequestResp.status, badRequestResp.description)
  @Response(unauthorizedResp.status, unauthorizedResp.description)
  async getDashboard(@Request() req: ExRequest, @Query() ndjson?: boolean): Promise<XoaDashboard | undefined> {
    const stream = ndjson ? new PassThrough() : undefined
    const isStream = ndjson && stream !== undefined
    if (isStream) {
      const res = req.res as ExResponse
      res.setHeader('Content-Type', NDJSON_CONTENT_TYPE)
      stream.pipe(res)
    }

    const dashboard = await this.#xoaService.getDashboard({ stream })

    if (isStream) {
      stream.end()
    } else {
      return dashboard
    }
  }

  @Security('none')
  @Example(pingResponse)
  @Get('ping')
  ping(): PingResponse {
    return {
      result: 'pong',
      timestamp: Date.now(),
    }
  }

  @Security('none')
  @Example(guiRoutes)
  @Get('gui-routes')
  getGuiRoutes(): XoGuiRoutes {
    return this.#restApi.xoApp.config.getGuiRoutes()
  }
}
