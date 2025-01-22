import { getRestApi } from '../index.js'
import { XoVm } from '../vms/vm.type.js'
import { Dashboard } from './dashboard.controller.js'

export const getVmsStatus = (): Dashboard['vmsStatus'] => {
  const restApi = getRestApi()
  const vms = Object.values(restApi.getObjects<XoVm>({ filter: obj => obj.type === 'VM' }))
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

  return { running, inactive, unknown }
}

export const getPoolsStatus = async (): Promise<Dashboard['poolsStatus']> => {
  const restApi = getRestApi()
  const servers = await restApi.getServers()
  const poolIds = Object.keys(restApi.getObjects({ filter: obj => obj.type === 'pool' }))

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

  return { connected: nConnectedServers, unreachable: nUnreachableServers, unknown: nUnknownServers }
}
