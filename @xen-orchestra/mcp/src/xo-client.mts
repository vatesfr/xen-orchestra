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
        headers: { ...this.authHeaders, ...options.headers },
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

  /**
   * Generic REST call. Returns a string for text/markdown responses, a parsed
   * object/array for JSON responses. Callers that want markdown should set
   * `query.markdown = 'true'`; the server ignores it when the endpoint does
   * not support markdown rendering.
   */
  async apiRequest(
    method: string,
    path: string,
    options?: { query?: Record<string, string>; body?: unknown }
  ): Promise<unknown> {
    let endpoint = path.startsWith('/') ? path : `/${path}`
    if (options?.query) {
      const params = new URLSearchParams()
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined && v !== '') params.set(k, v)
      }
      const qs = params.toString()
      if (qs) endpoint += `?${qs}`
    }

    const init: RequestInit = { method: method.toUpperCase() }
    if (options?.body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' }
      init.body = JSON.stringify(options.body)
    }

    const response = await this.fetch(endpoint, init)
    const contentType = response.headers.get('content-type') ?? ''
    return contentType.includes('application/json') ? ((await response.json()) as unknown) : await response.text()
  }

  getAuthHeaders(): Record<string, string> {
    return { ...this.authHeaders }
  }

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
}
