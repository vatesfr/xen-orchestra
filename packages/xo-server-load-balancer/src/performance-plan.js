import { filter, find } from 'lodash'

import Plan from './plan'
import { debug } from './utils'

// Compare a list of objects and give the best.
function searchBestObject(objects, fun) {
  let object = objects[0]

  for (let i = 1; i < objects.length; i++) {
    if (fun(object, objects[i]) > 0) {
      object = objects[i]
    }
  }

  return object
}

// ===================================================================

export default class PerformancePlan extends Plan {
  _checkResourcesThresholds(objects, averages) {
    return filter(objects, object => {
      const objectAverages = averages[object.id]

      return (
        objectAverages.cpu >= this._thresholds.cpu.high || objectAverages.memoryFree <= this._thresholds.memoryFree.high
      )
    })
  }

  async execute() {
    // Try to power on a hosts set.
    try {
      await Promise.all(
        filter(this._getHosts({ powerState: 'Halted' }), host => host.powerOnMode !== '').map(host => {
          const { id } = host
          return this.xo.getXapi(id).powerOnHost(id)
        })
      )
    } catch (error) {
      console.error(error)
    }

    await this._processAntiAffinity()

    const hosts = this._getHosts()
    const results = await this._getHostStatsAverages({
      hosts,
      toOptimizeOnly: true,
    })

    if (!results) {
      return
    }

    const { averages, toOptimize } = results

    toOptimize.sort((a, b) => {
      a = averages[a.id]
      b = averages[b.id]

      return b.cpu - a.cpu || a.memoryFree - b.memoryFree
    })

    for (const exceededHost of toOptimize) {
      const { id } = exceededHost

      debug(`Try to optimize Host (${exceededHost.id}).`)
      const availableHosts = filter(hosts, host => host.id !== id)
      debug(`Available destinations: ${availableHosts.map(host => host.id)}.`)

      // Search bests combinations for the worst host.
      await this._optimize({
        exceededHost,
        hosts: availableHosts,
        hostsAverages: averages,
      })
    }
  }

  async _optimize({ exceededHost, hosts, hostsAverages }) {
    const vms = filter(this._getAllRunningVms(), vm => vm.$container === exceededHost.id)
    const vmsAverages = await this._getVmsAverages(vms, { [exceededHost.id]: exceededHost })

    // Sort vms by cpu usage. (lower to higher)
    vms.sort((a, b) => vmsAverages[b.id].cpu - vmsAverages[a.id].cpu)

    const exceededAverages = hostsAverages[exceededHost.id]
    const promises = []

    const xapiSrc = this.xo.getXapi(exceededHost)
    let optimizationsCount = 0

    const searchFunction = (a, b) => hostsAverages[b.id].cpu - hostsAverages[a.id].cpu

    for (const vm of vms) {
      debug(`Trying to migrate ${vm.id}...`)

      // Search host with lower cpu usage in the same pool first. In other pool if necessary.
      let destination = searchBestObject(
        find(hosts, host => host.$poolId === vm.$poolId),
        searchFunction
      )

      if (!destination) {
        debug('No destination host found in the current VM pool. Trying in all pools.')
        destination = searchBestObject(hosts, searchFunction)
      }

      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      debug(`Trying to migrate VM (${vm.id}) to Host (${destination.id}) from Host (${exceededHost.id})...`)

      // Unable to move the vm.
      if (
        exceededAverages.cpu - vmAverages.cpu < destinationAverages.cpu + vmAverages.cpu ||
        destinationAverages.memoryFree < vmAverages.memory
      ) {
        debug(`Cannot migrate VM (${vm.id}) to Host (${destination.id}).`)
        debug(
          `Src Host CPU=${exceededAverages.cpu}, Dest Host CPU=${destinationAverages.cpu}, VM CPU=${vmAverages.cpu}`
        )
        debug(`Dest Host free RAM=${destinationAverages.memoryFree}, VM used RAM=${vmAverages.memory})`)
        continue
      }

      for (const tag of vm.tags) {
        // TODO: Improve this piece of code. We could compute variance to check if the VM
        // is migratable. But the code must be rewritten:
        // - All VMs, hosts and stats must be fetched at one place.
        // - It's necessary to maintain a dictionary of tags for each host.
        // - ...
        if (this._antiAffinityTags.includes(tag)) {
          debug(
            `VM (${vm.id}) of Host (${exceededHost.id}) cannot be migrated. It contains anti-affinity tag '${tag}'.`
          )
          continue
        }
      }

      exceededAverages.cpu -= vmAverages.cpu
      destinationAverages.cpu += vmAverages.cpu

      exceededAverages.memoryFree += vmAverages.memory
      destinationAverages.memoryFree -= vmAverages.memory

      debug(`Migrate VM (${vm.id}) to Host (${destination.id}) from Host (${exceededHost.id}).`)
      optimizationsCount++

      promises.push(xapiSrc.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId))
    }

    await Promise.all(promises)
    debug(`Performance mode: ${optimizationsCount} optimizations for Host (${exceededHost.id}).`)
  }
}
