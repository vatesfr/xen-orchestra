/**
 * XO REST API Client
 *
 * Minimal client using native fetch to interact with Xen Orchestra REST API.
 * Authentication is done via Basic Auth or token cookie.
 */

import type { XoPool, XoHost, XoVm, XoVdi } from '@vates/types/xo'
import type { XapiVmStats, XapiStatsGranularity } from '@vates/types/common'

export type { XoPool, XoHost, XoVm, XoVdi, XapiVmStats, XapiStatsGranularity }

export interface ListOptions {
  filter?: string
  fields?: string
  limit?: number
}

const REQUEST_TIMEOUT_MS = 30_000

export type XoClientConfig = { url: string; username: string; password: string } | { url: string; token: string }

export interface XoPoolDashboard {
  hosts?: {
    status?: Record<string, number>
    topFiveUsage?: {
      ram?: Array<{ id: string; name_label: string; size: number; usage: number; percent: number }>
      cpu?: Array<{ id: string; name_label: string; percent: number }>
    }
  }
  vms?: {
    status?: Record<string, number>
  }
  alarms?: string[]
}

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/rest/v0${endpoint}`

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          ...this.authHeaders,
          Accept: 'application/json',
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

    try {
      return (await response.json()) as T
    } catch (cause) {
      throw new Error(`XO API returned invalid JSON for ${endpoint}`, { cause })
    }
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
    return this.request<unknown>(endpoint, init)
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
      await this.request('/pools?limit=1')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private buildListParams(defaultFields: string, options?: ListOptions): URLSearchParams {
    const params = new URLSearchParams()
    params.set('fields', options?.fields ?? defaultFields)
    if (options?.filter) {
      params.set('filter', options.filter)
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit))
    }
    return params
  }

  async listPools(fields?: string): Promise<Partial<XoPool>[]> {
    const params = new URLSearchParams()
    params.set('fields', fields ?? 'id,name_label,name_description,auto_poweron,HA_enabled')

    return this.request<Partial<XoPool>[]>(`/pools?${params}`)
  }

  async getPool(poolId: string): Promise<XoPool> {
    return this.request<XoPool>(`/pools/${encodeURIComponent(poolId)}`)
  }

  async getPoolDashboard(poolId: string): Promise<XoPoolDashboard> {
    return this.request<XoPoolDashboard>(`/pools/${encodeURIComponent(poolId)}/dashboard?ndjson=false`)
  }

  async listHosts(options?: ListOptions): Promise<Partial<XoHost>[]> {
    const params = this.buildListParams('id,name_label,productBrand,version,power_state,memory,address', options)
    return this.request<Partial<XoHost>[]>(`/hosts?${params}`)
  }

  async getHost(hostId: string): Promise<XoHost> {
    return this.request<XoHost>(`/hosts/${encodeURIComponent(hostId)}`)
  }

  async listVms(options?: ListOptions): Promise<Partial<XoVm>[]> {
    const params = this.buildListParams('id,name_label,power_state,CPUs,memory', options)
    return this.request<Partial<XoVm>[]>(`/vms?${params}`)
  }

  async listVdis(options?: ListOptions): Promise<Partial<XoVdi>[]> {
    const params = this.buildListParams('id,name_label,name_description,$SR,size,usage,VDI_type', options)
    return this.request<Partial<XoVdi>[]>(`/vdis?${params}`)
  }

  async getVm(vmId: string): Promise<XoVm> {
    return this.request<XoVm>(`/vms/${encodeURIComponent(vmId)}`)
  }

  async getVmStats(vmId: string, granularity: XapiStatsGranularity = 'hours'): Promise<XapiVmStats> {
    const params = new URLSearchParams()
    params.set('granularity', granularity)
    return this.request<XapiVmStats>(`/vms/${encodeURIComponent(vmId)}/stats?${params}`)
  }
}
