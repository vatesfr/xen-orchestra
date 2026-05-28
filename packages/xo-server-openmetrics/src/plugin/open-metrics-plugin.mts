/**
 * OpenMetrics plugin — thin orchestrator.
 *
 * Holds the plugin lifecycle (configure/load/unload) and the runtime state
 * (configuration, ELU sampler, XOSTOR caches). Child-process management and
 * the IPC handshake live in `ChildProcessManager`; the data-shaping logic lives
 * in the data-providers and XOSTOR collectors. This class only wires them
 * together: on each child-originated request it calls the matching free
 * function and forwards the payload back through the manager.
 *
 * The lifecycle methods and the request router are the former `OpenMetricsPlugin`
 * bodies, changed only by mechanical substitution:
 * `this.#startChildProcess(cfg)` → `this.#childProcessManager.start(cfg)`,
 * `this.#stopChildProcess()` → `this.#childProcessManager.stop()`,
 * `this.#childProcess !== undefined` → `this.#childProcessManager.isRunning`,
 * and `this.#sendToChildNoWait(…)` → `this.#childProcessManager.sendNoWait(…)`.
 */

import type { XoApp } from '@vates/types'
import { createLogger } from '@xen-orchestra/log'

import type { IpcMessage, PluginConfiguration, ServerConfiguration } from '../types/ipc.mjs'
import type { XoMetricsData } from '../types/domain.mjs'
import type { XostorPayload, XostorSmartPayload, XostorUpdatesPayload } from '../types/xostor.mjs'

import { TtlCache } from '../utils/ttl-cache.mjs'
import {
  getXostorAlarms,
  getXostorData,
  getXostorSmartHealth,
  getXostorUpdates,
  type XostorCollectorDeps,
} from '../xostor/collectors.mjs'
import { ChildProcessManager } from './child-process-manager.mjs'
import { EluSampler } from './elu-sampler.mjs'
import {
  getHostStatusData,
  getSrData,
  getVdiData,
  getVmStatusData,
  getXapiCredentials,
  getXoMetrics,
} from './data-providers/entity-data.mjs'

const logger = createLogger('xo:xo-server-openmetrics')

/** Default port for the OpenMetrics HTTP server */
const DEFAULT_PORT = 9004

/** Default bind address for the OpenMetrics HTTP server */
const DEFAULT_BIND_ADDRESS = 'localhost'

/**
 * Cache lifetime for XOSTOR healthCheck payload (ms).
 *
 * Prometheus scrapes typically run every 15s; the LINSTOR controller is much
 * slower to interrogate. Caching the healthCheck output for 60s keeps the
 * controller idle between scrapes without making the dashboard noticeably
 * stale.
 */
const XOSTOR_CACHE_TTL_MS = 60_000

/**
 * Cache lifetime for the per-host SMART payload (ms).
 *
 * SMART overall-status changes on a multi-hour scale; 5 minutes keeps
 * hosts idle between scrapes without making dashboards stale.
 */
const XOSTOR_SMART_CACHE_TTL_MS = 300_000

/**
 * Cache lifetime for the per-host pending-update payload (ms).
 *
 * `updater.py check_update` triggers a yum metadata refresh, which is slow
 * and hits the upstream repos. Pending updates change on a multi-hour
 * timescale, so a 1 hour cache keeps hosts idle without sacrificing
 * dashboard freshness in any operationally meaningful way.
 */
const XOSTOR_UPDATES_CACHE_TTL_MS = 3_600_000

export class OpenMetricsPlugin {
  #configuration: PluginConfiguration | undefined
  readonly #xo: XoApp
  readonly #childProcessManager: ChildProcessManager

  // ELU/CPU self-monitoring
  #eluSampler = new EluSampler()

  #xostorHealthCheckCache = new TtlCache<XostorPayload>(XOSTOR_CACHE_TTL_MS)
  #xostorSmartCache = new TtlCache<XostorSmartPayload>(XOSTOR_SMART_CACHE_TTL_MS)
  #xostorUpdatesCache = new TtlCache<XostorUpdatesPayload>(XOSTOR_UPDATES_CACHE_TTL_MS)

  constructor(xo: XoApp) {
    this.#xo = xo
    this.#childProcessManager = new ChildProcessManager(message => this.#handleRequest(message))
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
    if (this.#childProcessManager.isRunning) {
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

    this.#eluSampler.start()
    await this.#childProcessManager.start(serverConfig)
  }

  /**
   * Unload and stop the plugin.
   * Gracefully shuts down the child process.
   */
  async unload(): Promise<void> {
    this.#eluSampler.stop()

    if (!this.#childProcessManager.isRunning) {
      return
    }

    logger.info('Stopping OpenMetrics server')

    await this.#childProcessManager.stop()
  }

  /**
   * Handle a child-originated data request and forward the payload back to the
   * child. READY/ERROR are handled by `ChildProcessManager`; this router owns
   * every `GET_*` request type plus the unknown-type warning.
   */
  #handleRequest(message: IpcMessage): void {
    switch (message.type) {
      case 'GET_XAPI_CREDENTIALS': {
        const credentials = getXapiCredentials(this.#xo)
        this.#childProcessManager.sendNoWait({
          type: 'XAPI_CREDENTIALS',
          requestId: message.requestId,
          payload: credentials,
        })
        break
      }

      case 'GET_SR_DATA': {
        const srData = getSrData(this.#xo)
        this.#childProcessManager.sendNoWait({
          type: 'SR_DATA',
          requestId: message.requestId,
          payload: srData,
        })
        break
      }

