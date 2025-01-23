import { Controller, Get, Route } from 'tsoa'
import DashboardService from './dashboard.service.js'
import { inject } from 'inversify'
import { provideSingleton } from '../ioc/helper.js'

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
  public async getDashboard(): Promise<Dashboard> {
    return this.#dashboardService.getDashboard()
  }
}
