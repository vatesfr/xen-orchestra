import lodash from 'lodash'
const { clone, filter } = lodash

import Plan, { type Host, type Vm, type Pool } from './plan.js'
import { debug as debugP, type ResourceAverages } from './utils.js'

export const debug = (str: string) => debugP(`density: ${str}`)

// ===================================================================

export default class DensityPlan extends Plan {
  _checkResourcesThresholds(objects: Host[], averages: Record<string, ResourceAverages>): Host[] {
    const { low } = this._thresholds.memoryFree
    return filter(objects, object => {
      const avg = averages[object.id]
      const memoryFree = avg.memoryFree ?? avg.memory
      return memoryFree > low
    })
  }

  async _doExecute(): Promise<void> {
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

    for (const hostToOptimize of toOptimize!) {
      const { id: hostId, $poolId: poolId } = hostToOptimize

      const pool = pools[poolId] as Pool | undefined
      if (!pool) continue

      const { master: masterId } = pool

      if (masterId === hostId) {
        continue
      }

      if (hostToOptimize.powerOnMode === '') {
        debug(`Host (${hostId}) does not have a power on mode.`)
        continue
      }

      let poolMaster: Host | undefined
      const poolHosts: Host[] = []
      const masters: Host[] = []
      const otherHosts: Host[] = []

      for (const dest of hosts) {
        const { id: destId, $poolId: destPoolId } = dest

        if (destId === hostId) {
          continue
        }

        if (destPoolId === poolId) {
          if (destId === masterId) {
            poolMaster = dest
          } else {
            poolHosts.push(dest)
          }
        } else if (destId === (pools[destPoolId] as Pool | undefined)?.master) {
          masters.push(dest)
        } else {
          otherHosts.push(dest)
        }
      }

      const simulResults = await this._simulate({
        host: hostToOptimize,
        destinations: [[poolMaster as Host].filter(Boolean), poolHosts, masters, otherHosts],
        hostsAverages: clone(hostsAverages),
      })

      if (simulResults) {
        hostsAverages = simulResults.hostsAverages

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
    host: Host
    destinations: Host[][]
    hostsAverages: Record<string, ResourceAverages>
  }): Promise<{ hostsAverages: Record<string, ResourceAverages>; moves: Array<{ vm: Vm; destination: Host }> } | undefined> {
    const { id: hostId } = host

    debug(`Try to optimize Host (${hostId}).`)

    const vms = filter(this._getAllRunningVms(), vm => vm.$container === hostId)
    const vmsAverages = await this._getVmsAverages(vms, { [host.id]: host })

    for (const vm of vms) {
      if (!vm.xenTools) {
        debug(`VM (${vm.id}) of Host (${hostId}) does not support pool migration.`)
        return undefined
      }

      for (const tag of vm.tags) {
        if (this._affinityTags.includes(tag)) {
          debug(`VM (${vm.id}) of Host (${hostId}) cannot be migrated. It contains affinity tag '${tag}'.`)
          return undefined
        }
        if (this._antiAffinityTags.includes(tag)) {
          debug(`VM (${vm.id}) of Host (${hostId}) cannot be migrated. It contains anti-affinity tag '${tag}'.`)
          return undefined
        }
      }
    }

    vms.sort((a, b) => vmsAverages[b.id].memory - vmsAverages[a.id].memory)

    const simulResults: { hostsAverages: Record<string, ResourceAverages>; moves: Array<{ vm: Vm; destination: Host }> } = {
      hostsAverages,
      moves: [],
    }

    for (const vm of vms) {
      let move: { vm: Vm; destination: Host } | undefined

      for (const subDestinations of destinations) {
        move = this._testMigration({
          vm,
          destinations: subDestinations,
          hostsAverages,
          vmsAverages,
        })

        if (move) {
          simulResults.moves.push(move)
          break
        }
      }

      if (!move) {
        return undefined
      }
    }

    return simulResults
  }

  _testMigration({
    vm,
    destinations,
    hostsAverages,
    vmsAverages,
  }: {
    vm: Vm
    destinations: Host[]
    hostsAverages: Record<string, ResourceAverages>
    vmsAverages: Record<string, ResourceAverages>
  }): { vm: Vm; destination: Host } | undefined {
    const {
      _thresholds: {
        cpu: { critical: criticalThresholdCpu },
        memoryFree: { critical: criticalThresholdMemoryFree },
      },
    } = this

    destinations.sort((a, b) => hostsAverages[a.id].memoryFree - hostsAverages[b.id].memoryFree)

    for (const destination of destinations) {
      const destinationAverages = hostsAverages[destination.id]
      const vmAverages = vmsAverages[vm.id]

      if (
        destinationAverages.cpu + vmAverages.cpu >= criticalThresholdCpu ||
        destinationAverages.memoryFree - vmAverages.memory <= criticalThresholdMemoryFree
      ) {
        continue
      }

      destinationAverages.cpu += vmAverages.cpu
      destinationAverages.memoryFree -= vmAverages.memory

      return {
        vm,
        destination,
      }
    }

    return undefined
  }

  async _migrate(srcHost: Host, moves: Array<{ vm: Vm; destination: Host }>): Promise<void> {
    const fmtSrcHost = `${srcHost.id} "${srcHost.name_label}"`
    const xapiSrc = this.xo!.getXapi(srcHost.id)
    const results = await Promise.all(
      moves.map(({ vm, destination }) => {
        debug(
          `Migrate VM (${vm.id} "${vm.name_label}") to Host (${destination.id} "${destination.name_label}") from Host (${fmtSrcHost}).`
        )
        return this._migrateVm(vm, xapiSrc, destination)
      })
    )

    if (results.some(success => !success)) {
      debug(`Skipping shutdown of Host (${fmtSrcHost}) because one or more VM migrations failed.`)
      return
    }

    debug(`Shutdown Host (${fmtSrcHost}).`)

    try {
      await xapiSrc.shutdownHost(srcHost.id)
    } catch (error) {
      debug(`Unable to shutdown Host (${fmtSrcHost}). ${String(error)}`)
    }
  }
}