      case 'GET_VDI_DATA': {
        const vdiData = getVdiData(this.#xo)
        this.#childProcessManager.sendNoWait({
          type: 'VDI_DATA',
          requestId: message.requestId,
          payload: vdiData,
        })
        break
      }

      case 'GET_HOST_STATUS': {
        const hostStatus = getHostStatusData(this.#xo)
        this.#childProcessManager.sendNoWait({
          type: 'HOST_STATUS',
          requestId: message.requestId,
          payload: hostStatus,
        })
        break
      }

      case 'GET_VM_STATUS': {
        const vmStatus = getVmStatusData(this.#xo)
        this.#childProcessManager.sendNoWait({
          type: 'VM_STATUS',
          requestId: message.requestId,
          payload: vmStatus,
        })
        break
      }

      case 'GET_XOSTOR_DATA': {
        getXostorData(this.#xostorDeps)
          .then((xostorPayload: XostorPayload) => {
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_DATA',
              requestId: message.requestId,
              payload: xostorPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR data', { error: err })
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_DATA',
              requestId: message.requestId,
              payload: { clusters: [] },
            })
          })
        break
      }

      case 'GET_XOSTOR_ALARMS': {
        try {
          const alarmsPayload = getXostorAlarms(this.#xo)
          this.#childProcessManager.sendNoWait({
            type: 'XOSTOR_ALARMS',
            requestId: message.requestId,
            payload: alarmsPayload,
          })
        } catch (err) {
          logger.error('Failed to collect XOSTOR alarms', { error: err })
          this.#childProcessManager.sendNoWait({
            type: 'XOSTOR_ALARMS',
            requestId: message.requestId,
            payload: { clusters: [] },
          })
        }
        break
      }

      case 'GET_XOSTOR_SMART': {
        getXostorSmartHealth(this.#xostorDeps)
          .then((smartPayload: XostorSmartPayload) => {
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_SMART',
              requestId: message.requestId,
              payload: smartPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR SMART data', { error: err })
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_SMART',
              requestId: message.requestId,
              payload: { hosts: [] },
            })
          })
        break
      }

      case 'GET_XOSTOR_UPDATES': {
        getXostorUpdates(this.#xostorDeps)
          .then((updatesPayload: XostorUpdatesPayload) => {
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_UPDATES',
              requestId: message.requestId,
              payload: updatesPayload,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XOSTOR pending updates', { error: err })
            this.#childProcessManager.sendNoWait({
              type: 'XOSTOR_UPDATES',
              requestId: message.requestId,
              payload: { hosts: [] },
            })
          })
        break
      }

      case 'GET_XO_METRICS': {
        getXoMetrics(this.#xo, this.#eluSampler)
          .then((xoMetrics: XoMetricsData) => {
            this.#childProcessManager.sendNoWait({
              type: 'XO_METRICS',
              requestId: message.requestId,
              payload: xoMetrics,
            })
          })
          .catch((err: unknown) => {
            logger.error('Failed to collect XO metrics', { error: err })
            const emptyMetrics: XoMetricsData = {
              pendingTaskCount: 0,
              poolCount: 0,
              hostCount: 0,
              vmCount: 0,
              srCountByContentType: {},
              userCount: 0,
              groupCount: 0,
              socketCount: 0,
              hostCountByVersion: [],
              hostCountByLicense: [],
              backupJobStats: [],
              nodeProcess: {
                eluMean: 0,
                eluP99: 0,
                eluMax: 0,
                memoryRssBytes: 0,
                memoryHeapUsedBytes: 0,
                memoryHeapTotalBytes: 0,
                memoryExternalBytes: 0,
                memoryArrayBuffersBytes: 0,
                heapSizeLimitBytes: 0,
                heapAvailableBytes: 0,
                detachedContexts: 0,
                cpuUserSeconds: 0,
                cpuSystemSeconds: 0,
              },
            }
            this.#childProcessManager.sendNoWait({
              type: 'XO_METRICS',
              requestId: message.requestId,
              payload: emptyMetrics,
            })
          })
        break
      }

      default:
        logger.warn('Unknown message type from child', { type: message.type })
    }
  }

  /**
   * Bundle the XO handle and the three XOSTOR `TtlCache` instances for the
   * cache-backed collector wrappers. Lifetime/coalescing stay on the plugin;
   * the collection logic lives in `../xostor/collectors.mjs`.
   */
  get #xostorDeps(): XostorCollectorDeps {
    return {
      xo: this.#xo,
      healthCheckCache: this.#xostorHealthCheckCache,
      smartCache: this.#xostorSmartCache,
      updatesCache: this.#xostorUpdatesCache,
    }
  }
}

export default OpenMetricsPlugin
