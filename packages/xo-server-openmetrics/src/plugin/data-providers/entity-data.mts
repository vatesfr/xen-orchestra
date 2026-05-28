/**
 * Entity data providers.
 *
 * Free functions that read XO in-memory objects (and, for `getXoMetrics`, a
 * few async XO APIs + the ELU sampler) and shape them into the IPC payloads
 * the child process requests on each scrape.
 *
 * Extracted verbatim from the corresponding `OpenMetricsPlugin` private
 * methods; the only changes are the mechanical substitutions
 * `this.#xo` → `xo`, `this.#getLabelLookupData()` → `getLabelLookupData(xo)`,
 * and the two ELU read-sites in `getXoMetrics`
 * (`this.#eluSamples` → `eluSampler.drainSamples()`,
 * `process.cpuUsage(this.#lastCpuUsage)` / `this.#lastCpuUsage = …`
 * → `eluSampler.cpuDelta()`).
 */

import type { XoApp, XoHost, XoPool, XoSr, XoVbd, XoVdi, XoVm } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import v8 from 'node:v8'

import type { HostCredentials } from '../../types/ipc.mjs'
import type {
  HostStatusItem,
  HostStatusPayload,
  SrDataItem,
  SrDataPayload,
  VdiDataItem,
  VdiDataPayload,
  VmStatusItem,
  VmStatusPayload,
  XapiCredentialsPayload,
  XoMetricsData,
  XoObject,
} from '../../types/domain.mjs'
import type { EluSampler } from '../elu-sampler.mjs'
import { getLabelLookupData } from './label-lookup.mjs'

const logger = createLogger('xo:xo-server-openmetrics')

/**
 * Get XAPI credentials for all hosts in all connected pools.
 * Returns host addresses, labels, pool info, and session IDs for the child process to fetch RRD data directly.
 */
export function getXapiCredentials(xo: XoApp): XapiCredentialsPayload {
  const hosts: HostCredentials[] = []

  // Build a map of poolId -> { sessionId, protocol }
  const poolSessionMap = new Map<string, { sessionId: string; protocol: string }>()
  const xapis = xo.getAllXapis()

  for (const serverId of Object.keys(xapis)) {
    const xapi = xapis[serverId]
    if (xapi === undefined || xapi.status !== 'connected') {
      continue
    }

    const pool = xapi.pool
    if (pool === undefined) {
      logger.warn('Pool is undefined for connected xapi', { serverId })
      continue
    }

    const url = xapi._url
    if (url === undefined) {
      logger.warn('URL is undefined for connected xapi', { serverId, poolUuid: pool.uuid })
      continue
    }

    poolSessionMap.set(pool.uuid, {
      sessionId: xapi.sessionId,
      protocol: url.protocol,
    })
  }

  // Get all pools to resolve pool labels
  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const poolLabelMap = new Map<string, string>()
  for (const pool of Object.values(allPools)) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  // Get all hosts from XO objects
  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

  for (const host of Object.values(allHosts)) {
    // Get the session info for this host's pool
    const poolInfo = poolSessionMap.get(host.$poolId)
    if (poolInfo === undefined) {
      logger.debug('No session for host pool, pool may be disconnected', {
        hostId: host.uuid,
        poolId: host.$poolId,
      })
      continue
    }

    hosts.push({
      hostId: host.uuid,
      hostAddress: host.address,
      hostLabel: host.name_label,
      poolId: host.$poolId,
      poolLabel: poolLabelMap.get(host.$poolId) ?? host.$poolId,
      sessionId: poolInfo.sessionId,
      protocol: poolInfo.protocol,
    })
  }

  logger.debug('Returning host credentials', { hostCount: hosts.length })
  return { hosts, labels: getLabelLookupData(xo) }
}

/**
 * Get SR data for capacity metrics.
 * Returns size, physical_usage, and virtual_allocation (usage) for all SRs.
 */
export function getSrData(xo: XoApp): SrDataPayload {
  const srs: SrDataItem[] = []

  // Get all pools to resolve pool labels
  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const poolLabelMap = new Map<string, string>()
  for (const pool of Object.values(allPools)) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  // Get all hosts to resolve host labels for local SRs
  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
  const hostLabelMap = new Map<string, string>()
  for (const host of Object.values(allHosts)) {
    hostLabelMap.set(host.id, host.name_label)
  }

  // Get all SRs
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>

  for (const sr of Object.values(allSrs)) {
    const srData: SrDataItem = {
      uuid: sr.uuid,
      name_label: sr.name_label,
      pool_id: sr.$poolId,
      pool_name: poolLabelMap.get(sr.$poolId) ?? '',
      sr_type: sr.SR_type ?? '',
      size: sr.size,
      physical_usage: sr.physical_usage,
      usage: sr.usage,
    }

    // For local (non-shared) SRs, add host information
    // $container is the host ID for local SRs, pool ID for shared SRs
    if (!sr.shared && sr.$container !== sr.$poolId) {
      const hostId = sr.$container as string
      srData.host_id = hostId
      srData.host_name = hostLabelMap.get(hostId)
    }

    srs.push(srData)
  }

  logger.debug('Returning SR data', { srCount: srs.length })
  return { srs }
}

