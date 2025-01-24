import { Controller, Get, Request, Route } from 'tsoa'
import DashboardService from './dashboard.service.js'
import { inject } from 'inversify'
import { provideSingleton } from '../ioc/helper.js'
import { Request as ExReq } from 'express'

export type Dashboard = {
  vmsStatus: {
    running: number
    inactive: number
    unknown: number
  }
  poolsStatus: {
    connected: number
    unreachable: number
    unknown: number
  }
}

@Route('dashboard')
@provideSingleton(DashboardController)
export class DashboardController extends Controller {
  #dashboardService
  constructor(@inject(DashboardService) dashboardService: DashboardService) {
    super()
    this.#dashboardService = dashboardService
  }
  @Get()
  public async getDashboard(@Request() req: ExReq): Promise<Dashboard> {
    const resp = req.res!
    resp.setHeader('Access-Control-Allow-Origin', '*') // TODO: remove this. Only used for test

    return this.#dashboardService.getDashboard()
  }
}
