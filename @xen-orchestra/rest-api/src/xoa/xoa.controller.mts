import { Controller, Example, Get, Produces, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { PassThrough } from 'node:stream'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest, Response as ExResponse } from 'express'

import type { XoaDashboard } from './xoa.type.mjs'

import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { xoaDashboard, xoaDashboardNdjson } from '../open-api/oa-examples/xoa.oa-example.mjs'
import { XoaService } from './xoa.service.mjs'

@Route('')
@Security('*')
@Response(unauthorizedResp.status, unauthorizedResp.description)
@Tags('xoa')
@provide(XoaController)
export class XoaController extends Controller {
  #xoaService: XoaService

  constructor(@inject(XoaService) xoaService: XoaService) {
    super()
    this.#xoaService = xoaService
  }

  @Example(xoaDashboard, 'json example')
  @Example(xoaDashboardNdjson, 'ndjson example')
  @Get('dashboard')
  @Produces('application/json')
  @Produces('application/ndjson')
  async getDashboard(@Request() req: ExRequest, @Query() ndjson?: boolean): Promise<XoaDashboard | undefined> {
    const stream = ndjson ? new PassThrough() : undefined
    const isStream = ndjson && stream !== undefined
    if (isStream) {
      const res = req.res as ExResponse
      res.setHeader('Content-Type', 'application/ndjson')
      stream.pipe(res)
    }

    const dashboard = await this.#xoaService.getDashboard({ stream })

    if (isStream) {
      stream.end()
    } else {
      return dashboard
    }
  }
}
