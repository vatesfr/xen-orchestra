import { clone, filter, map as mapToArray } from 'lodash'

import Plan from './plan'
import { debug as debugP } from './utils'

export const debug = str => debugP(`density: ${str}`)

// ===================================================================

export default class DensityPlan extends Plan {
  _checkResourcesThresholds(objects, averages) {
    const { low } = this._thresholds.memoryFree
    return filter(objects, object => {
      const { memory, memoryFree = memory } = averages[object.id]
      return memoryFree > low
    })
  }

  async execute() {
    await this._processAntiAffinity()

    const hosts = this._getHosts()
    const results = await this._getHostStatsAverages({
      hosts,
      toOptimizeOnly: true,
    })

    if (!results) {
      return
    }

    const { toOptimize } = results

    let { averages: hostsAverages } = results

    const pools = await this._getPlanPools()
    let optimizationsCount = 0

    for (const hostToOptimize of toOptimize) {
      const { id: hostId, $poolId: poolId } = hostToOptimize

      const { master: masterId } = pools[poolId]

      // Avoid master optimization.
      if (masterId === hostId) {
        continue
      }

      // A host to optimize needs the ability to be restarted.
      if (hostToOptimize.powerOnMode === '') {
        debug(`Host (${hostId}) does not have a power on mode.`)
        continue
      }

      let poolMaster // Pool master.
      const poolHosts = [] // Without master.
      const masters = [] // Without the master of this loop.
      const otherHosts = []

      for (const dest of hosts) {
        const { id: destId, $poolId: destPoolId } = dest

        // Destination host != Host to optimize!
        if (destId === hostId) {
          continue
        }

        if (destPoolId === poolId) {
          if (destId === masterId) {
            poolMaster = dest
          } else {
            poolHosts.push(dest)
          }
        } else if (destId === pools[destPoolId].master) {
          masters.push(dest)
        } else {
          otherHosts.push(dest)
        }
      }

      const simulResults = await this._simulate({
        host: hostToOptimize,
        destinations: [[poolMaster], poolHosts, masters, otherHosts],
        hostsAverages: clone(hostsAverages),
      })

      if (simulResults) {
        // Update stats.
        hostsAverages = simulResults.hostsAverages

        // Migrate.
        await this._migrate(hostToOptimize, simulResults.moves)
        optimizationsCount++
      }
    }

    debug(`Density mode: ${optimizationsCount} optimizations.`)
  }

  async _simulate({ host, destinations, hostsAverages }) {
    const { id: hostId } = host

    debug(`Try to optimize Host (${hostId}).`)

    const vms = filter(this._getAllRunningVms(), vm => vm.$container === hostId)
    const vmsAverages = await this._getVmsAverages(vms, { [host.id]: host })

    for (const vm of vms) {
      if (!vm.xenTools) {
        debug(`VM (${vm.id}) of Host (${hostId}) does not support pool migration.`)
        return
      }

      for (const tag of vm.tags) {
        // TODO: Improve this piece of code. We could compute variance to check if the VM
        // is migratable. But the code must be rewritten:
        // - All VMs, hosts and stats must be fetched at one place.
        // - It's necessary to maintain a dictionary of tags for each host.
        // - ...
        if (this._antiAffinityTags.includes(tag)) {
          debug(`VM (${vm.id}) of Host (${hostId}) cannot be migrated. It contains anti-affinity tag '${tag}'.`)
          return
        }
      }
    }

    // Sort vms by amount of memory. (+ -> -)
    vms.sort((a, b) => vmsAverages[b.id].memory - vmsAverages[a.id].memory)

    const simulResults = {
      hostsAverages,
      moves: [],
    }

    // Try to find a destination for each VM.
    for (const vm of vms) {
      let move

      // Simulate the VM move on a destinations set.
      for (const subDestinations of destinations) {
        move = this._testMigration({
          vm,
          destinations: subDestinations,
          hostsAverages,
          vmsAverages,
        })

        // Destination found.
        if (move) {
          simulResults.moves.push(move)
          break
        }
      }

      // Unable to move a VM.
      if (!move) {
        return
      }
    }

    // Done.
    return simulResults
  }

  // Test if a VM migration on a destination (of a destinations set) is possible.
  _testMigration({ vm, destinations, hostsAverages, vmsAverages }) {
    const {
      _thresholds: { critical: criticalThreshold },
    } = this

    // Sort the destinations by available memory. (- -> +)
    destinations.sort((a, b) => hostsAverages[a.id].memoryFree - hostsAverages[b.id].memoryFree)

    for (const destination of destinations) {
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      // Unable to move the VM.
      if (
        destinationAverages.cpu + vmAverages.cpu >= criticalThreshold ||
        destinationAverages.memoryFree - vmAverages.memory <= criticalThreshold
      ) {
        continue
      }

      // Move ok. Update stats.
      destinationAverages.cpu += vmAverages.cpu
      destinationAverages.memoryFree -= vmAverages.memory

      // Available movement.
      return {
        vm,
        destination,
      }
    }
  }

  // Migrate the VMs of one host.
  // Try to shutdown the VMs host.
  async _migrate(srcHost, moves) {
    const xapiSrc = this.xo.getXapi(srcHost.id)

    const fmtSrcHost = `${srcHost.id} "${srcHost.name_label}"`
    await Promise.all(
      mapToArray(moves, move => {
        const { vm, destination } = move
        const xapiDest = this.xo.getXapi(destination)
        debug(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${fmtSrcHost}).`
        )
        return xapiDest.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId)
      })
    )

    debug(`Shutdown Host (${fmtSrcHost}).`)

    try {
      await xapiSrc.shutdownHost(srcHost.id)
    } catch (error) {
      debug(`Unable to shutdown Host (${fmtSrcHost}).`, { error })
    }
  }
}
