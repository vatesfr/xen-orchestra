/**
 * XO Server OpenMetrics Plugin
 *
 * This plugin exposes XO metrics in OpenMetrics/Prometheus format.
 * It spawns a child process that runs an HTTP server and fetches
 * RRD data directly from connected XAPI pools.
 */

import { createLogger } from '@xen-orchestra/log'
import { fork, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
  port: number
  bindAddress: string
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
interface VmLabelInfo {
  name_label: string
  vbdDeviceToVdiName: Record<string, string> // { "xvda": "System Disk" }
  vifIndexToNetworkName: Record<string, string> // { "0": "Pool-wide network" }
}

interface HostLabelInfo {
  name_label: string
  pifDeviceToNetworkName: Record<string, string> // { "eth0": "Management" }
}

interface SrLabelInfo {
  name_label: string
}

interface LabelLookupData {
  vms: Record<string, VmLabelInfo> // keyed by VM UUID
  hosts: Record<string, HostLabelInfo> // keyed by Host UUID
  srs: Record<string, SrLabelInfo> // keyed by SR UUID
  srSuffixToUuid: Record<string, string> // maps UUID suffix to full UUID
}

interface XapiCredentialsPayload {
  hosts: HostCredentials[]
  labels: LabelLookupData
}

// Minimal type for XO host object
interface XoHost {
  id: string
  uuid: string
  type: 'host'
  address: string
  name_label: string
  $pool: string
  $poolId: string
}

// Minimal type for XO pool object
interface XoPool {
  id: string
  uuid: string
  type: 'pool'
  name_label: string
}

// Minimal type for XO VM object
interface XoVm {
  id: string
  uuid: string
  type: 'VM'
  name_label: string
  $VBDs: string[]
  VIFs: string[]
}

// Minimal type for XO VBD object
interface XoVbd {
  id: string
  type: 'VBD'
  device: string | null
  VDI: string | null
  VM: string
}

// Minimal type for XO VDI object
interface XoVdi {
  id: string
  uuid: string
  type: 'VDI'
  name_label: string
}

// Minimal type for XO VIF object
interface XoVif {
  id: string
  type: 'VIF'
  device: string
  $network: string
  VM: string
}

// Minimal type for XO PIF object
interface XoPif {
  id: string
  type: 'PIF'
  device: string
  $network: string
  $host: string
}

// Minimal type for XO SR object
interface XoSr {
  id: string
  uuid: string
  type: 'SR'
  name_label: string
}

// Minimal type for XO Network object
interface XoNetwork {
  id: string
  uuid: string
  type: 'network'
  name_label: string
}

// Union type for all XO objects we handle
type XoObject = XoHost | XoPool | XoVm | XoVbd | XoVdi | XoVif | XoPif | XoSr | XoNetwork | { type?: string }

// Minimal type for XAPI connection
interface Xapi {
  status: string
  pool?: { uuid: string }
  sessionId: string
  _url?: { protocol: string; hostname: string; port?: string }
}

// Minimal type for xo-server instance
interface XoServer {
  getAllXapis(): Record<string, Xapi>
  getObjects(filter?: { filter?: Record<string, unknown> }): Record<string, unknown>
}

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
    port: {
      type: 'number',
      title: 'Port',
      description: 'Port for the OpenMetrics HTTP server',
      default: DEFAULT_PORT,
      minimum: 1,
      maximum: 65535,
    },
    bindAddress: {
      type: 'string',
      title: 'Bind Address',
      description: 'Address to bind to (127.0.0.1 for localhost only, 0.0.0.0 for all interfaces)',
      default: DEFAULT_BIND_ADDRESS,
    },
  },
  additionalProperties: false,
}

// ============================================================================
// Plugin Class
// ============================================================================

class OpenMetricsPlugin {
  #configuration: PluginConfiguration | undefined
  #staticConfig: Partial<PluginConfiguration>
  #childProcess: ChildProcess | undefined
  #pendingRequests = new Map<string, PendingRequest>()
  #requestIdCounter = 0
  readonly #xo: XoServer

  constructor(xo: XoServer, staticConfig: Partial<PluginConfiguration> = {}) {
    this.#xo = xo
    this.#staticConfig = staticConfig
    logger.info('Plugin initialized with staticConfig', { staticConfig })
  }

  /**
   * Configure the plugin with the provided configuration.
   */
  async configure(configuration: PluginConfiguration): Promise<void> {
    this.#configuration = configuration
    logger.debug('Plugin configured', { configuration })
  }

