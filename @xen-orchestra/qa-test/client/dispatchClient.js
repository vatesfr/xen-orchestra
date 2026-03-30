import { RestApiClient } from './restApiClient.js'
import { xoConnection } from './xoLibClient.js'
import { VMRequest } from './requests/vm.js'
import { BackupRequest } from './requests/backup.js'
import { BackupLogRequest } from './requests/backupLog.js'
import { BackupRepositoryRequest } from './requests/misc.js'
import { SRRequest } from './requests/sr.js'
import { VDIRequest } from './requests/vdi.js'
import { CleanupClient } from './cleanupClient.js'

/**
 * Central orchestration client for XenOrchestra operations.
 *
 * The DispatchClient manages both WebSocket and REST API connections to XenOrchestra,
 * providing a unified interface for all XO operations.
 *
 * @class DispatchClient
 */
export class DispatchClient {
  /**
   * WebSocket client instance (xo-lib)
   * @type {Object|null}
   */
  xoClient = null

  /**
   * REST API client instance
   * @type {RestApiClient|null}
   */
  restApiClient = null

  /**
   * VM request handler
   * @type {VMRequest|null}
   */
  vm = null

  /**
   * Backup request handler
   * @type {BackupRequest|null}
   */
  backup = null

  /**
   * Backup log request handler
   * @type {BackupLogRequest|null}
   */
  backupLog = null

  /**
   * Backup repository request handler
   * @type {BackupRepositoryRequest|null}
   */
  backupRepository = null

  /**
   * SR (Storage Repository) request handler
   * @type {SRRequest|null}
   */
  sr = null

  /**
   * VDI (Virtual Disk Image) request handler
   * @type {VDIRequest|null}
   */
  vdi = null

  /**
   * Cleanup orchestration client
   * @type {CleanupClient|null}
   */
  cleanup = null

  /**
   * Initializes and establishes connections to XenOrchestra.
   *
   * This method sets up both WebSocket (xo-lib) and REST API connections
   * using environment variables for configuration.
   *
   * @returns {Promise<void>} Resolves when both connections are established
   * @throws {Error} If initialization fails or required environment variables are missing
   */
  async initialize() {
    // Load environment variables
    const config = {
      xoUrl: process.env.HOSTNAME,
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
    }

    // Validate configuration
    if (!config.xoUrl || !config.username || !config.password) {
      throw new Error('Missing required environment variables: HOSTNAME, USERNAME, PASSWORD')
    }

    console.log('🚀 Initializing XenOrchestra connections...')

    try {
      // Initialize REST API client
      this.restApiClient = new RestApiClient(config)
      await this.restApiClient.connect()

      // Initialize WebSocket client
      this.xoClient = await xoConnection(config)

      // Initialize request handlers
      this.vm = new VMRequest(this)
      this.backup = new BackupRequest(this)
      this.backupLog = new BackupLogRequest(this)
      this.backupRepository = new BackupRepositoryRequest(this)
      this.sr = new SRRequest(this)
      this.vdi = new VDIRequest(this)
      this.cleanup = new CleanupClient(this)

      console.log('✅ All connections established successfully')
    } catch (error) {
      console.error('❌ Failed to initialize connections:', error.message)
      throw error
    }
  }

  /**
   * Closes all connections to XenOrchestra.
   *
   * @returns {Promise<void>} Resolves when all connections are closed
   */
  async close() {
    const closePromises = []

    if (this.xoClient) {
      closePromises.push(this.xoClient.close())
      this.xoClient = null
    }

    if (closePromises.length > 0) {
      await Promise.all(closePromises)
    }

    this.restApiClient = null
  }

  /**
   * Checks if the client is properly initialized.
   *
   * @returns {boolean} True if both clients are connected
   */
  isConnected() {
    return !!(this.xoClient && this.restApiClient && this.restApiClient.token)
  }

  /**
   * Gets basic server information using WebSocket.
   *
   * @returns {Promise<Object>} Server information
   * @throws {Error} If client is not connected
   */
  async getServerInfo() {
    if (!this.isConnected()) {
      throw new Error('Client not initialized. Call initialize() first.')
    }

    // Use WebSocket to get server version
    return await this.xoClient.call('system.getServerVersion')
  }
}
