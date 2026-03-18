import type { XoHost, XoPool, XoVm } from '@vates/types'

// ===================================================================
// Resource averages computed from RRD stats
// ===================================================================

export interface ResourceAverages {
  /** CPU usage as a fraction (0–1 range normalized per physical CPU) */
  cpu: number
  /** Number of virtual CPUs */
  nCpus: number
  /** Free memory in bytes */
  memoryFree: number
  /** Used memory in bytes */
  memory: number
}

export type AveragesMap = Record<string, ResourceAverages>

// ===================================================================
// Threshold configuration (cpu in %, memoryFree in bytes after conversion)
// ===================================================================

export interface ThresholdRange {
  /** Raw threshold value from configuration */
  critical: number
  /** HIGH_FACTOR * critical — triggers optimization */
  high: number
  /** LOW_FACTOR * critical — stops optimization */
  low: number
}

export interface Thresholds {
  cpu: ThresholdRange
  memoryFree: ThresholdRange
}

// ===================================================================
// Plan configuration options
// ===================================================================

export interface PlanThresholdsConfig {
  /** CPU threshold in percent (default: 90) */
  cpu?: number
  /** Free memory threshold in MB (default: 1000) */
  memoryFree?: number
}

export interface PlanOptions {
  excludedHosts?: XoHost['id'][]
  thresholds?: PlanThresholdsConfig
  /**
   * false → conservative (default)
   * 'preventive' → preventive balancing below threshold
   * true → vCPU prepositioning
   */
  balanceVcpus?: boolean | 'preventive'
  affinityTags?: string[]
  antiAffinityTags?: string[]
}

export type PerformanceSubmode = 'conservative' | 'preventive' | 'vCpuPrepositioning'

// ===================================================================
// Global options shared across all plans in a plugin instance
// ===================================================================

export interface GlobalOptions {
  /** VM tags that should never be migrated */
  ignoredVmTags: Set<string>
  /** Minimum time in ms before a VM can be migrated again */
  migrationCooldown: number
  /** vmId → timestamp of last migration */
  migrationHistory: Map<XoVm['id'], number>
  /** When true, _migrateVm records instead of executing */
  dryRun?: boolean
}

// ===================================================================
// Dry-run: proposed migration without execution
// ===================================================================

export interface ProposedMigration {
  vmId: XoVm['id']
  vmName: string
  srcHostId: XoHost['id']
  destHostId: XoHost['id']
}

// ===================================================================
// Internal structures for affinity/anti-affinity algorithms
// ===================================================================

export interface TaggedHost {
  id: XoHost['id']
  poolId: XoPool['id']
  /** Number of tagged VMs per tag */
  tags: Record<string, number>
  /** VMs on this host (subset relevant to the tag policy) */
  vms: Record<XoVm['id'], XoVm>
}

export interface TaggedHostsResult {
  tagCount: Record<string, number>
  hosts: TaggedHost[]
}

// ===================================================================
// Internal structure for vCPU prepositioning
// ===================================================================

export interface VcpuHost {
  id: XoHost['id']
  poolId: XoPool['id']
  cpuCount: number
  vcpuCount: number
  vms: Record<XoVm['id'], XoVm>
}

// ===================================================================
// Density plan simulation
// ===================================================================

export interface VmMove {
  vm: XoVm
  destination: XoHost
}

export interface SimulationResult {
  hostsAverages: AveragesMap
  moves: VmMove[]
}

// ===================================================================
// Return type from _getHostStatsAverages
// ===================================================================

export interface HostStatsAveragesResult {
  toOptimize: XoHost[]
  averages: AveragesMap
  poolAverage?: number
}

// ===================================================================
// Return type from _migrateOtherVms (affinity helper)
// ===================================================================

export interface MigrateOtherVmsResult {
  promises: Promise<void>[]
  success: boolean
}
