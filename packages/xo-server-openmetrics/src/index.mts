/**
 * XO Server OpenMetrics Plugin
 *
 * This plugin exposes XO metrics in OpenMetrics/Prometheus format.
 * It spawns a child process that runs an HTTP server and fetches
 * RRD data directly from connected XAPI pools.
 */

import type {
  XoApp,
  XoHost,
  XoNetwork,
  XoPif,
  XoPool,
  XoSr,
  XoVbd,
  XoVdi,
  XoVif,
  XoVm,
  XoVmController,
} from '@vates/types'
import { createLogger } from '@xen-orchestra/log'
import { fork, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRandomValues } from 'node:crypto'

// ============================================================================
// Types
// ============================================================================

interface IpcMessage {
  type: string
  payload?: unknown
  requestId?: string
  error?: string
}

interface PluginConfiguration {
  secret: string
}

interface ServerConfiguration {
  port: number
  bindAddress: string
  secret: string
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

interface HostCredentials {
  hostId: string
  hostAddress: string
  hostLabel: string
  poolId: string
  poolLabel: string
  sessionId: string
  protocol: string
}

// Label lookup types for enriching metrics with human-readable names
export interface VmLabelInfo {
  name_label: string
  is_control_domain: boolean
  vbdDeviceToVdiName: Record<string, string> // { "xvda": "System Disk" }
  vbdDeviceToVdiUuid: Record<string, XoVdi['uuid']> // { "xvda": "vdi-uuid-123" }
  vifIndexToNetworkName: Record<string, string> // { "0": "Pool-wide network" }
}

export interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string> // { "eth0": "Management" }
  startTime: number | null // Unix timestamp of host boot (from host.startTime)
}

export interface SrLabelInfo {
  name_label: string
}

export interface LabelLookupData {
  vms: Record<XoVm['uuid'] | XoVmController['uuid'], VmLabelInfo>
  hosts: Record<XoHost['uuid'], HostLabelInfo>
  srs: Record<XoSr['uuid'], SrLabelInfo>
  srSuffixToUuid: Record<string, XoSr['uuid']> // maps UUID suffix to full SR UUID
  vdiUuidToSrUuid: Record<XoVdi['uuid'], XoSr['uuid']> // maps VDI UUID to parent SR UUID
}

interface XapiCredentialsPayload {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

export type SrDataItem = Pick<XoSr, 'uuid' | 'name_label' | 'size' | 'physical_usage' | 'usage'> & {
  pool_id: string
  pool_name: string
  host_id?: string
  host_name?: string
}

interface SrDataPayload {
  srs: SrDataItem[]
}

export type HostStatusItem = Pick<XoHost, 'uuid' | 'name_label' | 'power_state' | 'enabled'> & {
  pool_id: string
  pool_name: string
}

interface HostStatusPayload {
  hosts: HostStatusItem[]
}

// Union type for all XO objects we handle
type XoObject = XoHost | XoPool | XoVm | XoVmController | XoVbd | XoVdi | XoVif | XoPif | XoSr | XoNetwork

// ============================================================================
// Constants
// ============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const logger = createLogger('xo:xo-server-openmetrics')

/** Default port for the OpenMetrics HTTP server */
const DEFAULT_PORT = 9004

/** Default bind address for the OpenMetrics HTTP server */
const DEFAULT_BIND_ADDRESS = '127.0.0.1'

/** Default timeout for IPC operations in milliseconds */
const IPC_TIMEOUT_MS = 10_000

/** Default timeout for graceful shutdown in milliseconds */
const SHUTDOWN_TIMEOUT_MS = 5_000

// ============================================================================
// Configuration Schema (exported for xo-server)
// ============================================================================

export const configurationSchema = {
  type: 'object',
  properties: {
    secret: {
      type: 'string',
      title: 'Prometheus secret',
      description: 'Add this secret to http_config > authorization > credentials, and set type to Bearer',
      default: Buffer.from(getRandomValues(new Uint32Array(8))).toString('hex'),
    },
  },
  additionalProperties: false,
}

// ============================================================================
// Plugin Class
// ============================================================================

class OpenMetricsPlugin {
  #configuration: PluginConfiguration | undefined
  #childProcess: ChildProcess | undefined
  #pendingRequests = new Map<string, PendingRequest>()
  #requestIdCounter = 0
  readonly #xo: XoApp

