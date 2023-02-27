import filter from 'lodash/filter.js'

import Plan from './plan'
import { debug as debugP } from './utils'

export const debug = str => debugP(`performance: ${str}`)

function epsiEqual(a, b, epsi = 0.001) {
  const absA = Math.abs(a)
  const absB = Math.abs(b)
  return Math.abs(a - b) <= Math.min(absA, absB) * epsi || (absA <= epsi && absB <= epsi)
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
    toOptimize.sort((a, b) => -this._sortHosts(a, b))
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

  _getThresholdState(averages) {
    return {
      cpu: averages.cpu >= this._thresholds.cpu.high,
      mem: averages.memoryFree <= this._thresholds.memoryFree.high,
    }
  }

  _sortHosts(aAverages, bAverages) {
    const aState = this._getThresholdState(aAverages)
    const bState = this._getThresholdState(bAverages)

    // A. Same state.
    if (aState.mem === bState.mem && aState.cpu === bState.cpu) {
      if (epsiEqual(aAverages.cpu, bAverages.cpu)) {
        return bAverages.memoryFree - aAverages.memoryFree
      }
      return aAverages.cpu - bAverages.cpu
    }

    // B. No limit reached on A OR both limits reached on B.
    if ((!aState.mem && !aState.cpu) || (bState.mem && bState.cpu)) {
      return -1
    }

    // C. No limit reached on B OR both limits reached on A.
    if ((!bState.mem && !bState.cpu) || (aState.mem && aState.cpu)) {
      return 1
    }

    // D. If only one limit is reached on A AND B, we prefer to migrate on the host with the lowest CPU usage.
    return !aState.cpu ? -1 : 1
  }

  async _optimize({ exceededHost, hosts, hostsAverages }) {
    const vms = filter(this._getAllRunningVms(), vm => vm.$container === exceededHost.id)
    const vmsAverages = await this._getVmsAverages(vms, { [exceededHost.id]: exceededHost })

    // Sort vms by cpu usage. (higher to lower) + use memory otherwise.
    vms.sort((a, b) => {
      const aAverages = vmsAverages[a.id]
      const bAverages = vmsAverages[b.id]

      // We use a tolerance to migrate VM with the most memory used.
      if (epsiEqual(aAverages.cpu, bAverages.cpu, 3)) {
        return bAverages.memory - aAverages.memory
      }
      return bAverages.cpu - aAverages.cpu
    })

    const exceededAverages = hostsAverages[exceededHost.id]
    const promises = []

    const xapiSrc = this.xo.getXapi(exceededHost)
    let optimizationCount = 0

    const fmtSrcHost = `${exceededHost.id} "${exceededHost.name_label}"`
    for (const vm of vms) {
      // Stop migration if we are below low threshold.
      if (
        exceededAverages.cpu <= this._thresholds.cpu.low &&
        exceededAverages.memoryFree >= this._thresholds.memoryFree.low
      ) {
        return
      }

      if (!vm.xenTools) {
        debug(`VM (${vm.id}) of Host (${exceededHost.id}) does not support pool migration.`)
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

      hosts.sort((a, b) => {
        if (a.$poolId !== b.$poolId) {
          // Use host in the same pool first. In other pool if necessary.
          if (a.$poolId === vm.$poolId) {
            return -1
          }
          if (b.$poolId === vm.$poolId) {
            return 1
          }
        }

        return this._sortHosts(hostsAverages[a.id], hostsAverages[b.id])
      })

      const destination = hosts[0]

      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      // Unable to move the vm.
      // Because the performance mode is focused on the CPU usage, we can't migrate if the low threshold
      // is reached on the destination.
      // It's not the same idea regarding the memory usage, we can migrate if the low threshold is reached,
      // but we avoid the migration in the critical (high) threshold case.
      const state = this._getThresholdState(exceededAverages)
      if (
        destinationAverages.cpu + vmAverages.cpu >= this._thresholds.cpu.low ||
        destinationAverages.memoryFree - vmAverages.memory <= this._thresholds.cpu.high ||
        (!state.cpu &&
          !state.memory &&
          (exceededAverages.cpu - vmAverages.cpu < destinationAverages.cpu + vmAverages.cpu ||
            exceededAverages.memoryFree + vmAverages.memory > destinationAverages.memoryFree - vmAverages.memory))
      ) {
        debug(`Cannot migrate VM (${vm.id}) to Host (${destination.id}).`)
        debug(
          `Src Host CPU=${exceededAverages.cpu}, Dest Host CPU=${destinationAverages.cpu}, VM CPU=${vmAverages.cpu}`
        )
        debug(
          `Src Host free RAM=${exceededAverages.memoryFree}, Dest Host free RAM=${destinationAverages.memoryFree}, VM used RAM=${vmAverages.memory})`
        )
        continue
      }

      exceededAverages.cpu -= vmAverages.cpu
      destinationAverages.cpu += vmAverages.cpu

      exceededAverages.memoryFree += vmAverages.memory
      destinationAverages.memoryFree -= vmAverages.memory

      debug(
        `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${fmtSrcHost}).`
      )
      optimizationCount++

      promises.push(xapiSrc.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId))
    }

    await Promise.all(promises)
    debug(`Performance mode: ${optimizationCount} optimizations for Host (${fmtSrcHost}).`)
  }
}
