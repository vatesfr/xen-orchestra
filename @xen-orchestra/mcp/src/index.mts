#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { XoClient } from './xo-client.mjs'
import { createServer } from './server.mjs'

export { createServer }
export { fetchDocumentation } from './tools/utility/search-docs.mjs'

export type EnvConfig = { url: string; username: string; password: string } | { url: string; token: string }

/**
 * Warn (never throw) about malformed proxy env vars. We tolerate everything —
 * the MCP must keep working even if `HTTP_PROXY` is junk; undici will simply
 * fall back to a direct connection in that case.
 *
 * Lookup order (`lowercase ?? UPPERCASE`) matches undici's
 * `EnvHttpProxyAgent` so we validate the value undici will actually use.
 */
export function validateProxyEnv(emit: (msg: string) => void = msg => console.error(msg)): void {
  const httpProxy = process.env.http_proxy ?? process.env.HTTP_PROXY
  const httpsProxy = process.env.https_proxy ?? process.env.HTTPS_PROXY
  const noProxy = process.env.no_proxy ?? process.env.NO_PROXY

  const isSet = (v: string | undefined): v is string => v !== undefined && v !== ''

  const checkUrl = (name: string, value: string) => {
    let url: URL
    try {
      url = new URL(value)
    } catch {
      emit(
        `${name} does not look like a valid URL — proxying may fail. ` +
          'Expected format: http://host:port (with optional user:pass@).'
      )
      return
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      emit(
        `${name} uses unsupported scheme "${url.protocol}" — proxying will be skipped. ` +
          'Only http: and https: are valid for proxy URLs.'
      )
    }
  }

  if (isSet(httpProxy)) checkUrl('HTTP_PROXY', httpProxy)
  if (isSet(httpsProxy)) checkUrl('HTTPS_PROXY', httpsProxy)
  if (!isSet(httpProxy) && !isSet(httpsProxy) && isSet(noProxy)) {
    emit('NO_PROXY is set but neither HTTP_PROXY nor HTTPS_PROXY is — NO_PROXY has no effect on its own.')
  }
}

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

  validateProxyEnv()

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

export async function main() {
  const env = validateEnv()

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
