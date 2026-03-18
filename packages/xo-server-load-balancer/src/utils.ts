import { createLogger } from '@xen-orchestra/log'
import lodash from 'lodash'
const { map: mapToArray, size } = lodash

export const { debug, warn } = createLogger('xo:load-balancer')

// Delay between each resources evaluation in minutes.
// Must be less than MINUTES_OF_HISTORICAL_DATA.
export const EXECUTION_DELAY = 1

// ===================================================================
// Stats computation (exported for testing)
// ===================================================================

export interface ResourceAverages {
  cpu: number
  nCpus: number
  memoryFree: number
  memory: number
}

export type HostsStats = Record<
  string,
  { nPoints: number; stats: { cpus: number[][]; memoryFree: number[]; memory: number[] }; averages: object }
>

export function computeAverage(values: number[] | undefined, nPoints?: number): number | undefined {
  if (values === undefined) {
    return undefined
  }

  let sum = 0
  let tot = 0

  const { length } = values
  const start = nPoints !== undefined ? length - nPoints : 0

  for (let i = start; i < length; i++) {
    const value = values[i]

    sum += value || 0

    if (value) {
      tot += 1
    }
  }

  return sum / tot
}

export function computeResourcesAverage(
  objects: Array<{ id: string }>,
  objectsStats: Record<string, { stats: { cpus: number[][]; memoryFree: number[]; memory: number[] } }>,
  nPoints: number | undefined
): Record<string, ResourceAverages> {
  const averages: Record<string, ResourceAverages> = {}

  for (const object of objects) {
    const { id } = object
    const { stats } = objectsStats[id]

    averages[id] = {
      cpu: computeAverage(mapToArray(stats.cpus, cpu => computeAverage(cpu, nPoints)))!,
      nCpus: size(stats.cpus),
      memoryFree: computeAverage(stats.memoryFree, nPoints)!,
      memory: computeAverage(stats.memory, nPoints)!,
    }
  }

  return averages
}

export function computeResourcesAverageWithWeight(
  averages1: Record<string, ResourceAverages>,
  averages2: Record<string, ResourceAverages>,
  ratio: number
): Record<string, ResourceAverages> {
  const averages: Record<string, ResourceAverages> = {}

  for (const id in averages1) {
    const objectAverages = (averages[id] = {} as ResourceAverages)

    for (const averageName in averages1[id]) {
      const average1 = averages1[id][averageName as keyof ResourceAverages] as number | undefined
      if (average1 === undefined) {
        continue
      }

      ;(objectAverages as unknown as Record<string, number>)[averageName] =
        average1 * ratio + (averages2[id][averageName as keyof ResourceAverages] as number) * (1 - ratio)
    }
  }

  return averages
}

export function computeAverageCpu(hostsStats: Record<string, ResourceAverages>): number {
  const hostsStatsArray = Object.values(hostsStats)
  const totalNbCpus = hostsStatsArray.reduce((sum, host) => sum + host.nCpus, 0)
  const weightedSum = hostsStatsArray.reduce((sum, host) => sum + host.cpu * host.nCpus, 0)
  return totalNbCpus === 0 ? 0 : weightedSum / totalNbCpus
}

export function setRealCpuAverageOfVms(
  vms: Array<{ id: string }>,
  vmsAverages: Record<string, ResourceAverages>,
  nCpus: number
): void {
  for (const vm of vms) {
    const averages = vmsAverages[vm.id]
    averages.cpu *= averages.nCpus / nCpus
  }
}
