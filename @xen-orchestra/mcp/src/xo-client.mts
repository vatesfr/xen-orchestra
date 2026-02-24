/**
 * XO REST API Client
 *
 * Minimal client using native fetch to interact with Xen Orchestra REST API.
 * Authentication is done via Basic Auth or token cookie.
 */

import type { XoPool, XoHost, XoVm } from '@vates/types/xo'
import type { XapiVmStats, XapiStatsGranularity } from '@vates/types/common'

export type { XoPool, XoHost, XoVm, XapiVmStats, XapiStatsGranularity }

const REQUEST_TIMEOUT_MS = 30_000

export interface XoClientConfig {
  url: string
  username: string
  password: string
}

export interface XoPoolDashboard {
  hostsByStatus?: Record<string, number>
  vmsByStatus?: Record<string, number>
  topHostsByRam?: Array<{ id: string; name: string; value: number }>
  topHostsByCpu?: Array<{ id: string; name: string; value: number }>
  alarms?: Array<{ id: string; name: string; time: number }>
}

export class XoClient {
  private readonly baseUrl: string
  private readonly authHeader: string

  constructor(config: XoClientConfig) {
    this.baseUrl = config.url.replace(/\/$/, '')

    const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64')
    this.authHeader = `Basic ${credentials}`
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/rest/v0${endpoint}`

    let response: Response
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          Authorization: this.authHeader,
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
        throw new Error('Authentication failed: check XO_USERNAME and XO_PASSWORD.')
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

  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.request('/pools?limit=1')
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
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
    return this.request<XoPoolDashboard>(
      `/pools/${encodeURIComponent(poolId)}/dashboard?ndjson=false`
    )
  }

  async listHosts(options?: { filter?: string; fields?: string }): Promise<Partial<XoHost>[]> {
    const params = new URLSearchParams()
    params.set(
      'fields',
      options?.fields ?? 'id,name_label,productBrand,version,power_state'
    )
    if (options?.filter) {
      params.set('filter', options.filter)
    }

    return this.request<Partial<XoHost>[]>(`/hosts?${params}`)
  }

  async getHost(hostId: string): Promise<XoHost> {
    return this.request<XoHost>(`/hosts/${encodeURIComponent(hostId)}`)
  }

  async listVms(options?: {
    filter?: string
    fields?: string
    limit?: number
  }): Promise<Partial<XoVm>[]> {
    const params = new URLSearchParams()
    params.set('fields', options?.fields ?? 'id,name_label,power_state,CPUs,memory')
    if (options?.filter) {
      params.set('filter', options.filter)
    }
    if (options?.limit !== undefined) {
      params.set('limit', String(options.limit))
    }

    return this.request<Partial<XoVm>[]>(`/vms?${params}`)
  }

  async getVm(vmId: string): Promise<XoVm> {
    return this.request<XoVm>(`/vms/${encodeURIComponent(vmId)}`)
  }

  async getVmStats(
    vmId: string,
    granularity: XapiStatsGranularity = 'hours'
  ): Promise<XapiVmStats> {
    const params = new URLSearchParams()
    params.set('granularity', granularity)
    return this.request<XapiVmStats>(
      `/vms/${encodeURIComponent(vmId)}/stats?${params}`
    )
  }
}
