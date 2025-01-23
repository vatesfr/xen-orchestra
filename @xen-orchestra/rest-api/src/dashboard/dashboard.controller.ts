import { Controller, Get, Route } from 'tsoa'
import DashboardService from './dashboard.service.js'
import { inject } from 'inversify'

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
