import { createLogger } from '@xen-orchestra/log'
import type { XoHost, XoVm } from '@vates/types'

import Plan from './plan.mjs'
import type { AveragesMap, SimulationResult, VmMove } from './types.mjs'

const log = createLogger('xo:load-balancer-ng:density')

// ===================================================================

export default class DensityPlan extends Plan {
  protected override _checkResourcesThresholds(hosts: XoHost[], averages: AveragesMap): XoHost[] {
    const { low } = this._thresholds.memoryFree
    return hosts.filter(host => {
      const avg = averages[host.id]
      if (avg === undefined) {
        return false
      }
      return avg.memoryFree > low
    })
  }

  async execute(): Promise<void> {
    // Step 1: affinity and anti-affinity rebalancing
    await this._processAffinity()
    await this._processAntiAffinity()

    const hosts = this._getHosts()
    const results = await this._getHostStatsAverages({ hosts, toOptimizeOnly: true })
    if (results === undefined) {
      return
    }

    const { toOptimize } = results
    let hostsAverages = { ...results.averages }

    const pools = this._getPlanPools()
    let optimizationsCount = 0

    for (const hostToOptimize of toOptimize) {
      const { id: hostId, $poolId: poolId } = hostToOptimize
      const pool = pools[poolId]
      if (pool === undefined) {
        continue
      }

      const { master: masterId } = pool

      // Never try to drain the pool master
      if (masterId === hostId) {
        continue
      }

      // Host must support being powered off and back on
      if (hostToOptimize.powerOnMode === '') {
        log.debug('Density: host has no power-on mode, skipping', { hostId })
        continue
      }

      // Categorize remaining hosts for ordered destination preference
      let poolMaster: XoHost | undefined
      const poolHosts: XoHost[] = []
      const masters: XoHost[] = []
      const otherHosts: XoHost[] = []

      for (const dest of hosts) {
        if (dest.id === hostId) {
          continue
        }
        if (dest.$poolId === poolId) {
          if (dest.id === masterId) {
            poolMaster = dest
          } else {
            poolHosts.push(dest)
          }
        } else {
          const destPool = pools[dest.$poolId]
          if (destPool !== undefined && dest.id === destPool.master) {
            masters.push(dest)
          } else {
            otherHosts.push(dest)
          }
        }
      }

      // Destinations are tried in preference order:
      // 1. pool master, 2. other pool hosts, 3. other pool masters, 4. remaining hosts
      const destinationGroups: XoHost[][] = [
        poolMaster !== undefined ? [poolMaster] : [],
        poolHosts,
        masters,
        otherHosts,
      ]

      const simulResult = await this._simulate({
        host: hostToOptimize,
        destinations: destinationGroups,
        hostsAverages: { ...hostsAverages },
      })

      if (simulResult !== undefined) {
        hostsAverages = simulResult.hostsAverages
        await this._migrate(hostToOptimize, simulResult.moves)
        optimizationsCount++
      }
    }

    log.info('Density: optimization complete', { migrations: optimizationsCount })
  }

  // ===================================================================
  // Simulation
  // ===================================================================

  private async _simulate({
    host,
    destinations,
    hostsAverages,
  }: {
    host: XoHost
    destinations: XoHost[][]
    hostsAverages: AveragesMap
  }): Promise<SimulationResult | undefined> {
    const { id: hostId } = host
    log.debug('Density: simulating evacuation of host', { hostId })

    const vms = this._getAllRunningVms().filter(vm => vm.$container === hostId)
    const vmsAverages = await this._getVmsAverages(vms, { [hostId]: host })

    // All VMs must be migratable for us to proceed with this host
    for (const vm of vms) {
      if (!this._canMigrateVm(vm)) {
        log.debug('Density: VM not migratable, aborting simulation', { vmId: vm.id, hostId })
        return undefined
      }
      const hasAffinityTag = vm.tags.some(t => this._affinityTags.includes(t))
      const hasAntiAffinityTag = vm.tags.some(t => this._antiAffinityTags.includes(t))
      if (hasAffinityTag || hasAntiAffinityTag) {
        log.debug('Density: VM has affinity/anti-affinity tag, aborting simulation', { vmId: vm.id, hostId })
        return undefined
      }
    }

    // Sort VMs by memory descending — place the heaviest VMs first
    const sortedVms = [...vms].sort((a, b) => {
      const aAvg = vmsAverages[a.id]
      const bAvg = vmsAverages[b.id]
      return (bAvg?.memory ?? 0) - (aAvg?.memory ?? 0)
    })

    const moves: VmMove[] = []

    for (const vm of sortedVms) {
      let move: VmMove | undefined

      for (const subDestinations of destinations) {
        move = this._testMigration({ vm, destinations: subDestinations, hostsAverages, vmsAverages })
        if (move !== undefined) {
          moves.push(move)
          break
        }
      }

      if (move === undefined) {
        // Cannot find a destination for this VM → abort the whole host evacuation
        log.debug('Density: cannot find destination for VM, aborting host evacuation', { vmId: vm.id, hostId })
        return undefined
      }
    }

    return { hostsAverages, moves }
  }

  /**
   * Try to place `vm` on one of `destinations`. Mutates `hostsAverages` in-place on success.
   * Destinations are sorted by available free memory (ascending) so the least-loaded goes last.
   */
  private _testMigration({
    vm,
    destinations,
    hostsAverages,
    vmsAverages,
  }: {
    vm: XoVm
    destinations: XoHost[]
    hostsAverages: AveragesMap
    vmsAverages: AveragesMap
  }): VmMove | undefined {
    const {
      cpu: { critical: criticalCpu },
      memoryFree: { critical: criticalMem },
    } = this._thresholds

    // Sort ascending by free memory so that the most free host is tried last
    // (we mutate destinations so we sort a copy)
    const sorted = [...destinations].sort((a, b) => {
      const aAvg = hostsAverages[a.id]
      const bAvg = hostsAverages[b.id]
      return (aAvg?.memoryFree ?? 0) - (bAvg?.memoryFree ?? 0)
    })

    const vmAvg = vmsAverages[vm.id]
    if (vmAvg === undefined) {
      return undefined
    }

    for (const dest of sorted) {
      const destAvg = hostsAverages[dest.id]
      if (destAvg === undefined) {
        continue
      }

      if (destAvg.cpu + vmAvg.cpu >= criticalCpu || destAvg.memoryFree - vmAvg.memory <= criticalMem) {
        continue
      }

      // Destination can absorb the VM — speculatively update averages
      destAvg.cpu += vmAvg.cpu
      destAvg.memoryFree -= vmAvg.memory

      return { vm, destination: dest }
    }

    return undefined
  }

  // ===================================================================
  // Migration
  // ===================================================================

  private async _migrate(srcHost: XoHost, moves: VmMove[]): Promise<void> {
    const srcXapi = this._xo.getXapi(srcHost)

    await Promise.all(
      moves.map(({ vm, destination }) => {
        log.debug('Density: migrating VM', {
          vmId: vm.id,
          vmName: vm.name_label,
          srcHostId: srcHost.id,
          destHostId: destination.id,
        })
        return this._migrateVm(vm, srcXapi, this._xo.getXapi(destination), destination)
      })
    )

    log.info('Density: shutting down host after evacuation', { hostId: srcHost.id })

    // Only shut down in live mode (dry-run records the migrations but must not touch the host)
    if (!this._globalOptions.dryRun) {
      try {
        await srcXapi.shutdownHost(srcHost.id)
      } catch (error) {
        log.warn('Density: failed to shut down host', { hostId: srcHost.id, error })
      }
    }
  }
}
