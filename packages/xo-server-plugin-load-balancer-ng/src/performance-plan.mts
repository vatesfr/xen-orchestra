import { createLogger } from '@xen-orchestra/log'
import type { XoHost, XoVm } from '@vates/types'

import Plan, { computeWeightedPoolAverageCpu } from './plan.mjs'
import type { AveragesMap, Thresholds } from './types.mjs'

const log = createLogger('xo:load-balancer-ng:performance')

// ===================================================================
// Constants
// ===================================================================

const AGGRESSIVENESS_RATE = 1.5 // high-threshold ratio for preventive mode
const AGGRESSIVENESS_RATE_LOW = 1.25 // low-threshold ratio for preventive mode
const SIGNIFICANCE_THRESHOLD = 25 // skip preventive optimization for hosts below 25% CPU

// ===================================================================

function epsiEqual(a: number, b: number, epsi = 0.001): boolean {
  const absA = Math.abs(a)
  const absB = Math.abs(b)
  return Math.abs(a - b) <= Math.min(absA, absB) * epsi || (absA <= epsi && absB <= epsi)
}

// ===================================================================

export default class PerformancePlan extends Plan {
  protected override _checkResourcesThresholds(hosts: XoHost[], averages: AveragesMap): XoHost[] {
    return hosts.filter(host => {
      const avg = averages[host.id]
      if (avg === undefined) {
        return false
      }
      return avg.cpu >= this._thresholds.cpu.high || avg.memoryFree <= this._thresholds.memoryFree.high
    })
  }

  protected override _checkResourcesAverages(hosts: XoHost[], averages: AveragesMap, poolAverage: number): XoHost[] {
    return hosts.filter(host => {
      const avg = averages[host.id]
      if (avg === undefined) {
        return false
      }
      return avg.cpu / poolAverage >= AGGRESSIVENESS_RATE && avg.cpu >= SIGNIFICANCE_THRESHOLD
    })
  }

  async execute(): Promise<void> {
    // Power on halted hosts that support it
    const haltedHosts = this._getHosts({ powerState: 'Halted' }).filter(host => host.powerOnMode !== '')
    await Promise.allSettled(
      haltedHosts.map(host => {
        const xapi = this._xo.getXapi(host)
        return xapi.powerOnHost(host.id).catch((error: unknown) => {
          log.warn('Failed to power on host', { hostId: host.id, error })
        })
      })
    )

    // Step 1: affinity and anti-affinity rebalancing
    await this._processAffinity()
    await this._processAntiAffinity()

    const hosts = this._getHosts()

    // Step 2: optimize hosts that exceed CPU/memory thresholds
    const results = await this._getHostStatsAverages({ hosts, toOptimizeOnly: true })

    if (results !== undefined) {
      const { averages, toOptimize } = results

      // Sort descending so the most overloaded host is handled first
      toOptimize.sort((a, b) => -this._sortHosts(averages[a.id], averages[b.id]))

      for (const exceededHost of toOptimize) {
        const availableHosts = hosts.filter(h => h.id !== exceededHost.id)
        log.debug('Performance: trying to optimize host', {
          hostId: exceededHost.id,
          availableCount: availableHosts.length,
        })
        await this._optimize({ exceededHost, hosts: availableHosts, hostsAverages: averages })
      }
      return
    }

    // Step 3: preventive balancing (if enabled)
    if (this._performanceSubmode === 'preventive') {
      for (const poolId of this._poolIds) {
        const poolHosts = hosts.filter(h => h.$poolId === poolId)
        if (poolHosts.length <= 1) {
          continue
        }

        const poolResults = await this._getHostStatsAverages({
          hosts: poolHosts,
          toOptimizeOnly: true,
          checkAverages: true,
        })
        if (poolResults === undefined) {
          continue
        }

        const { averages, toOptimize, poolAverage } = poolResults
        const avg = poolAverage ?? computeWeightedPoolAverageCpu(averages)
        const thresholds: Pick<Thresholds, 'cpu'> & { memoryFree: Thresholds['memoryFree'] } = {
          cpu: {
            critical: this._thresholds.cpu.critical,
            high: avg * AGGRESSIVENESS_RATE,
            low: avg * AGGRESSIVENESS_RATE_LOW,
          },
          memoryFree: this._thresholds.memoryFree,
        }

        log.debug('Performance: preventive balancing', {
          poolId,
          poolAverage: avg,
          highThreshold: thresholds.cpu.high,
          lowThreshold: thresholds.cpu.low,
        })

        toOptimize.sort((a, b) => -this._sortHosts(averages[a.id], averages[b.id], thresholds))

        for (const exceededHost of toOptimize) {
          const availableHosts = poolHosts.filter(h => h.id !== exceededHost.id)
          await this._optimize({
            exceededHost,
            hosts: availableHosts,
            hostsAverages: averages,
            thresholds,
          })
        }
      }
      return
    }

    // Step 4: vCPU prepositioning (if enabled)
    if (this._performanceSubmode === 'vCpuPrepositioning') {
      for (const poolId of this._poolIds) {
        const poolHosts = hosts.filter(h => h.$poolId === poolId)
        if (poolHosts.length > 1) {
          await this._processVcpuPrepositioning(poolHosts)
        }
      }
    }
  }

  // ===================================================================
  // Helpers
  // ===================================================================

  private _getThresholdState(
    averages: { cpu: number; memoryFree: number } | undefined,
    thresholds: Pick<Thresholds, 'cpu' | 'memoryFree'> = this._thresholds
  ): { cpu: boolean; mem: boolean } {
    if (averages === undefined) {
      return { cpu: false, mem: false }
    }
    return {
      cpu: averages.cpu >= thresholds.cpu.high,
      mem: averages.memoryFree <= thresholds.memoryFree.high,
    }
  }

