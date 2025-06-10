import { Controller, Example, Get, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import type { XoaDashboard } from './xoa.type.mjs'

import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { xoaDashboard } from '../open-api/oa-examples/xoa.oa-example.mjs'
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

  @Example(xoaDashboard)
  @Get('dashboard')
  async getDashboard(): Promise<XoaDashboard> {
    const dashboard = await this.#xoaService.getDashboard()
    return dashboard
  }
}
