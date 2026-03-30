import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { FilterBuilder } from '../FilterBuilder.js'
import { assertNonEmptyString, assertFileExists } from '../../utils/index.js'

/**
 * Abstract base class for all XenOrchestra request handlers.
 *
 * Provides common CRUD operations with REST-first approach and WebSocket fallback.
 * All specialized request handlers should extend this class to inherit standard
 * functionality while being able to override methods for specific behaviors.
 *
 * The REST-first approach prioritizes REST API calls when available and falls back
 * to WebSocket (xo-lib) calls when REST endpoints don't exist or fail.
 *
 * @abstract
 * @class AbstractRequest
 */
export class AbstractRequest {
  /**
   * Reference to the DispatchClient instance
   * @type {DispatchClient}
   */
  dispatchClient

  /**
   * REST API endpoint path for this resource type
   * Must be overridden by subclasses
   * @type {string}
   * @abstract
   */
  endpoint

  /**
   * Creates a new AbstractRequest instance.
   *
   * @param {DispatchClient} dispatchClient - The DispatchClient instance for API calls
   * @throws {Error} If dispatchClient is not provided
   */
  constructor(dispatchClient) {
    if (!dispatchClient) {
      throw new Error('DispatchClient instance is required')
    }
    this.dispatchClient = dispatchClient
  }

  /**
   * Ensures the client is connected before making API calls.
   * Centralizes the connection check logic.
   *
   * @throws {Error} If client is not initialized or connected
   * @protected
   */
  _ensureConnected() {
    if (!this.dispatchClient.isConnected()) {
      throw new Error('Client not initialized. Call initialize() first.')
    }
  }

  /**
   * Retrieves a single object matching the specified filter criteria.
   *
   * Uses REST API when endpoint is available. Throws error if REST API fails.
   * This method provides efficient filtering and avoids getAllObjects when possible.
   *
   * @param {Object} filter - Filter criteria as key-value pairs
   * @returns {Promise<Object|undefined>} First matching object or undefined if none found
   * @throws {Error} If the request fails or endpoint is not available
   */
  async get(filter) {
    this._ensureConnected()

    // Use REST API if endpoint is available
    if (this.endpoint) {
      const result = await this._tryRestGet(filter)
      if (result !== undefined) {
        console.log(`✅ Retrieved ${this.endpoint} via REST API`)
      }
      return result // Returns result or undefined if not found
    }

    // No REST endpoint available
    throw new Error(`No REST endpoint configured for this resource type`)
  }

  /**
   * Lists all objects matching the specified criteria.
   *
   * Uses REST API when endpoint is available. Throws error if REST API fails.
   * Avoids getAllObjects when possible for better performance.
   *
   * @param {Object} [filter] - Filter criteria as key-value pairs
   * @returns {Promise<Array>} Array of objects matching the criteria
   * @throws {Error} If the request fails or endpoint is not available
   */
  async list(filter) {
    this._ensureConnected()

    // Use REST API if endpoint is available
    if (this.endpoint) {
      const result = await this._tryRestList(filter)
      console.log(`✅ Retrieved ${this.endpoint} list via REST API`)
      return result
    }

    // No REST endpoint available
    throw new Error(`No REST endpoint configured for this resource type`)
  }

  /**
   * Retrieves detailed information for a specific object by ID.
   *
   * Uses REST API when endpoint is available. Throws error if REST API fails.
   *
   * @param {string} id - The unique identifier of the object
   * @returns {Promise<Object>} Complete object details
   * @throws {Error} If the ID is invalid, object is not found, or endpoint is not available
   */
  async details(id) {
    this._ensureConnected()

    if (!id || typeof id !== 'string') {
      throw new Error('Valid ID string is required')
    }

    // Use REST API if endpoint is available
    if (this.endpoint) {
      const result = await this.dispatchClient.restApiClient.get(`/rest/v0/${this.endpoint}/${id}`)
      if (result) {
        console.log(`✅ Retrieved ${this.endpoint} details via REST API`)
        return result
      }
      throw new Error(`Object with ID ${id} not found`)
    }

    // No REST endpoint available
    throw new Error(`No REST endpoint configured for this resource type`)
  }

