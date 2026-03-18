import type { XoVm } from '@vates/types'

export interface VmLoadBalancerTags {
  ignore: boolean
  affinityGroups: Set<string>
  antiAffinityGroups: Set<string>
}

export interface LoadBalancePlan {
  mode: 'performance' | 'density' | 'simple'
  thresholds?: {
    memoryFree?: number
  }
}

export interface LoadBalanceParams {
  plan: LoadBalancePlan
  dryRun?: boolean
}

export type MigrationPlan = Record<string, string>

export interface XapiClient {
  call(method: string, ...args: unknown[]): Promise<unknown>
  callAsync(method: string, ...args: unknown[]): Promise<unknown>
}
