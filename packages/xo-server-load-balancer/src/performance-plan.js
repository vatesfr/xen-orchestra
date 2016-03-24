import filter from 'lodash.filter'

import Plan from './plan'
import {
  debug,
  searchObject
} from './utils'

// ===================================================================

export default class PerformancePlan extends Plan {
  constructor (xo, name, poolIds, options) {
    super(xo, name, poolIds, options)
  }

  _checkRessourcesThresholds (objects, averages) {
    return filter(objects, object => {
      const objectAverages = averages[object.id]

      return (
        objectAverages.cpu >= this._thresholds.cpu.high ||
        objectAverages.memoryFree <= this._thresholds.memoryFree.high
      )
    })
  }

  async execute () {
    const results = await this._findHostsToOptimize()

    if (!results) {
      return
    }

    const {
      averages,
      toOptimize
    } = results
    let { hosts } = results

    toOptimize.sort((a, b) => {
      a = averages[a.id]
      b = averages[b.id]

      return (b.cpu - a.cpu) || (a.memoryFree - b.memoryFree)
    })

    for (const exceededHost of toOptimize) {
      const { id } = exceededHost

      debug(`Try to optimize Host (${exceededHost.id}).`)
      hosts = filter(hosts, host => host.id !== id)

      // Search bests combinations for the worst host.
      await this._optimize({
        exceededHost,
        hosts,
        hostsAverages: averages
      })
    }
  }

  async _optimize ({ exceededHost, hosts, hostsAverages }) {
    const vms = await this._getVms(exceededHost.id)
    const vmsAverages = await this._getVmsAverages(vms, exceededHost)

    // Sort vms by cpu usage. (lower to higher)
    vms.sort((a, b) =>
      vmsAverages[b.id].cpu - vmsAverages[a.id].cpu
    )

    const exceededAverages = hostsAverages[exceededHost.id]
    const promises = []

    const xapiSrc = this.xo.getXapi(exceededHost)
    let optimizationsCount = 0

    for (const vm of vms) {
      // Search host with lower cpu usage.
      const destination = searchObject(hosts, (a, b) =>
        hostsAverages[b.id].cpu - hostsAverages[a.id].cpu
      )
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      // Unable to move the vm.
      if (
        exceededAverages.cpu - vmAverages.cpu < destinationAverages.cpu + vmAverages.cpu ||
        destinationAverages.memoryFree > vmAverages.memory
      ) {
        continue
      }

      exceededAverages.cpu -= vmAverages.cpu
      destinationAverages.cpu += vmAverages.cpu

      exceededAverages.memoryFree += vmAverages.memory
      destinationAverages.memoryFree -= vmAverages.memory

      debug(`Migrate VM (${vm.id}) to Host (${destination.id}) from Host (${exceededHost.id}).`)
      optimizationsCount++

      // promises.push(
      //   xapiSrc.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId)
      // )
    }

    await Promise.all(promises)
    debug(`Performance mode: ${optimizationsCount} optimizations for Host (${exceededHost.id}).`)

    return
  }
}
