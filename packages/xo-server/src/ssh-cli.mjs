#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { createClient as createRedisClient } from 'redis'
import { Client } from 'ssh2'
import appConf from 'app-conf'

import RedisCollection from './collection/redis.mjs'

async function getServersDb(connection) {
  return new RedisCollection({
    connection,
    indexes: await connection.sMembers('xo:server::indexes'),
    namespace: 'server',
  })
}

export function findPool(pools, poolId) {
  return pools.find(p => p.id === poolId || p.host === poolId)
}

export function printUsage(pools) {
  process.stdout.write(`
xo-server-ssh <poolId> [ip]

  Open an interactive SSH session to an XCP-ng host using pool credentials.

  <poolId>   Pool UUID or master IP
  [ip]       Target host IP or DNS (defaults to pool master)

  tmux usage (on the remote host):
    tmux new -A -s support   create or re-attach to a session named "support"
    tmux ls                  list existing sessions
    tmux a -t <name>         attach to an existing session

Registered pools:
`)

  if (pools.length === 0) {
    process.stdout.write('  (none)\n\n')
    return
  }

  const idW = 36
  const ipW = 20
  process.stdout.write(`  ${'UUID'.padEnd(idW)}  ${'Master IP'.padEnd(ipW)}  Label\n`)
  process.stdout.write(`  ${'-'.repeat(idW)}  ${'-'.repeat(ipW)}  -----\n`)
  for (const pool of pools) {
    process.stdout.write(`  ${pool.id.padEnd(idW)}  ${(pool.host ?? '').padEnd(ipW)}  ${pool.poolNameLabel ?? ''}\n`)
  }
  process.stdout.write('\n')
}

export async function openShell({ host, port, username, password }) {
  process.stderr.write(`Warning: SSH host key for ${host} is not verified.\n`)

  const conn = new Client()

  await new Promise((resolve, reject) => {
    conn.on('ready', () => {
      conn.shell(
        {
          // force xterm-256color: XCP-ng hosts are minimal and may lack exotic terminfo entries
          term: 'xterm-256color',
          rows: process.stdout.rows ?? 24,
          cols: process.stdout.columns ?? 80,
        },
        (err, stream) => {
          if (err) {
            conn.end()
            return reject(err)
          }

          if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
          }
          process.stdin.pipe(stream)
          stream.pipe(process.stdout)

          const onResize = () => stream.setWindow(process.stdout.rows, process.stdout.columns, 0, 0)
          process.stdout.on('resize', onResize)

          stream.on('close', () => {
            process.stdout.removeListener('resize', onResize)
            process.stdin.unpipe(stream)
            if (process.stdin.isTTY) {
              process.stdin.setRawMode(false)
            }
            conn.end()
            resolve()
          })
        }
      )
    })

    conn.on('error', reject)

    conn.connect({
      host,
      port,
      username,
      password,
      // host key verification disabled: XCP-ng hosts use self-signed keys
      hostVerifier: () => true,
    })
  })
}

async function main(args) {
  const showHelp = args.length === 0 || args.includes('-h') || args.includes('--help')

  const config = await appConf.load('xo-server', {
    appDir: new URL('..', import.meta.url).pathname,
    ignoreUnknownFormats: true,
  })

  const { socket: path, uri: url } = config.redis ?? {}
  const connection = createRedisClient({ socket: { path }, url })
  await connection.connect()

  let pool, targetIp

  try {
    const db = await getServersDb(connection)
    const pools = await db.get({})

    if (showHelp) {
      printUsage(pools)
      return
    }

    const poolId = args[0]
    pool = findPool(pools, poolId)

    if (pool === undefined) {
      process.stderr.write(`Error: pool not found: ${poolId}\n\n`)
      printUsage(pools)
      process.exitCode = 1
      return
    }

    if (!pool.username || !pool.password) {
      throw new Error(`incomplete credentials for pool ${pool.id}`)
    }

    targetIp = args[1] ?? pool.host
  } finally {
    await connection.quit()
  }

  await openShell({
    host: targetIp,
    port: 22,
    username: pool.username,
    password: pool.password,
  })
}

if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(err => {
    process.stderr.write(err.message + '\n')
    process.exit(1)
  })
}
