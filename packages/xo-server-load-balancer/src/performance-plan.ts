import lodash from 'lodash'
const { filter, intersection } = lodash

import Plan, { type Host, type Vm, type Xo, type GlobalOptions, type ConcurrencyLimiter, type PlanOptions, type Xapi, type Thresholds } from './plan.js'
import { debug as debugP, type ResourceAverages } from './utils.js'

export const debug = (str: string) => debugP(`performance: ${str}`)

function epsiEqual(a: number, b: number, epsi = 0.001): boolean {
  const absA = Math.abs(a)
  const absB = Math.abs(b)
  return Math.abs(a - b) <= Math.min(absA, absB) * epsi || (absA <= epsi && absB <= epsi)
}

// Constants for below-thresholds optimization
const AGGRESSIVENESS_RATE = 1.5
const AGGRESSIVENESS_RATE_LOW = 1.25
const SIGNIFICANCE_THRESHOLD = 25

// ===================================================================

export default class PerformancePlan extends Plan {
  _checkResourcesThresholds(objects: Host[], averages: Record<string, ResourceAverages>): Host[] {
    return filter(objects, object => {
      const objectAverages = averages[object.id]

      return (
        objectAverages.cpu >= this._thresholds.cpu.high ||
        objectAverages.memoryFree <= this._thresholds.memoryFree.high
      )
    })
  }

  _checkResourcesAverages(
    objects: Host[],
    averages: Record<string, ResourceAverages>,
    poolAverage: number
  ): Host[] {
    return filter(objects, object => {
      const objectAverages = averages[object.id]
      return objectAverages.cpu / poolAverage >= AGGRESSIVENESS_RATE && objectAverages.cpu >= SIGNIFICANCE_THRESHOLD
    })
  }

  async _doExecute(): Promise<void> {
    try {
      await Promise.all(
        filter(this._getHosts({ powerState: 'Halted' }), host => host.powerOnMode !== '').map(host => {
          const { id } = host
          return (this.xo!.getXapi(id) as Xapi & { powerOnHost: (id: string) => Promise<void> }).powerOnHost(id)
        })
      )
    } catch (error) {
      console.error(error)
    }

    await this._processAffinity()
    await this._processAntiAffinity()

    const hosts = this._getHosts()
    const results = await this._getHostStatsAverages({
      hosts,
      toOptimizeOnly: true,
    })

    if (results) {
      const { averages, toOptimize } = results
      toOptimize!.sort((a, b) => -this._sortHosts(averages[a.id], averages[b.id]))
      for (const exceededHost of toOptimize!) {
        const { id } = exceededHost

        debug(`Try to optimize Host (${exceededHost.id}).`)
        const availableHosts = filter(hosts, host => host.id !== id)
        debug(`Available destinations: ${availableHosts.map(host => host.id)}.`)

        await this._optimize({
          exceededHost,
          hosts: availableHosts,
          hostsAverages: averages,
        })
      }
    } else {
      if (this._performanceSubmode === 'preventive') {
        for (const poolId of this._poolIds) {
          const poolHosts = filter(hosts, host => host.$poolId === poolId)
          if (poolHosts.length <= 1) {
            continue
          }
          const poolResults = await this._getHostStatsAverages({
            hosts: poolHosts,
            toOptimizeOnly: true,
            checkAverages: true,
          })
          if (poolResults) {
            const { averages, toOptimize, poolAverage } = poolResults
            const thresholds = {
              cpu: { high: poolAverage! * AGGRESSIVENESS_RATE, low: poolAverage! * AGGRESSIVENESS_RATE_LOW, critical: this._thresholds.cpu.critical },
              memoryFree: this._thresholds.memoryFree,
            }
            debug(`Balancing below threshold on pool ${poolId} ; `)
            debug(
              `Pool average CPU : ${poolAverage} ; High threshold: ${thresholds.cpu.high} ; Low threshold: ${thresholds.cpu.low}`
            )
            toOptimize!.sort((a, b) => -this._sortHosts(averages[a.id], averages[b.id], thresholds))
            for (const exceededHost of toOptimize!) {
              const availableHosts = filter(poolHosts, host => host.id !== exceededHost.id)
              debug(`Try to optimize Host (${exceededHost.id}).`)
              debug(`Available destinations: ${availableHosts.map(host => host.id)}.`)

              await this._optimize({
                exceededHost,
                hosts: availableHosts,
                hostsAverages: averages,
                thresholds,
              })
            }
          }
        }
      }

      if (this._performanceSubmode === 'vCpuPrepositioning') {
        for (const poolId of this._poolIds) {
          const poolHosts = filter(hosts, host => host.$poolId === poolId)
          if (poolHosts.length > 1) {
            await this._processVcpuPrepositioning(poolHosts)
          }
        }
      }
    }
  }