  constructor(xo: XoApp) {
    this.#xo = xo
    logger.info('Plugin initialized')
  }

  /**
   * Configure the plugin with the provided configuration.
   */
  async configure(configuration: PluginConfiguration): Promise<void> {
    this.#configuration = configuration
    logger.debug('Plugin configured')
  }

  /**
   * Load and start the plugin.
   * Forks the child process and waits for it to be ready.
   */
  async load(): Promise<void> {
    await this.#xo.checkFeatureAuthorization('PLUGIN.OPENMETRICS')
    if (this.#childProcess !== undefined) {
      logger.warn('Plugin already loaded, skipping')
      return
    }

    // Port and bindAddress are fixed for security (server is behind xo-server proxy)
    const serverConfig: ServerConfiguration = {
      port: DEFAULT_PORT,
      bindAddress: DEFAULT_BIND_ADDRESS,
      secret: this.#configuration?.secret ?? '',
    }

    logger.info('Starting OpenMetrics server', {
      port: serverConfig.port,
      bindAddress: serverConfig.bindAddress,
    })

    await this.#startChildProcess(serverConfig)
  }

  /**
   * Unload and stop the plugin.
   * Gracefully shuts down the child process.
   */
  async unload(): Promise<void> {
    if (this.#childProcess === undefined) {
      return
    }

    logger.info('Stopping OpenMetrics server')

    await this.#stopChildProcess()
  }

  /**
   * Start the child process and wait for it to be ready.
   */
  async #startChildProcess(configuration: ServerConfiguration): Promise<void> {
    const serverPath = join(__dirname, 'open-metric-server.mjs')

    this.#childProcess = fork(serverPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    })

    const child = this.#childProcess

    child.on('message', (message: unknown) => this.#handleChildMessage(message))

    child.on('error', (error: Error) => {
      logger.error('Child process error', { error })
    })

    child.on('exit', (code: number | null, signal: string | null) => {
      logger.info('Child process exited', { code, signal })
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error(`Child process exited with code ${code}`))
    })

    if (child.stdout !== null) {
      child.stdout.on('data', (data: Buffer) => {
        logger.debug('Child stdout', { data: data.toString() })
      })
    }

    if (child.stderr !== null) {
      child.stderr.on('data', (data: Buffer) => {
        logger.warn('Child stderr', { data: data.toString() })
      })
    }

    this.#sendToChild({ type: 'INIT', payload: configuration })

    await this.#waitForReady()
  }

  /**
   * Stop the child process gracefully.
   */
  async #stopChildProcess(): Promise<void> {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    try {
      this.#sendToChildNoWait({ type: 'SHUTDOWN' })