/**
 * Get VDI data for disk size metrics.
 * Returns virtual size and physical usage for all VDIs (excluding snapshots and unmanaged).
 */
export function getVdiData(xo: XoApp): VdiDataPayload {
  const vdis: VdiDataItem[] = []

  // Get only the object types we need: SRs, VBDs, pools, VMs, VDIs
  const allSrs = xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>
  const allVbds = xo.getObjects({ filter: { type: 'VBD' } }) as Record<string, XoVbd>

  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const poolLabelMap = new Map<string, string>()
  for (const pool of Object.values(allPools)) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  // Build VM lookup for resolving attached VMs via VBDs
  const allVms = xo.getObjects({ filter: { type: 'VM' } }) as Record<string, XoVm>

  // Map VM id -> VM object for quick lookup
  const vmById = new Map<string, XoVm>()
  for (const vm of Object.values(allVms)) {
    vmById.set(vm.id, vm)
  }

  // Get all VDIs (excluding snapshots and unmanaged)
  const allVdis = xo.getObjects({ filter: { type: 'VDI' } }) as Record<string, XoVdi>

  for (const vdi of Object.values(allVdis)) {
    // Resolve SR
    const sr = allSrs[vdi.$SR]
    if (sr === undefined) {
      continue
    }

    const vdiData: VdiDataItem = {
      uuid: vdi.uuid,
      name_label: vdi.name_label,
      size: vdi.size,
      usage: vdi.usage,
      sr_uuid: sr.uuid,
      sr_name: sr.name_label,
      sr_type: sr.SR_type ?? '',
      pool_id: sr.$poolId,
      pool_name: poolLabelMap.get(sr.$poolId) ?? '',
    }

    // Resolve attached VM via VBDs (use first found VM)
    for (const vbdId of vdi.$VBDs) {
      const vbd = allVbds[vbdId]
      if (vbd !== undefined) {
        const vm = vmById.get(vbd.VM)
        if (vm !== undefined) {
          vdiData.vm_uuid = vm.uuid
          vdiData.vm_name = vm.name_label
          break
        }
      }
    }

    vdis.push(vdiData)
  }

  logger.debug('Returning VDI data', { vdiCount: vdis.length })
  return { vdis }
}

/**
 * Get host status data for all hosts.
 * Returns power_state and enabled for every host, including non-running ones.
 */
export function getHostStatusData(xo: XoApp): HostStatusPayload {
  const hosts: HostStatusItem[] = []

  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const poolLabelMap = new Map<string, string>()
  for (const pool of Object.values(allPools)) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  const allHosts = xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

  for (const host of Object.values(allHosts)) {
    hosts.push({
      uuid: host.uuid,
      name_label: host.name_label,
      power_state: host.power_state,
      enabled: host.enabled,
      pool_id: host.$poolId,
      pool_name: poolLabelMap.get(host.$poolId) ?? '',
    })
  }

  logger.debug('Returning host status data', { hostCount: hosts.length })
  return { hosts }
}

/**
 * Get VM status data for all VMs (excluding VM-controllers / dom0).
 * Returns power_state for every VM.
 */
export function getVmStatusData(xo: XoApp): VmStatusPayload {
  const vms: VmStatusItem[] = []

  const allPools = xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
  const poolLabelMap = new Map<string, string>()
  for (const pool of Object.values(allPools)) {
    poolLabelMap.set(pool.uuid, pool.name_label)
  }

  const allVms = xo.getObjects({ filter: { type: 'VM' } }) as Record<string, XoVm>

  for (const vm of Object.values(allVms)) {
    vms.push({
      uuid: vm.uuid,
      name_label: vm.name_label,
      power_state: vm.power_state,
      pool_id: vm.$poolId,
      pool_name: poolLabelMap.get(vm.$poolId) ?? '',
    })
  }

  logger.debug('Returning VM status data', { vmCount: vms.length })
  return { vms }
}

/**
 * Collect XO management plane metrics.
 * Gathers counts and stats from XO objects and XO APIs.
 */
