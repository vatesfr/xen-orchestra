import lodash from 'lodash'
const { clone, filter } = lodash
import type { XoHost, XoVm, Xapi } from '@vates/types'

import Plan, { type HostAveragesMap } from './plan.mjs'
import { debug as debugP } from './utils.mjs'

export const debug = (str: string) => debugP(`density: ${str}`)

// ===================================================================

export default class DensityPlan extends Plan {
  _checkResourcesThresholds(objects: XoHost[], averages: HostAveragesMap): XoHost[] {
    const { low } = this._thresholds.memoryFree
    return filter(objects, object => {
      const avg = averages[object.id]
      if (avg === undefined) {
        return false
      }
      const { memory, memoryFree = memory } = avg
      return memoryFree > low
    })
  }

  async execute(): Promise<void> {
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

    if (!toOptimize) {
      return
    }

    let { averages: hostsAverages } = results

    const pools = this._getPlanPools()
    let optimizationsCount = 0

    for (const hostToOptimize of toOptimize) {
      const { id: hostId, $poolId: poolId } = hostToOptimize

      const pool = pools[poolId]
      if (pool === undefined) {
        continue
      }

      const { master: masterId } = pool

      // Avoid master optimization.
      if (masterId === hostId) {
        continue
      }

      // A host to optimize needs the ability to be restarted.
      if (hostToOptimize.powerOnMode === '') {
        debug(`Host (${hostId}) does not have a power on mode.`)
        continue
      }

      let poolMaster: XoHost | undefined // Pool master.
      const poolHosts: XoHost[] = [] // Without master.
      const masters: XoHost[] = [] // Without the master of this loop.
      const otherHosts: XoHost[] = []

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
        } else if (destId === pools[destPoolId]?.master) {
          masters.push(dest)
        } else {
          otherHosts.push(dest)
        }
      }

      const simulResults = await this._simulate({
        host: hostToOptimize,
        destinations: [poolMaster !== undefined ? [poolMaster] : [], poolHosts, masters, otherHosts],
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

  async _simulate({
    host,
    destinations,
    hostsAverages,
  }: {
    host: XoHost
    destinations: XoHost[][]
    hostsAverages: HostAveragesMap
  }): Promise<{ hostsAverages: HostAveragesMap; moves: { vm: XoVm; destination: XoHost }[] } | undefined> {
    const { id: hostId } = host

    debug(`Try to optimize Host (${hostId}).`)

    const vms = filter(this._getAllRunningVms(), vm => vm.$container === hostId)
    const vmsAverages = await this._getVmsAverages(vms, { [host.id]: host })

    for (const vm of vms) {
      if (!vm.xentools) {
        debug(`VM (${vm.id}) of Host (${hostId}) does not support pool migration.`)
        return
      }

      for (const tag of vm.tags) {
        if (this._affinityTags.includes(tag)) {
          debug(`VM (${vm.id}) of Host (${hostId}) cannot be migrated. It contains affinity tag '${tag}'.`)
          return
        }
        if (this._antiAffinityTags.includes(tag)) {
          debug(`VM (${vm.id}) of Host (${hostId}) cannot be migrated. It contains anti-affinity tag '${tag}'.`)
          return
        }
      }
    }

    // Sort vms by amount of memory. (+ -> -)
    vms.sort((a, b) => (vmsAverages[b.id]?.memory ?? 0) - (vmsAverages[a.id]?.memory ?? 0))

    const simulResults: { hostsAverages: HostAveragesMap; moves: { vm: XoVm; destination: XoHost }[] } = {
      hostsAverages,
      moves: [],
    }

    // Try to find a destination for each VM.
    for (const vm of vms) {
      let move: { vm: XoVm; destination: XoHost } | undefined

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
  _testMigration({
    vm,
    destinations,
    hostsAverages,
    vmsAverages,
  }: {
    vm: XoVm
    destinations: XoHost[]
    hostsAverages: HostAveragesMap
    vmsAverages: HostAveragesMap
  }): { vm: XoVm; destination: XoHost } | undefined {
    const {
      _thresholds: {
        cpu: { critical: criticalThresholdCpu },
        memoryFree: { critical: criticalThresholdMemoryFree },
      },
    } = this

    // Sort the destinations by available memory. (- -> +)
    destinations.sort((a, b) => (hostsAverages[a.id]?.memoryFree ?? 0) - (hostsAverages[b.id]?.memoryFree ?? 0))

    for (const destination of destinations) {
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      if (destinationAverages === undefined || vmAverages === undefined) {
        continue
      }

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
  async _migrate(srcHost: XoHost, moves: { vm: XoVm; destination: XoHost }[]): Promise<void> {
    const fmtSrcHost = `${srcHost.id} "${srcHost.name_label}"`
    const xapiSrc = this.xo.getXapi(srcHost) as Xapi & { shutdownHost(hostId: string): Promise<void> }
    await Promise.all(
      moves.map(({ vm, destination }) => {
        debug(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${fmtSrcHost}).`
        )
        return this._migrateVm(vm, xapiSrc, this.xo.getXapi(destination), destination.id)
      })
    )

    debug(`Shutdown Host (${fmtSrcHost}).`)

    try {
      await xapiSrc.shutdownHost(srcHost.id)
    } catch (error) {
      debug(`Unable to shutdown Host (${fmtSrcHost}). Error: ${error}`)
    }
  }
}
