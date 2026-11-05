import { clone, filter, intersection, keyBy } from 'lodash'

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
    await this._processVmToHostAffinity()
    await this._processAffinity()
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
    }

    // Sort vms by amount of memory. (+ -> -)
    vms.sort((a, b) => vmsAverages[b.id].memory - vmsAverages[a.id].memory)

    const simulResults = {
      hostsAverages,
      moves: [],
    }

    // per-host counts of affinity/anti-affinity tagged VMs, to check whether a candidate destination
    // would deteriorate a VM's constraints, instead of blocking its migration entirely.
    // include the host being emptied too, since counts get decremented on it as VMs are migrated away.
    const allRelevantHosts = [host, ...filter(destinations.flat(), h => h != null)]
    const idToHost = keyBy(allRelevantHosts, 'id')
    const allRunningVms = this._getAllRunningVms()
    const affinityCountsByHostId = this._affinityTags.length
      ? keyBy(
          this._getTaggedHosts({ hosts: allRelevantHosts, tagList: this._affinityTags, vms: allRunningVms }).hosts,
          'id'
        )
      : undefined
    const antiAffinityCountsByHostId = this._antiAffinityTags.length
      ? keyBy(
          this._getTaggedHosts({ hosts: allRelevantHosts, tagList: this._antiAffinityTags, vms: allRunningVms }).hosts,
          'id'
        )
      : undefined

    // Try to find a destination for each VM.
    for (const vm of vms) {
      let move

      // don't exclude VMs with meaningful tags entirely: only avoid destinations that would
      // deteriorate the VM's affinity / anti-affinity / vm-to-host affinity constraints
      const affinityTags = intersection(vm.tags, this._affinityTags)
      const antiAffinityTags = intersection(vm.tags, this._antiAffinityTags)

      // Simulate the VM move on a destinations set.
      for (const subDestinations of destinations) {
        const eligibleDestinations = filter(subDestinations, host => {
          if (host == null) {
            return false
          }
          const params = { vm, sourceHostId: hostId, destinationHostId: host.id }
          return (
            !this._wouldDeteriorateAffinity({ ...params, countsByHostId: affinityCountsByHostId }) &&
            !this._wouldDeteriorateAntiAffinity({ ...params, countsByHostId: antiAffinityCountsByHostId }) &&
            !this._wouldDeteriorateVmToHostAffinity({ ...params, idToHost })
          )
        })

        move = this._testMigration({
          vm,
          destinations: eligibleDestinations,
          hostsAverages,
          vmsAverages,
        })

        // Destination found.
        if (move) {
          simulResults.moves.push(move)
          // keep our local counts in sync so later VMs in this loop aren't checked against stale data
          this._adjustTagCounts(affinityCountsByHostId, affinityTags, hostId, move.destination.id)
          this._adjustTagCounts(antiAffinityCountsByHostId, antiAffinityTags, hostId, move.destination.id)
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
      _thresholds: {
        cpu: { critical: criticalThresholdCpu },
        memoryFree: { critical: criticalThresholdMemoryFree },
      },
    } = this

    // Sort the destinations by available memory. (- -> +)
    destinations.sort((a, b) => hostsAverages[a.id].memoryFree - hostsAverages[b.id].memoryFree)

    for (const destination of destinations) {
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      // Unable to move the VM.
      if (
        destinationAverages.cpu + vmAverages.cpu >= criticalThresholdCpu ||
        destinationAverages.memoryFree - vmAverages.memory <= criticalThresholdMemoryFree
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
    const fmtSrcHost = `${srcHost.id} "${srcHost.name_label}"`
    const xapiSrc = this.xo.getXapi(srcHost.id)
    await Promise.all(
      moves.map(({ vm, destination }) => {
        debug(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${fmtSrcHost}).`
        )
        return this._migrateVm({
          vm,
          xapiSrc,
          xapiDest: this.xo.getXapi(destination),
          srcHostId: srcHost.id,
          destHostId: destination._xapiId,
          reason: `to try to shutdown host ${srcHost.id}`,
        })
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
