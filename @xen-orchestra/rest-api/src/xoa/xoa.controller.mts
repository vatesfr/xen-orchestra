import { Controller, Example, Get, Query, Request, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { PassThrough } from 'node:stream'
import { provide } from 'inversify-binding-decorators'
import type { Request as ExRequest, Response as ExResponse } from 'express'

import type { XoaDashboard } from './xoa.type.mjs'

import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { xoaDashboard } from '../open-api/oa-examples/xoa.oa-example.mjs'
import { XoaService } from './xoa.service.mjs'
import { NDJSON_CONTENT_TYPE } from '../helpers/utils.helper.mjs'

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

  @Example(xoaDashboard)
  @Get('dashboard')
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
}