  _getThresholdState(
    averages: ResourceAverages,
    thresholds = this._thresholds
  ): { cpu: boolean; mem: boolean } {
    return {
      cpu: averages.cpu >= thresholds.cpu.high,
      mem: averages.memoryFree <= thresholds.memoryFree.high,
    }
  }

  _sortHosts(
    aAverages: ResourceAverages,
    bAverages: ResourceAverages,
    thresholds = this._thresholds
  ): number {
    const aState = this._getThresholdState(aAverages, thresholds)
    const bState = this._getThresholdState(bAverages, thresholds)

    if (aState.mem === bState.mem && aState.cpu === bState.cpu) {
      if (epsiEqual(aAverages.cpu, bAverages.cpu)) {
        return bAverages.memoryFree - aAverages.memoryFree
      }
      return aAverages.cpu - bAverages.cpu
    }

    if ((!aState.mem && !aState.cpu) || (bState.mem && bState.cpu)) {
      return -1
    }

    if ((!bState.mem && !bState.cpu) || (aState.mem && aState.cpu)) {
      return 1
    }

    return !aState.cpu ? -1 : 1
  }

  async _optimize({
    exceededHost,
    hosts,
    hostsAverages,
    thresholds = this._thresholds,
  }: {
    exceededHost: Host
    hosts: Host[]
    hostsAverages: Record<string, ResourceAverages>
    thresholds?: Thresholds
  }): Promise<void> {
    const vms = filter(this._getAllRunningVms(), vm => vm.$container === exceededHost.id)
    const vmsAverages = await this._getVmsAverages(vms, { [exceededHost.id]: exceededHost })

    vms.sort((a, b) => {
      const aAverages = vmsAverages[a.id]
      const bAverages = vmsAverages[b.id]

      if (epsiEqual(aAverages.cpu, bAverages.cpu, 3)) {
        return bAverages.memory - aAverages.memory
      }
      return bAverages.cpu - aAverages.cpu
    })

    const exceededAverages = hostsAverages[exceededHost.id]

    const xapiSrc = this.xo!.getXapi(exceededHost)
    let optimizationCount = 0

    const fmtSrcHost = `${exceededHost.id} "${exceededHost.name_label}"`
    for (const vm of vms) {
      if (exceededAverages.cpu <= thresholds.cpu.low && exceededAverages.memoryFree >= thresholds.memoryFree.low) {
        break
      }

      if (!vm.xenTools) {
        debug(`VM (${vm.id}) of Host (${exceededHost.id}) does not support pool migration.`)
        continue
      }

      if (this._isVmInCooldown(vm)) {
        debug(`VM (${vm.id}) of Host (${exceededHost.id}) is in cooldown, skipping.`)
        continue
      }

      const blockingAffinityTags = intersection(vm.tags, this._affinityTags)
      if (blockingAffinityTags.length > 0) {
        debug(
          `VM (${vm.id}) of Host (${exceededHost.id}) cannot be migrated. It contains affinity tag(s): ${blockingAffinityTags}.`
        )
        continue
      }
      const blockingAntiAffinityTags = intersection(vm.tags, this._antiAffinityTags)
      if (blockingAntiAffinityTags.length > 0) {
        debug(
          `VM (${vm.id}) of Host (${exceededHost.id}) cannot be migrated. It contains anti-affinity tag(s): ${blockingAntiAffinityTags}.`
        )
        continue
      }

      hosts.sort((a, b) => {
        if (a.$poolId !== b.$poolId) {
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

      const state = this._getThresholdState(exceededAverages, thresholds)
      if (
        destinationAverages.cpu + vmAverages.cpu >= thresholds.cpu.low ||
        destinationAverages.memoryFree - vmAverages.memory <= thresholds.memoryFree.high ||
        (!state.cpu &&
          !state.mem &&
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

      const migrated = await this._migrateVm(vm, xapiSrc, destination)
      if (migrated) {
        optimizationCount++
      } else {
        exceededAverages.cpu += vmAverages.cpu
        destinationAverages.cpu -= vmAverages.cpu
        exceededAverages.memoryFree -= vmAverages.memory
        destinationAverages.memoryFree += vmAverages.memory
      }
    }

    debug(`Performance mode: ${optimizationCount} optimizations for Host (${fmtSrcHost}).`)
  }
}