  /**
   * Try to get a single object via REST API.
   * Should be overridden by subclasses for specific REST implementations.
   *
   * @param {Object|FilterBuilder} filter - Filter criteria or FilterBuilder instance
   * @returns {Promise<Object|undefined>} Object or undefined if REST not available
   * @protected
   */
  async _tryRestGet(filter) {
    let filterBuilder

    // Handle different input types
    if (filter instanceof FilterBuilder) {
      filterBuilder = filter
    } else if (filter && typeof filter === 'object' && Object.keys(filter).length > 0) {
      // Convert object filter to FilterBuilder for consistent handling
      filterBuilder = FilterBuilder.fromObject(filter)
    } else {
      // No filter or empty filter
      filterBuilder = FilterBuilder.create()
    }

    // Use advanced filtering if filters exist
    if (filterBuilder.hasFilters()) {
      const objects = await this.dispatchClient.restApiClient.getObjects(`/rest/v0/${this.endpoint}`, filterBuilder)

      if (objects && objects.length > 0) {
        return objects[0] // Return first matching object
      }
    } else {
      // No filters - get all objects and return first one
      const objects = await this.dispatchClient.restApiClient.getObjects(`/rest/v0/${this.endpoint}`)
      if (objects && objects.length > 0) {
        return objects[0]
      }
    }

    return undefined
  }

  /**
   * Try to list objects via REST API.
   * Should be overridden by subclasses for specific REST implementations.
   *
   * @param {Object|FilterBuilder} [filter] - Filter criteria or FilterBuilder instance
   * @returns {Promise<Array|undefined>} Array of objects or undefined if REST not available
   * @protected
   */
  async _tryRestList(filter) {
    const endpoint = `/rest/v0/${this.endpoint}`
    let filterBuilder = null

    // Determine if we have meaningful filters
    // Check for FilterBuilder instance first (has private properties) or regular object with properties
    const hasFilter =
      filter && (filter instanceof FilterBuilder || (typeof filter === 'object' && Object.keys(filter).length > 0))

    if (hasFilter) {
      // Handle different input types
      if (filter instanceof FilterBuilder) {
        filterBuilder = filter
      } else {
        // Convert object filter to FilterBuilder for consistent handling
        filterBuilder = FilterBuilder.fromObject(filter)
      }

      // Only use filterBuilder if it has meaningful content
      if (!filterBuilder.hasContent()) {
        filterBuilder = null
      }
    }

    // Single call to getObjects with appropriate parameters
    const objects = await this.dispatchClient.restApiClient.getObjects(endpoint, filterBuilder || undefined)

    return objects || []
  }

  /**
   * Creates an error with code and optional cause.
   *
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Error} [cause] - Original error that caused this error
   * @returns {Error} Error with code and cause properties
   * @protected
   */
  _createError(message, code, cause) {
    const error = new Error(message)
    error.code = code
    if (cause) {
      error.cause = cause
    }
    return error
  }

