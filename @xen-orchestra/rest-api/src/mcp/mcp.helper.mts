import type { RestApi } from '../rest-api/rest-api.mjs'

// Single source of truth for reading the MCP kill-switch flag. Defaults to
// `true` so legacy configs without a `[mcp]` section keep MCP enabled.
export function isMcpEnabled(restApi: RestApi): boolean {
  return restApi.xoApp.config.getOptional<boolean>('mcp.enabled') ?? true
}

// Wire-level identifier used by the kill-switch contract; shared between the
// gate middleware (`@xen-orchestra/rest-api`) and the controller response.
export const MCP_DISABLED_ERROR = 'mcp_disabled'

// Whitelisted by `mcp-gate` so the MCP binary can probe the kill-switch
// state at boot even when MCP is globally disabled.
export const MCP_STATUS_PATH = '/mcp/status'
