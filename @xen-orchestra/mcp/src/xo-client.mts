/**
 * XO REST API Client
 *
 * Minimal client using native fetch to interact with Xen Orchestra REST API.
 * Authentication is done via Basic Auth or token cookie.
 */

export interface ListOptions {
  filter?: string
  fields?: string
  limit?: number
}

const REQUEST_TIMEOUT_MS = 30_000

export type XoClientConfig = { url: string; username: string; password: string } | { url: string; token: string }


export class XoClient {
  private readonly baseUrl: string
  private readonly authHeaders: Record<string, string>
  private readonly authMode: 'token' | 'basic'

  constructor(config: XoClientConfig) {
    this.baseUrl = config.url.replace(/\/$/, '')

    if ('token' in config) {
      this.authHeaders = { cookie: `authenticationToken=${config.token}` }
      this.authMode = 'token'
    } else {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
      this.authHeaders = { Authorization: `Basic ${credentials}` }
      this.authMode = 'basic'
    }
  }

  private async fetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}/rest/v0${endpoint}`

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.authHeaders,
          ...options.headers,
        },
        signal: options.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
        throw new Error(
          `Cannot connect to XO server at ${this.baseUrl}. Verify the server is running and XO_URL is correct.`,
          { cause }
        )
      }
      if (message.includes('TimeoutError') || message.includes('abort')) {
        throw new Error(`Request to XO server timed out after ${REQUEST_TIMEOUT_MS}ms.`, { cause })
      }
      throw new Error(`Network error connecting to XO server: ${message}`, { cause })
    }

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          this.authMode === 'token'
            ? 'Authentication failed: check XO_TOKEN — the token may have expired or been revoked.'
            : 'Authentication failed: check XO_USERNAME and XO_PASSWORD.'
        )
      }
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(`XO API error (${response.status} ${response.statusText}): ${errorText}`)
    }

    return response
  }

  /** Public API for dynamic tool handlers — call any REST endpoint. */
  async apiRequest(
    method: string,
    path: string,
    options?: { query?: Record<string, string>; body?: unknown }
  ): Promise<unknown> {
    let endpoint = path.startsWith('/') ? path : `/${path}`
    if (options?.query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== '') {
          params.set(k, v)
        }
      }
      const qs = params.toString()
      if (qs) {
        endpoint += `?${qs}`
      }
    }
    const init: RequestInit = { method: method.toUpperCase() }
    if (options?.body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = JSON.stringify(options.body)
    }
    const response = await this.fetch(endpoint, init)
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<unknown>
    }
    return response.text()
  }

  /** Expose auth headers for the swagger fetcher. */
  getAuthHeaders(): Record<string, string> {
    return { ...this.authHeaders }
  }

  /** Base URL without trailing slash. */
  getBaseUrl(): string {
    return this.baseUrl
  }

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.fetch('/pools?limit=1')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async getText(endpoint: string): Promise<string> {
    const response = await this.fetch(endpoint)
    return response.text()
  }

  async getMarkdown(path: string, defaultFields: string, options?: ListOptions): Promise<string> {
    const params = new URLSearchParams()
    params.set('fields', options?.fields ?? defaultFields)
    if (options?.filter) {
      params.set('filter', options.filter)
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit))
    }
    params.set('markdown', 'true')
    const response = await this.fetch(`${path}?${params}`)
    return response.text()
  }
}
