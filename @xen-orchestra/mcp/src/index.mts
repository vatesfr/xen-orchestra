#!/usr/bin/env node
/**
 * XO MCP Server
 *
 * Model Context Protocol server for Xen Orchestra.
 * Allows AI assistants to query and manage XO infrastructure.
 *
 * Usage:
 *   XO_URL=http://xo.local XO_USERNAME=admin XO_PASSWORD=*** node dist/index.mjs
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { realpathSync } from 'node:fs'
import { XoClient } from './xo-client.mjs'

// Re-export for backward compatibility (used by tests and bin entry point)
import { createServer } from './server.mjs'
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

  // Token auth takes priority
  if (token) {
    return { url, token }
  }

  // Fall back to Basic Auth
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
    if (!xoClient) {
      xoClient = new XoClient(env)
    }
    return xoClient
  }

  const server = createServer(getClient)

  const transport = new StdioServerTransport()
  await server.connect(transport)
}

// Only run main when executed directly (not when imported for testing)
// realpathSync handles the case where the binary is invoked via a symlink (e.g., npx bin)
import { fileURLToPath } from 'node:url'
if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  // console.error is used intentionally instead of @xen-orchestra/log because
  // MCP servers communicate via stdout (JSON-RPC) — only stderr is safe for logging.
  main().catch(error => {
    console.error('Fatal error:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