  /**
   * Imports a file to create a new resource using REST API streaming.
   *
   * Provides a common abstraction for importing files (VHD, XVA) to create resources.
   * Handles validation, file checks, logging, and error handling.
   * The actual upload is delegated to the uploadHandler for flexibility.
   *
   * @param {Object} config - Import configuration
   * @param {string} config.filePath - Path to the file to import
   * @param {string} config.targetUuid - UUID of the target (e.g., SR UUID)
   * @param {string} config.format - Import format for logging (e.g., "VHD", "XVA")
   * @param {string} config.targetType - Target type for logging (e.g., "SR")
   * @param {string} config.resultType - Result type for logging (e.g., "VDI", "VM")
   * @param {function(fs.Stats, number): Promise<string>} config.uploadHandler - Async function that performs the upload and returns the created resource ID
   * @returns {Promise<string>} ID of the created resource
   * @throws {Error} If import fails
   * @protected
   */
  async _importFile(config) {
    this._ensureConnected()

    const { filePath, targetUuid, format, targetType, resultType, uploadHandler } = config

    assertNonEmptyString(filePath, 'Valid file path is required', 'INVALID_FILE_PATH')
    assertNonEmptyString(targetUuid, `Valid ${targetType} UUID is required`, `INVALID_${targetType.toUpperCase()}_UUID`)

    const startTime = Date.now()

    await assertFileExists(filePath)
    const stats = await fs.stat(filePath)

    console.log(
      `Importing ${format} ${filePath} to ${targetType} ${targetUuid} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
    )

    try {
      const resourceId = await uploadHandler(stats)
      const duration = Date.now() - startTime

      console.log(`${format} imported successfully as ${resultType} ${resourceId} in ${duration}ms`)

      return resourceId
    } catch (error) {
      if (error.code) {
        throw error
      }

      throw this._createError(`${format} import failed: ${error.message}`, 'IMPORT_FAILED', error)
    }
  }

  /**
   * Exports a resource to a file using REST API streaming.
   *
   * Provides a common abstraction for exporting resources (VDI, VM) to various formats.
   * Handles validation, endpoint building, download, logging, and error handling.
   *
   * @param {Object} config - Export configuration
   * @param {string} config.resourceUuid - UUID of the resource to export
   * @param {string} config.outputPath - Absolute path for the output file
   * @param {string} config.resourceType - Type name for logging (e.g., "VDI", "VM")
   * @param {string} config.format - Export format for logging (e.g., "VHD", "XVA")
   * @param {string} config.baseEndpoint - Base REST endpoint (e.g., "/rest/v0/vdis")
   * @param {string} config.extension - File extension including dot (e.g., ".vhd", ".xva")
   * @param {URLSearchParams} [config.queryParams] - Query parameters for the request
   * @param {number} [config.timeout=600000] - Request timeout in milliseconds
   * @param {string} [config.logSuffix] - Additional info for success log message
   * @param {Object} [config.extraResult] - Extra properties to merge into result
   * @returns {Promise<{path: string, size: number, duration: number}>} Export result with any extra properties
   * @throws {Error} If export fails
   * @protected
   */
  async _exportResource(config) {
    const {
      resourceUuid,
      outputPath,
      resourceType,
      format,
      baseEndpoint,
      extension,
      queryParams,
      timeout = 600_000,
      logSuffix = '',
      extraResult = {},
    } = config

    // Build endpoint with optional query params
    const queryString = queryParams?.toString() ?? ''
    const endpoint = `${baseEndpoint}/${resourceUuid}${extension}${queryString ? '?' + queryString : ''}`

    console.log(
      `Exporting ${resourceType} ${resourceUuid} to ${format}: ${outputPath}${logSuffix ? ` ${logSuffix}` : ''}`
    )

    try {
      const result = await this._downloadToFile(endpoint, outputPath, { timeout })

      console.log(
        `${format} exported successfully: ${outputPath} ` +
          `(${(result.size / 1024 / 1024).toFixed(2)} MB in ${result.duration}ms${logSuffix ? `, ${logSuffix}` : ''})`
      )

      return {
        ...result,
        ...extraResult,
      }
    } catch (error) {
      if (error.code) {
        throw error
      }

      throw this._createError(
        `${format} export failed for ${resourceType} ${resourceUuid}: ${error.message}`,
        'EXPORT_FAILED',
        error
      )
    }
  }

  /**
   * Downloads content from REST API endpoint to a file using streaming.
   * Automatically cleans up partial file on error.
   *
   * @param {string} endpoint - REST API endpoint (e.g., '/rest/v0/vdis/uuid.vhd')
   * @param {string} outputPath - Absolute path for the output file
   * @param {Object} [options={}] - Download options
   * @param {number} [options.timeout=600000] - Request timeout in milliseconds
   * @returns {Promise<{path: string, size: number, duration: number}>} Download result
   * @throws {Error} If download fails or file write fails
   * @protected
   */
  async _downloadToFile(endpoint, outputPath, options = {}) {
    this._ensureConnected()

    const startTime = Date.now()
    const { timeout = 600_000 } = options

    try {
      const response = await fetch(`${this.dispatchClient.restApiClient.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.dispatchClient.restApiClient.headers,
        signal: AbortSignal.timeout(timeout),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw this._createError(
          `Download failed: HTTP ${response.status} - ${response.statusText}`,
          'DOWNLOAD_HTTP_ERROR',
          new Error(errorText)
        )
      }

      // Stream response to file
      const fileStream = createWriteStream(outputPath)
      await pipeline(response.body, fileStream)

      const stats = await fs.stat(outputPath)
      const duration = Date.now() - startTime

      return {
        path: outputPath,
        size: stats.size,
        duration,
      }
    } catch (error) {
      // Clean up partial file on error
      try {
        await fs.unlink(outputPath)
      } catch (cleanupError) {
        console.warn(`Cleanup failed for ${outputPath}: ${cleanupError.message}`)
      }

      if (error.code) {
        throw error
      }

      throw this._createError(`Download failed: ${error.message}`, 'DOWNLOAD_FAILED', error)
    }
  }
}