export async function getXoMetrics(xo: XoApp, eluSampler: EluSampler): Promise<XoMetricsData> {
  const allObjects = xo.getObjects() as Record<string, XoObject>

  let poolCount = 0
  let hostCount = 0
  let vmCount = 0
  let socketCount = 0
  let pendingTask = 0
  for await (const _taskLog of xo.tasks.list({ filter: _ => _.status === 'pending' })) {
    pendingTask++
  }
  const srCountByContentType: Record<string, number> = {}
  const hostVersionMap = new Map<string, number>()
  const hostLicenseMap = new Map<string, number>()

  for (const obj of Object.values(allObjects)) {
    switch (obj.type) {
      case 'pool':
        poolCount++
        break
      case 'host': {
        const host = obj as XoHost
        hostCount++
        socketCount += (host.cpus as { sockets?: number } | undefined)?.sockets ?? 0

        const versionKey = `${host.productBrand ?? ''}::${host.version ?? ''}`
        hostVersionMap.set(versionKey, (hostVersionMap.get(versionKey) ?? 0) + 1)

        const skuType = (host.license_params as Record<string, string> | undefined)?.sku_type ?? '?'
        hostLicenseMap.set(skuType, (hostLicenseMap.get(skuType) ?? 0) + 1)
        break
      }
      case 'VM':
        vmCount++
        break
      case 'SR': {
        const contentType = (obj as unknown as Record<string, string>).content_type ?? 'unknown'
        srCountByContentType[contentType] = (srCountByContentType[contentType] ?? 0) + 1
        break
      }
    }
  }

  const hostCountByVersion = [...hostVersionMap.entries()].map(([key, count]) => {
    const [productBrand = '', version = ''] = key.split('::')
    return { productBrand, version, count }
  })

  const hostCountByLicense = [...hostLicenseMap.entries()].map(([skuType, count]) => ({ skuType, count }))

  let userCount = 0
  try {
    const users = await xo.getAllUsers()
    userCount = users.length
  } catch (err) {
    logger.warn('Failed to get users for XO metrics', { error: err })
  }

  let groupCount = 0
  try {
    const groups = await xo.getAllGroups()
    groupCount = groups.length
  } catch (err) {
    logger.warn('Failed to get groups for XO metrics', { error: err })
  }

  const backupJobStats: XoMetricsData['backupJobStats'] = []
  try {
    const jobs = await xo.getAllJobs()

    const jobCountByKey = new Map<string, number>()
    for (const job of jobs) {
      const key = (job as Record<string, unknown>).key as string | undefined
      if (key === undefined || key === 'genericTask') continue
      jobCountByKey.set(key, (jobCountByKey.get(key) ?? 0) + 1)
    }

    for (const [type, jobCount] of jobCountByKey) {
      backupJobStats.push({ type, jobCount })
    }
  } catch (err) {
    logger.warn('Failed to get backup job stats for XO metrics', { error: err })
  }

  // Node.js process metrics
  const samples = eluSampler.drainSamples()
  let eluMean = 0
  let eluP99 = 0
  let eluMax = 0
  if (samples.length > 0) {
    const sorted = [...samples].sort((a, b) => a - b)
    eluMean = samples.reduce((sum, v) => sum + v, 0) / samples.length
    eluMax = sorted[sorted.length - 1]!
    eluP99 = sorted[Math.max(0, Math.ceil(0.99 * sorted.length) - 1)]!
  }

  const cpuDelta = eluSampler.cpuDelta()
  const mem = process.memoryUsage()
  const heapStats = v8.getHeapStatistics()

  logger.debug('XO metrics collected', { poolCount, hostCount, vmCount, userCount, groupCount })

  return {
    pendingTaskCount: pendingTask,
    poolCount,
    hostCount,
    vmCount,
    srCountByContentType,
    userCount,
    groupCount,
    socketCount,
    hostCountByVersion,
    hostCountByLicense,
    backupJobStats,
    nodeProcess: {
      eluMean,
      eluP99,
      eluMax,
      memoryRssBytes: mem.rss,
      memoryHeapUsedBytes: mem.heapUsed,
      memoryHeapTotalBytes: mem.heapTotal,
      memoryExternalBytes: mem.external,
      memoryArrayBuffersBytes: mem.arrayBuffers,
      heapSizeLimitBytes: heapStats.heap_size_limit,
      heapAvailableBytes: heapStats.total_available_size,
      detachedContexts: heapStats.number_of_detached_contexts,
      cpuUserSeconds: cpuDelta.user / 1_000_000,
      cpuSystemSeconds: cpuDelta.system / 1_000_000,
    },
  }
}