      await new Promise<void>(resolve => {
        const timeout = setTimeout(() => {
          logger.warn('Child process did not exit gracefully, forcing kill')
          child.kill('SIGKILL')
          resolve()
        }, SHUTDOWN_TIMEOUT_MS)

        child.once('exit', () => {
          clearTimeout(timeout)
          resolve()
        })
      })
    } catch (error) {
      logger.error('Error stopping child process', { error })
      child.kill('SIGKILL')
    } finally {
      this.#childProcess = undefined
      this.#rejectAllPendingRequests(new Error('Plugin unloaded'))
    }
  }

  /**
   * Handle messages received from the child process.
   */
  #handleChildMessage(rawMessage: unknown): void {
    const message = rawMessage as IpcMessage

    logger.debug('Received message from child', { type: message.type })

    switch (message.type) {
      case 'READY':
        this.#resolvePendingRequest('READY', undefined)
        break

      case 'ERROR':
        // ERROR is only sent during initialization when the child process fails to start
        // (e.g., unable to bind to port). At this point, load() is waiting for READY,
        // so we reject that pending request to propagate the failure.
        logger.error('Child process error', { error: message.error })
        this.#rejectPendingRequest('READY', new Error(String(message.error)))
        break

      case 'GET_XAPI_CREDENTIALS': {
        const credentials = this.#getXapiCredentials()
        this.#sendToChildNoWait({
          type: 'XAPI_CREDENTIALS',
          requestId: message.requestId,
          payload: credentials,
        })
        break
      }

      case 'GET_SR_DATA': {
        const srData = this.#getSrData()
        this.#sendToChildNoWait({
          type: 'SR_DATA',
          requestId: message.requestId,
          payload: srData,
        })
        break
      }

      case 'GET_HOST_STATUS': {
        const hostStatus = this.#getHostStatusData()
        this.#sendToChildNoWait({
          type: 'HOST_STATUS',
          requestId: message.requestId,
          payload: hostStatus,
        })
        break
      }

      default:
        logger.warn('Unknown message type from child', { type: message.type })
    }
  }

  /**
   * Get XAPI credentials for all hosts in all connected pools.
   * Returns host addresses, labels, pool info, and session IDs for the child process to fetch RRD data directly.
   */
  #getXapiCredentials(): XapiCredentialsPayload {
    const hosts: HostCredentials[] = []

    // Build a map of poolId -> { sessionId, protocol }
    const poolSessionMap = new Map<string, { sessionId: string; protocol: string }>()
    const xapis = this.#xo.getAllXapis()

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
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Get all hosts from XO objects
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

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
    return { hosts, labels: this.#getLabelLookupData() }
  }

  /**
   * Get SR data for capacity metrics.
   * Returns size, physical_usage, and virtual_allocation (usage) for all SRs.
   */
  #getSrData(): SrDataPayload {
    const srs: SrDataItem[] = []

    // Get all pools to resolve pool labels
    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    // Get all hosts to resolve host labels for local SRs
    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>
    const hostLabelMap = new Map<string, string>()
    for (const host of Object.values(allHosts)) {
      hostLabelMap.set(host.id, host.name_label)
    }

    // Get all SRs
    const allSrs = this.#xo.getObjects({ filter: { type: 'SR' } }) as Record<string, XoSr>

    for (const sr of Object.values(allSrs)) {
      const srData: SrDataItem = {
        uuid: sr.uuid,
        name_label: sr.name_label,
        pool_id: sr.$poolId,
        pool_name: poolLabelMap.get(sr.$poolId) ?? '',
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
   * Get host status data for all hosts.
   * Returns power_state and enabled for every host, including non-running ones.
   */
  #getHostStatusData(): HostStatusPayload {
    const hosts: HostStatusItem[] = []

    const allPools = this.#xo.getObjects({ filter: { type: 'pool' } }) as Record<string, XoPool>
    const poolLabelMap = new Map<string, string>()
    for (const pool of Object.values(allPools)) {
      poolLabelMap.set(pool.uuid, pool.name_label)
    }

    const allHosts = this.#xo.getObjects({ filter: { type: 'host' } }) as Record<string, XoHost>

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
   * Get label lookup data for enriching metrics with human-readable names.
   * Gathers VM, Host, SR, VDI, VIF, PIF, and Network labels.
   */
  #getLabelLookupData(): LabelLookupData {
    const labels: LabelLookupData = {
      vms: {},
      hosts: {},
      srs: {},
      srSuffixToUuid: {},
      vdiUuidToSrUuid: {},
    }

    // Get all objects and categorize them by type in a single pass
    const allObjects = this.#xo.getObjects() as Record<XoObject['id'], XoObject>

    const vms: (XoVm | XoVmController)[] = []
    const hosts: XoHost[] = []
    const srs: XoSr[] = []
    const vbds: XoVbd[] = []
    const vdis: XoVdi[] = []
    const vifs: XoVif[] = []
    const pifs: XoPif[] = []
    const networks: XoNetwork[] = []

    for (const obj of Object.values(allObjects)) {
      switch (obj.type) {
        case 'VM':
        case 'VM-controller':
          vms.push(obj)
          break
        case 'host':
          hosts.push(obj)
          break
        case 'SR':
          srs.push(obj)
          break
        case 'VBD':
          vbds.push(obj)
          break
        case 'VDI':
          vdis.push(obj)
          break
        case 'VIF':
          vifs.push(obj)
          break
        case 'PIF':
          pifs.push(obj)
          break
        case 'network':
          networks.push(obj)
          break
      }
    }

    // Build network name map (id -> name_label)
    const networkNameById = new Map<XoNetwork['id'], string>()
    for (const network of networks) {
      networkNameById.set(network.id, network.name_label)
    }

    // Build VDI name map (uuid -> name_label) and VDI UUID to SR UUID map
    // Note: vdi.id === vdi.uuid for VDI objects
    const vdiNameByUuid = new Map<XoVdi['uuid'], string>()
    for (const vdi of vdis) {
      vdiNameByUuid.set(vdi.uuid, vdi.name_label)
      // Build VDI UUID -> SR UUID mapping
      if (vdi.$SR !== undefined) {
        const srObj = allObjects[vdi.$SR]
        if (srObj !== undefined && srObj.type === 'SR') {
          labels.vdiUuidToSrUuid[vdi.uuid] = srObj.uuid
        }
      }
    }

    // Build VBD map (VM id -> device -> VDI info)
    // Note: vbd.VDI is already the VDI UUID (id === uuid for VDI objects)
    const vbdMap = new Map<XoVbd['VM'], Map<string, { name: string; uuid: string }>>()
    for (const vbd of vbds) {
      if (vbd.device === null || vbd.device === '' || vbd.VDI == null) continue

      let vmVbds = vbdMap.get(vbd.VM)
      if (vmVbds === undefined) {
        vmVbds = new Map<string, { name: string; uuid: string }>()
        vbdMap.set(vbd.VM, vmVbds)
      }

      const vdiUuid = vbd.VDI
      const vdiName = vdiNameByUuid.get(vdiUuid)
      if (vdiName !== undefined) {
        vmVbds.set(vbd.device, { name: vdiName, uuid: vdiUuid })
      }
    }

    // Build VIF map (VM id -> vif index -> network name)
    const vifMap = new Map<XoVm['id'] | XoVmController['id'], Map<string, string>>()
    for (const vif of vifs) {
      // VIF device is the index (0, 1, 2...)
      if (vif.$VM === undefined) continue

      let vmVifs = vifMap.get(vif.$VM)
      if (vmVifs === undefined) {
        vmVifs = new Map<string, string>()
        vifMap.set(vif.$VM, vmVifs)
      }

      const networkName = networkNameById.get(vif.$network)
      if (networkName !== undefined) {
        vmVifs.set(vif.device, networkName)
      }
    }

    // Build PIF map (Host id -> device -> network name)
    const pifMap = new Map<XoPif['$host'], Map<string, string>>()
    for (const pif of pifs) {
      let hostPifs = pifMap.get(pif.$host)
      if (hostPifs === undefined) {
        hostPifs = new Map<string, string>()
        pifMap.set(pif.$host, hostPifs)
      }

      const networkName = networkNameById.get(pif.$network)
      if (networkName !== undefined) {
        hostPifs.set(pif.device, networkName)
      }
    }

    // Build VM labels
    for (const vm of vms) {
      const vbdDeviceToVdiName: Record<string, string> = {}
      const vbdDeviceToVdiUuid: Record<string, string> = {}
      const vmVbds = vbdMap.get(vm.id)
      if (vmVbds !== undefined) {
        for (const [device, vdiInfo] of vmVbds) {
          vbdDeviceToVdiName[device] = vdiInfo.name
          vbdDeviceToVdiUuid[device] = vdiInfo.uuid
        }
      }

      const vifIndexToNetworkName: Record<string, string> = {}
      const vmVifs = vifMap.get(vm.id)
      if (vmVifs !== undefined) {
        for (const [index, networkName] of vmVifs) {
          vifIndexToNetworkName[index] = networkName
        }
      }

      labels.vms[vm.uuid] = {
        name_label: vm.name_label,
        is_control_domain: vm.type === 'VM-controller',
        vbdDeviceToVdiName,
        vbdDeviceToVdiUuid,
        vifIndexToNetworkName,
      }
    }

    // Build Host labels
    for (const host of hosts) {
      const pifDeviceToNetworkName: Record<string, string> = {}
      const hostPifs = pifMap.get(host.id)
      if (hostPifs !== undefined) {
        for (const [device, networkName] of hostPifs) {
          pifDeviceToNetworkName[device] = networkName
        }
      }

      labels.hosts[host.uuid] = {
        name_label: host.name_label,
        pifDeviceToNetworkName,
        startTime: host.startTime,
      }
    }

    // Build SR labels with suffix mapping
    for (const sr of srs) {
      labels.srs[sr.uuid] = {
        name_label: sr.name_label,
      }

      // Create suffix mappings for different suffix lengths (8, 12, 16 chars)
      // SR metrics in RRD use truncated UUIDs
      for (const suffixLen of [8, 12, 16, 20]) {
        if (sr.uuid.length >= suffixLen) {
          const suffix = sr.uuid.slice(-suffixLen)
          // Only store if not already mapped (first match wins)
          if (labels.srSuffixToUuid[suffix] === undefined) {
            labels.srSuffixToUuid[suffix] = sr.uuid
          }
        }
      }
    }

    logger.debug('Label lookup data built', {
      vmCount: Object.keys(labels.vms).length,
      hostCount: Object.keys(labels.hosts).length,
      srCount: Object.keys(labels.srs).length,
    })

    return labels
  }

  /**
   * Send a message to the child process.
   */
  #sendToChild(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      throw new Error('Child process not running')
    }

    child.send(message)
  }

  /**
   * Send a message to the child process without throwing if not running.
   */
  #sendToChildNoWait(message: IpcMessage): void {
    const child = this.#childProcess
    if (child === undefined) {
      return
    }

    child.send(message)
  }

  /**
   * Wait for the child process to be ready.
   */
  #waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pendingRequests.delete('READY')
        reject(new Error('Timeout waiting for child process to be ready'))
      }, IPC_TIMEOUT_MS)

      this.#pendingRequests.set('READY', {
        resolve: () => {
          clearTimeout(timeout)
          resolve()
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        },
      })
    })
  }

  /**
   * Resolve a pending request.
   */
  #resolvePendingRequest(requestId: string, value: unknown): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.resolve(value)
    }
  }

  /**
   * Reject a pending request.
   */
  #rejectPendingRequest(requestId: string, error: Error): void {
    const pending = this.#pendingRequests.get(requestId)
    if (pending !== undefined) {
      this.#pendingRequests.delete(requestId)
      pending.reject(error)
    }
  }

  /**
   * Reject all pending requests.
   */
  #rejectAllPendingRequests(error: Error): void {
    for (const pending of this.#pendingRequests.values()) {
      pending.reject(error)
    }
    this.#pendingRequests.clear()
  }
}

// ============================================================================
// Plugin Factory (exported for xo-server)
// ============================================================================

interface PluginOptions {
  xo: XoApp
}

function pluginFactory({ xo }: PluginOptions): OpenMetricsPlugin {
  return new OpenMetricsPlugin(xo)
}
pluginFactory.configurationSchema = configurationSchema

export default pluginFactory
