#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MCP_CLIENT_HEADER, XoClient } from './xo-client.mjs'
import { createServer } from './server.mjs'
import { getProxyDispatcher, type FetchInit } from './utils/proxy.mjs'

const BOOT_CHECK_TIMEOUT_MS = 10_000

export { createServer }
export { fetchDocumentation } from './tools/utility/search-docs.mjs'

export type EnvConfig = { url: string; username: string; password: string } | { url: string; token: string }

export function validateEnv(): EnvConfig {
  const url = process.env.XO_URL
  const token = process.env.XO_TOKEN
  const username = process.env.XO_USERNAME
  const password = process.env.XO_PASSWORD

  if (!url) {
    throw new Error(
      'Missing required environment variable: XO_URL\n\n' +
        'Please set:\n' +
        '  XO_URL - Xen Orchestra server URL (e.g., http://xo.local:9000)'
    )
  }

  if (token) return { url, token }

  const missing: string[] = []
  if (!username) missing.push('XO_USERNAME')
  if (!password) missing.push('XO_PASSWORD')

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n\n` +
        'Please set either:\n' +
        '  XO_TOKEN    - Authentication token (from XO user page or xo-cli create-token)\n\n' +
        'Or both:\n' +
        '  XO_USERNAME - Admin username\n' +
        '  XO_PASSWORD - Password'
    )
  }

  return { url, username: username!, password: password! }
}

export async function assertMcpEnabled(xoUrl: string): Promise<void> {
  const url = `${xoUrl.replace(/\/$/, '')}/rest/v0/mcp/status`

  let response: Response
  try {
    const init: FetchInit = {
      headers: { ...MCP_CLIENT_HEADER },
      signal: AbortSignal.timeout(BOOT_CHECK_TIMEOUT_MS),
      dispatcher: getProxyDispatcher(),
    }
    response = await fetch(url, init)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`Unable to reach XO server at ${xoUrl} to verify MCP status: ${message}`, { cause })
  }

  if (response.ok) {
    return
  }

  // A fetch Response body can only be read once, so read it as text first and
  // then attempt to parse it as JSON instead of chaining `.json()` and `.text()`
  // — the second call would throw "Body is unusable".
  const text = await response.text().catch(() => '')
  let body: { error?: string } | undefined
  try {
    body = text === '' ? undefined : (JSON.parse(text) as { error?: string })
  } catch {
    body = undefined
  }

  // The kill-switch can manifest as either 503 (from `/mcp/status`) or 403
  // (from `mcp-gate` on any other route) — both must terminate the binary
  // with the same message.
  if ((response.status === 503 || response.status === 403) && body?.error === 'mcp_disabled') {
    throw new Error('MCP disabled by admin')
  }

  throw new Error(`Unable to verify MCP status (HTTP ${response.status}): ${text || response.statusText}`)
}

export async function main() {
  const env = validateEnv()

  await assertMcpEnabled(env.url)

  let xoClient: XoClient | null = null
  function getClient(): XoClient {
    if (!xoClient) xoClient = new XoClient(env)
    return xoClient
  }

  const server = await createServer(getClient)
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

// realpathSync handles invocation via a symlink (e.g. the published bin).
if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  // stdout is reserved for JSON-RPC — all logging MUST go to stderr.
  main().catch(error => {
    console.error('Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
