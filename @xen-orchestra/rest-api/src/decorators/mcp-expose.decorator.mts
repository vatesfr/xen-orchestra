/**
 * MCP exposure decision attached per endpoint via
 * `@Extension('x-mcp-exposure', value)` (tsoa). `'allow'` → exposed,
 * `'confirm'` → exposed only with `XO_MCP_ENABLE_ACTIONS=1`, `'deny'`/absent →
 * never exposed. Presence is enforced by the `mcp/require-mcp-expose` lint
 * rule; absence means deny.
 */
export type McpExposure = 'allow' | 'confirm' | 'deny'

export const MCP_EXPOSURE_EXTENSION_KEY = 'x-mcp-exposure' as const
