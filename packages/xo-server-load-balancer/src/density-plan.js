import filter from 'lodash.filter'
import clone from 'lodash.clonedeep'
import { default as mapToArray } from 'lodash.map'

import Plan from './plan'
import {
  debug
} from './utils'

// ===================================================================

export default class DensityPlan extends Plan {
  constructor (xo, name, poolIds, options) {
    super(xo, name, poolIds, options)
  }

  _checkRessourcesThresholds (objects, averages) {
    return filter(objects, object =>
      averages[object.id].memoryFree > this._thresholds.memoryFree.low
    )
  }

  async execute () {
    const results = await this._findHostsToOptimize()

    if (!results) {
      return
    }

    const {
      hosts,
      toOptimize
    } = results

    let {
      averages: hostsAverages
    } = results

    const pools = await this._getPlanPools()
    let optimizationsCount = 0

    for (const hostToOptimize of toOptimize) {
      const {
        id: hostId,
        $poolId: poolId
      } = hostToOptimize

      const {
        master: masterId
      } = pools[poolId]

      // Avoid master optimization.
      if (masterId === hostId) {
        continue
      }

      let poolMaster // Pool master.
      const poolHosts = [] // Without master.
      const masters = [] // Without the master of this loop.
      const otherHosts = []

      for (const dest of hosts) {
        const {
          id: destId,
          $poolId: destPoolId
        } = dest

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
        destinations: [
          [ poolMaster ],
          poolHosts,
          masters,
          otherHosts
        ],
        hostsAverages: clone(hostsAverages)
      })

      if (simulResults) {
        // Update stats.
        hostsAverages = simulResults.hostsAverages

        // Migrate.
        await this._migrate(simulResults.moves)
        optimizationsCount++
      }
    }

    debug(`Density mode: ${optimizationsCount} optimizations.`)
  }

  async _simulate ({ host, destinations, hostsAverages }) {
    const { id: hostId } = host

    debug(`Try to optimize Host (${hostId}).`)

    const vms = await this._getVms(hostId)
    const vmsAverages = await this._getVmsAverages(vms, host)

    // Sort vms by amount of memory. (+ -> -)
    vms.sort((a, b) =>
      vmsAverages[b.id].memory - vmsAverages[a.id].memory
    )

    const simulResults = {
      hostsAverages,
      moves: []
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
          vmsAverages
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
  _testMigration ({ vm, destinations, hostsAverages, vmsAverages }) {
    const {
      _thresholds: {
        critical: criticalThreshold
      }
    } = this

    // Sort the destinations by available memory. (- -> +)
    destinations.sort((a, b) =>
      hostsAverages[a.id].memoryFree - hostsAverages[b.id].memoryFree
    )

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

      destinationAverages.cpu += vmAverages.cpu
      destinationAverages.memoryFree -= vmAverages.memory

      // Available movement.
      return {
        vm,
        destination
      }
    }
  }

  async _migrate (moves) {
    await Promise.all(
      mapToArray(moves, move => {
        const {
          vm,
          destination
        } = move
        const xapiSrc = this.xo.getXapi(destination)
        debug(`Migrate VM (${vm.id}) to Host (${destination.id}) from Host (${vm.$container}).`)
        // xapiSrc.migrateVm(vm._xapiId, this.xo.getXapi(destination), destination._xapiId)
      })
    )
  }
}