  /**
   * Load and start the plugin.
   * Forks the child process and waits for it to be ready.
   */
  async load(): Promise<void> {
    if (this.#childProcess !== undefined) {
      logger.warn('Plugin already loaded, skipping')
      return
    }

    // Use configured values with priority: static config (TOML) > dynamic config (UI) > defaults
    // Static config from TOML takes precedence as it represents admin-level infrastructure config
    logger.info('Config sources', {
      dynamicConfig: this.#configuration,
      staticConfig: this.#staticConfig,
    })

    const configuration: PluginConfiguration = {
      port: this.#staticConfig.port ?? this.#configuration?.port ?? DEFAULT_PORT,
      bindAddress: this.#staticConfig.bindAddress ?? this.#configuration?.bindAddress ?? DEFAULT_BIND_ADDRESS,
    }

    logger.info('Starting OpenMetrics server', {
      port: configuration.port,
      bindAddress: configuration.bindAddress,
    })

    await this.#startChildProcess(configuration)
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
  async #startChildProcess(configuration: PluginConfiguration): Promise<void> {
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
      if (xapi.status !== 'connected') {
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
   * Get label lookup data for enriching metrics with human-readable names.
   * Gathers VM, Host, SR, VDI, VIF, PIF, and Network labels.
   */
  #getLabelLookupData(): LabelLookupData {
    const labels: LabelLookupData = {
      vms: {},
      hosts: {},
      srs: {},
      srSuffixToUuid: {},
    }

    // Get all objects and categorize them by type in a single pass
    const allObjects = this.#xo.getObjects() as Record<string, XoObject>

    const vms: XoVm[] = []
    const hosts: XoHost[] = []
    const srs: XoSr[] = []
    const vbds: XoVbd[] = []
    const vdis: XoVdi[] = []
    const vifs: XoVif[] = []
    const pifs: XoPif[] = []
    const networks: XoNetwork[] = []

    for (const id of Object.keys(allObjects)) {
      const obj = allObjects[id]
      if (obj.type === undefined) continue

      switch (obj.type) {
        case 'VM':
          vms.push(obj as XoVm)
          break
        case 'host':
          hosts.push(obj as XoHost)
          break
        case 'SR':
          srs.push(obj as XoSr)
          break
        case 'VBD':
          vbds.push(obj as XoVbd)
          break
        case 'VDI':
          vdis.push(obj as XoVdi)
          break
        case 'VIF':
          vifs.push(obj as XoVif)
          break
        case 'PIF':
          pifs.push(obj as XoPif)
          break
        case 'network':
          networks.push(obj as XoNetwork)
          break
      }
    }

    // Build network name map (id -> name_label)
    const networkNameById = new Map<string, string>()
    for (const network of networks) {
      networkNameById.set(network.id, network.name_label)
    }

    // Build VDI name map (id -> name_label)
    const vdiNameById = new Map<string, string>()
    for (const vdi of vdis) {
      vdiNameById.set(vdi.id, vdi.name_label)
    }

    // Build VBD map (VM id -> device -> VDI name)
    const vbdMap = new Map<string, Map<string, string>>()
    for (const vbd of vbds) {
      if (vbd.device === null || vbd.device === '' || vbd.VDI === null) continue

      let vmVbds = vbdMap.get(vbd.VM)
      if (vmVbds === undefined) {
        vmVbds = new Map<string, string>()
        vbdMap.set(vbd.VM, vmVbds)
      }

      const vdiName = vdiNameById.get(vbd.VDI)
      if (vdiName !== undefined) {
        vmVbds.set(vbd.device, vdiName)
      }
    }

    // Build VIF map (VM id -> vif index -> network name)
    const vifMap = new Map<string, Map<string, string>>()
    for (const vif of vifs) {
      // VIF device is the index (0, 1, 2...)
      if (vif.VM === undefined) continue

      let vmVifs = vifMap.get(vif.VM)
      if (vmVifs === undefined) {
        vmVifs = new Map<string, string>()
        vifMap.set(vif.VM, vmVifs)
      }

      const networkName = networkNameById.get(vif.$network)
      if (networkName !== undefined) {
        vmVifs.set(vif.device, networkName)
      }
    }

    // Build PIF map (Host id -> device -> network name)
    const pifMap = new Map<string, Map<string, string>>()
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
      const vmVbds = vbdMap.get(vm.id)
      if (vmVbds !== undefined) {
        for (const [device, vdiName] of vmVbds) {
          vbdDeviceToVdiName[device] = vdiName
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
        vbdDeviceToVdiName,
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
  xo: XoServer
  staticConfig?: Partial<PluginConfiguration>
}

function pluginFactory({ xo, staticConfig }: PluginOptions): OpenMetricsPlugin {
  return new OpenMetricsPlugin(xo, staticConfig)
}
pluginFactory.configurationSchema = configurationSchema

export default pluginFactory
