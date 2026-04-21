import { FilterBuilder } from './FilterBuilder.js'

/**
 * REST API client for XenOrchestra HTTP-based operations.
 *
 * This class provides a basic interface to XenOrchestra's REST API,
 * handling authentication and basic request management.
 *
 * @class RestApiClient
 */
export class RestApiClient {
  /**
   * Private configuration object
   * @type {Object}
   * @private
   */
  #config

  /**
   * Base URL for REST API requests
   * @type {string}
   */
  baseUrl

  /**
   * Authentication token
   * @type {string}
   */
  token = ''

  /**
   * HTTP headers for requests
   * @type {Object}
   */
  headers = {}

  /**
   * Creates a new RestApiClient instance.
   *
   * @param {Object} config - Configuration object
   * @param {string} config.xoUrl - XenOrchestra server URL (e.g., 'https://xo.example.com')
   * @param {string} config.username - Username for authentication
   * @param {string} config.password - Password for authentication
   * @throws {Error} If configuration is invalid
   */
  constructor(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Configuration object is required')
    }

    if (!config.xoUrl || !config.username || !config.password) {
      throw new Error('Missing required configuration: xoUrl, username, and password are required')
    }

    this.#config = config
    this.baseUrl = this.#config.xoUrl.replace(/\/+$/, '')
    this.token = ''
    this.headers = {}
  }

  /**
   * Updates authentication headers with the provided token.
   *
   * @param {string} token - Authentication token received from XenOrchestra
   * @throws {Error} If token is not a valid string
   * @private
   */
  updateHeaders(token) {
    this.token = token
    this.headers = {
      'Content-Type': 'application/json',
      Cookie: `token=${this.token}`,
    }
  }

  /**
   * Establishes connection and authenticates with XenOrchestra REST API.
   *
   * @returns {Promise<void>} Resolves when authentication is successful
   * @throws {Error} If authentication fails or network error occurs
   */
  async connect() {
    const { username, password } = this.#config

    try {
      // Prepare Basic authentication
      const auth = `${username}:${password}`
      const options = {
        method: 'post',
        headers: {
          Authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
        },
      }

      const url = `${this.baseUrl}/rest/v0/users/authentication_tokens`
      const response = await fetch(url, options)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Authentication failed (${response.status}): ${errorText}`)
      }

      const jsonResp = await response.json()

      if (!jsonResp.token || !jsonResp.token.id) {
        throw new Error('Invalid response: missing authentication token')
      }

      this.updateHeaders(jsonResp.token.id)
      console.log(`🌐 Successfully authenticated with XenOrchestra REST API`)
    } catch (error) {
      console.error(`❌ Failed to connect to XO REST API: ${error.message}`)
      throw error
    }
  }

  /**
   * Basic GET request method.
   *
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails or client is not connected
   */
  async get(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.headers,
      })

      if (response.ok) {
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      console.error(`❌ GET request failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Private helper for HTTP requests with body (POST/PUT/PATCH).
   *
   * @param {string} method - HTTP method (POST, PUT, PATCH)
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails
   * @private
   */
  async _requestWithBody(method, endpoint, data) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      console.error(`❌ ${method} request failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Basic POST request method.
   *
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails or client is not connected
   */
  async post(endpoint, data) {
    return this._requestWithBody('POST', endpoint, data)
  }

  /**
   * Basic PUT request method.
   *
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails or client is not connected
   */
  async put(endpoint, data) {
    return this._requestWithBody('PUT', endpoint, data)
  }

  /**
   * Basic PATCH request method.
   *
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails or client is not connected
   */
  async patch(endpoint, data) {
    return this._requestWithBody('PATCH', endpoint, data)
  }

  /**
   * Basic DELETE request method.
   *
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<Object>} Response from the API
   * @throws {Error} If the request fails or client is not connected
   */
  async delete(endpoint) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.headers,
      })

      if (response.ok) {
        // Some DELETE endpoints return empty response
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    } catch (error) {
      console.error(`❌ DELETE request failed: ${error.message}`)
      throw error
    }
  }

  /**
   * Builds query string for getObjects requests.
   * @param {Object|FilterBuilder} [options] - Filter options or FilterBuilder instance
   * @returns {string} Query string with fields=* ensured
   * @private
   */
  static buildGetObjectsQuery(options = {}) {
    let queryString = ''

    if (options instanceof FilterBuilder) {
      queryString = options.hasContent() ? options.build() : ''
    } else if (options && typeof options === 'object' && Object.keys(options).length > 0) {
      const builder = FilterBuilder.create()

      if (options.filter) builder.fromObject(options.filter)
      if (options.fields) builder.selectFields(options.fields)
      if (options.additionalParams) {
        Object.entries(options.additionalParams).forEach(([key, value]) => builder.withParam(key, value))
      }

      queryString = builder.build()
    }

    // Ensure fields=* is included
    if (!queryString) return 'fields=*'
    if (!queryString.includes('fields=')) queryString += '&fields=*'

    return queryString
  }

  /**
   * Gets full objects from REST API endpoints that return URLs.
   *
   * @param {string} endpoint - API endpoint path
   * @param {Object|FilterBuilder} [options] - Filter options or FilterBuilder instance
   * @param {Object} [options.filter] - Filter criteria as key-value pairs
   * @param {string|string[]} [options.fields] - Fields to select (* for all)
   * @param {Object} [options.additionalParams] - Additional query parameters
   * @returns {Promise<Array>} Array of full objects
   * @throws {Error} If the request fails
   */
  async getObjects(endpoint, options = {}) {
    // Use helper to build query string
    const queryString = RestApiClient.buildGetObjectsQuery(options)

    // Build final URL and make HTTP request
    const finalEndpoint = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${queryString}`
    const response = await this.get(finalEndpoint)

    // Handle response
    if (!Array.isArray(response)) {
      return []
    }

    return response
  }

  /**
   * Checks if the client is connected.
   *
   * @returns {boolean} True if connected and authenticated
   */
  isConnected() {
    return !!this.token
  }
}
