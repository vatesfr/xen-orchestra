import { getRestApi } from '../index.js'
import { Dashboard } from './dashboard.controller.js'
import { provideSingleton } from '../ioc/helper.js'

// cache used to compare changes and trigger dashboard events
type CacheDashboard = {
  vmsStatus: Dashboard['vmsStatus']
  poolsStatus: Dashboard['poolsStatus']
}
const cache = new Map<keyof CacheDashboard, CacheDashboard[keyof CacheDashboard]>()

@provideSingleton(DashboardService)
export default class DashboardService {
  #restApi
  #fnById = {
    // arrow fn to ensure to call the method in the good context
    vmsStatus: () => this.#getVmsStatus(),
    poolsStatus: () => this.#getPoolsStatus(),
  }

  constructor() {
    this.#restApi = getRestApi()
    this.#registerListener()
  }

  async getDashboard(): Promise<Dashboard> {
    const vmsStatus = this.#getVmsStatus()
    const poolsStatus = await this.#getPoolsStatus()

    return { vmsStatus, poolsStatus }
  }

  #getVmsStatus(): Dashboard['vmsStatus'] {
    const vms = Object.values(this.#restApi.getObjectsByType('VM') ?? {})
    let running = 0
    let inactive = 0
    let unknown = 0

    vms.forEach(vm => {
      if (vm.power_state === 'Running' || vm.power_state === 'Paused') {
        running++
      } else if (vm.power_state === 'Halted' || vm.power_state === 'Suspended') {
        inactive++
      } else {
        unknown++
      }
    })

    const result = { running, inactive, unknown }
    cache.set('vmsStatus', result)

    return result
  }

  async #getPoolsStatus(): Promise<Dashboard['poolsStatus']> {
    const servers = await this.#restApi.getServers()
    const poolIds = Object.keys(this.#restApi.getObjectsByType('pool') ?? {})

    let nConnectedServers = 0
    let nUnreachableServers = 0
    let nUnknownServers = 0
    servers.forEach(server => {
      // it may happen that some servers are marked as "connected", but no pool matches "server.pool"
      // so they are counted as `nUnknownServers`
      if (server.status === 'connected' && poolIds.includes(server.poolId)) {
        nConnectedServers++
        return
      }

      if (
        server.status === 'disconnected' &&
        server.error !== undefined &&
        server.error.connectedServerId === undefined
      ) {
        nUnreachableServers++
        return
      }

      if (server.status === 'disconnected') {
        return
      }

      nUnknownServers++
    })

    const result = { connected: nConnectedServers, unreachable: nUnreachableServers, unknown: nUnknownServers }
    cache.set('poolsStatus', result)

    return result
  }

  async #maybeSendEvent(key: keyof Dashboard) {
    const stringifiedCacheValue = JSON.stringify(cache.get(key))
    const newValue = await this.#fnById[key]()
    if (JSON.stringify(newValue) === stringifiedCacheValue) {
      return
    }

    this.#restApi.sendData(key, 'dashboard', newValue, 'update')
  }

  #registerListener() {
    this.#restApi.ee.on('vm', () => this.#maybeSendEvent('vmsStatus'))
    this.#restApi.ee.on('pool', () => this.#maybeSendEvent('poolsStatus'))
    // this.#restApi.ee.on('host', () => this.#maybeSendEvent('hostsStatus'))
  }
}