  /**
   * Compare two hosts by threshold state and resource usage.
   * Returns > 0 if a is more overloaded than b (a should be migrated first).
   */
  private _sortHosts(
    aAvg: { cpu: number; memoryFree: number } | undefined,
    bAvg: { cpu: number; memoryFree: number } | undefined,
    thresholds: Pick<Thresholds, 'cpu' | 'memoryFree'> = this._thresholds
  ): number {
    const aState = this._getThresholdState(aAvg, thresholds)
    const bState = this._getThresholdState(bAvg, thresholds)

    if (aAvg === undefined || bAvg === undefined) {
      return 0
    }

    // A. Same state — compare by raw usage
    if (aState.mem === bState.mem && aState.cpu === bState.cpu) {
      if (epsiEqual(aAvg.cpu, bAvg.cpu)) {
        return bAvg.memoryFree - aAvg.memoryFree
      }
      return aAvg.cpu - bAvg.cpu
    }

    // B. A has no limit OR B has both limits — A is less loaded
    if ((!aState.mem && !aState.cpu) || (bState.mem && bState.cpu)) {
      return -1
    }

    // C. B has no limit OR A has both limits — A is more loaded
    if ((!bState.mem && !bState.cpu) || (aState.mem && aState.cpu)) {
      return 1
    }

    // D. One limit each — prefer migrating from the CPU-overloaded host
    return !aState.cpu ? -1 : 1
  }

  private async _optimize({
    exceededHost,
    hosts,
    hostsAverages,
    thresholds = this._thresholds,
  }: {
    exceededHost: XoHost
    hosts: XoHost[]
    hostsAverages: AveragesMap
    thresholds?: Pick<Thresholds, 'cpu' | 'memoryFree'>
  }): Promise<void> {
    const runningVms = this._getAllRunningVms().filter(vm => vm.$container === exceededHost.id)
    const vmsAverages = await this._getVmsAverages(runningVms, { [exceededHost.id]: exceededHost })

    // Sort VMs: highest CPU first; break ties by memory
    const vms = [...runningVms].sort((a, b) => {
      const aAvg = vmsAverages[a.id]
      const bAvg = vmsAverages[b.id]
      if (aAvg === undefined || bAvg === undefined) {
        return 0
      }
      if (epsiEqual(aAvg.cpu, bAvg.cpu, 3)) {
        return bAvg.memory - aAvg.memory
      }
      return bAvg.cpu - aAvg.cpu
    })

    const exceededAvg = hostsAverages[exceededHost.id]
    if (exceededAvg === undefined) {
      return
    }

    const srcXapi = this._xo.getXapi(exceededHost)
    const promises: Promise<void>[] = []
    let optimizationCount = 0

    for (const vm of vms) {
      // Stop once we are below the low threshold
      if (exceededAvg.cpu <= thresholds.cpu.low && exceededAvg.memoryFree >= thresholds.memoryFree.low) {
        break
      }

      if (!this._canMigrateVm(vm)) {
        continue
      }

      // Skip VMs with affinity/anti-affinity tags — those are managed by their own pass
      const hasAffinityTag = vm.tags.some(t => this._affinityTags.includes(t))
      const hasAntiAffinityTag = vm.tags.some(t => this._antiAffinityTags.includes(t))
      if (hasAffinityTag || hasAntiAffinityTag) {
        log.debug('Performance: skipping VM with affinity/anti-affinity tag', {
          vmId: vm.id,
          hostId: exceededHost.id,
        })
        continue
      }

      // Pick best destination
      const sortedHosts = [...hosts].sort((a, b) => {
        if (a.$poolId !== b.$poolId) {
          if (a.$poolId === vm.$poolId) {
            return -1
          }
          if (b.$poolId === vm.$poolId) {
            return 1
          }
        }
        return this._sortHosts(hostsAverages[a.id], hostsAverages[b.id], thresholds)
      })

      const destination = sortedHosts[0]
      if (destination === undefined) {
        continue
      }

      const destinationAvg = hostsAverages[destination.id]
      const vmAvg = vmsAverages[vm.id]
      if (destinationAvg === undefined || vmAvg === undefined) {
        continue
      }

      const srcState = this._getThresholdState(exceededAvg, thresholds)

      // Reject migration if destination cannot absorb the VM or it makes things worse
      if (
        destinationAvg.cpu + vmAvg.cpu >= thresholds.cpu.low ||
        destinationAvg.memoryFree - vmAvg.memory <= thresholds.memoryFree.high ||
        (!srcState.cpu &&
          !srcState.mem &&
          (exceededAvg.cpu - vmAvg.cpu < destinationAvg.cpu + vmAvg.cpu ||
            exceededAvg.memoryFree + vmAvg.memory > destinationAvg.memoryFree - vmAvg.memory))
      ) {
        log.debug('Performance: cannot migrate VM (would not improve balance)', {
          vmId: vm.id,
          srcHostId: exceededHost.id,
          destHostId: destination.id,
        })
        continue
      }

      // Speculatively update averages
      exceededAvg.cpu -= vmAvg.cpu
      destinationAvg.cpu += vmAvg.cpu
      exceededAvg.memoryFree += vmAvg.memory
      destinationAvg.memoryFree -= vmAvg.memory

      log.debug('Performance: migrating VM', {
        vmId: vm.id,
        vmName: vm.name_label,
        srcHostId: exceededHost.id,
        destHostId: destination.id,
      })

      promises.push(this._migrateVm(vm, srcXapi, this._xo.getXapi(destination), destination))
      optimizationCount++
    }

    await Promise.all(promises)
    log.info('Performance: optimization complete', {
      hostId: exceededHost.id,
      migrations: optimizationCount,
    })
  }
}
