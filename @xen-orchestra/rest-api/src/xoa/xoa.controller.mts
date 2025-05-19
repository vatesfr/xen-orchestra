import { Controller, Get, Response, Route, Security, Tags } from 'tsoa'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'

import { unauthorizedResp } from '../open-api/common/response.common.mjs'
import { XoaDashboard } from './xoa.type.mjs'
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

  @Get('dashboard')
  async getDashboard(): Promise<XoaDashboard> {
    const dashboard = await this.#xoaService.getDashboard()
    return dashboard
  }
}
