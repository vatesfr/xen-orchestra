import { Controller, Get, Route } from 'tsoa'
import * as dashboardService from './dashboard.service.js'

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
  @Get()
  public async getDashboard(): Promise<Dashboard> {
    const [poolsStatus] = await Promise.all([dashboardService.getPoolsStatus()])
    const vmsStatus = dashboardService.getVmsStatus()

    const dashboard = { poolsStatus, vmsStatus }
    return dashboard
  }
}
