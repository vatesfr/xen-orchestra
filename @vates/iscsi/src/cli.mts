#!/usr/bin/env node
import { stat, truncate, writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { parseArgs } from 'node:util'

import { FileBlockDevice, IscsiTarget } from './index.mjs'

const USAGE = `Usage: vates-iscsi <file> [options]

Serve a single read/write iSCSI LUN backed by <file>.

Arguments:
  <file>                  Backing file. Must exist and have a size that is a
                          multiple of the block size, unless --size is given.

Options:
  --serial <serial>       LUN serial number (default: derived from the IQN).
  --size <bytes>          Create/grow the backing file to this many bytes.
                          Accepts suffixes K, M, G, T (e.g. 10G).
  --iqn <iqn>             Target IQN (default: iqn.2024-01.tech.vates:<file>).
  --host <host>           Listen address (default: 0.0.0.0).
  --port <port>           Listen port (default: 3260).
  --block-size <bytes>    Logical block size (default: 512).
  -h, --help              Show this help.
`

function fail(message: string): never {
  process.stderr.write(`vates-iscsi: ${message}\n`)
  process.exit(1)
}

/** Parse a positive integer with optional K/M/G/T suffix (powers of 1024). */
function parseSize(value: string, label: string): number {
  const match = /^(\d+)([KMGT]?)$/i.exec(value.trim())
  if (match === null) {
    fail(`invalid ${label}: ${value}`)
  }
  const units: Record<string, number> = { '': 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 }
  return Number(match[1]) * units[match[2].toUpperCase()]
}

/** Sanitize a string into the characters allowed in the IQN-specific part. */
function sanitizeIqnPart(value: string): string {
  const cleaned = value.toLowerCase().replace(/[^a-z0-9.-]+/g, '-').replace(/^-+|-+$/g, '')
  return cleaned.length > 0 ? cleaned : 'lun0'
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    serial: { type: 'string' },
    size: { type: 'string' },
    iqn: { type: 'string' },
    host: { type: 'string' },
    port: { type: 'string' },
    'block-size': { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help || positionals.length === 0) {
  process.stdout.write(USAGE)
  process.exit(values.help ? 0 : 1)
}
if (positionals.length > 1) {
  fail(`expected a single <file>, got ${positionals.length}`)
}

const path = positionals[0]
const blockSize = values['block-size'] !== undefined ? parseSize(values['block-size'], 'block size') : 512
const port = values.port !== undefined ? Number.parseInt(values.port, 10) : 3260
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  fail(`invalid port: ${values.port}`)
}

// Create/grow the backing file when --size is requested.
if (values.size !== undefined) {
  const size = parseSize(values.size, 'size')
  if (size % blockSize !== 0) {
    fail(`--size (${size}) must be a multiple of the block size (${blockSize})`)
  }
  const exists = await stat(path).then(
    () => true,
    () => false
  )
  if (!exists) {
    await writeFile(path, Buffer.alloc(0))
  }
  await truncate(path, size)
}

// Validate the backing file before binding the socket.
const stats = await stat(path).catch(() => fail(`backing file not found: ${path} (create one, e.g. \`truncate -s 10G ${path}\`, or pass --size)`))
if (stats.size === 0) {
  fail(`backing file is empty: ${path} (size it first, e.g. \`truncate -s 10G ${path}\`, or pass --size)`)
}

const iqn = values.iqn ?? `iqn.2024-01.tech.vates:${sanitizeIqnPart(basename(path).replace(/\.[^.]+$/, ''))}`

const target = new IscsiTarget({
  iqn,
  host: values.host,
  port,
  lun: new FileBlockDevice({ path, blockSize }),
  identity: values.serial !== undefined ? { serial: values.serial } : undefined,
})

await target.listen()

const address = target.address()
const listenHost = values.host ?? '0.0.0.0'
const listenPort = address?.port ?? port
process.stdout.write(
  [
    `iSCSI target listening on ${listenHost}:${listenPort}`,
    `  IQN:     ${iqn}`,
    `  LUN:     ${path} (${stats.size} bytes, ${blockSize}-byte blocks)`,
    `  serial:  ${values.serial ?? iqn}`,
    ``,
    `Discover with:  iscsiadm -m discovery -t sendtargets -p ${listenHost === '0.0.0.0' ? '127.0.0.1' : listenHost}:${listenPort}`,
    `Press Ctrl-C to stop.`,
    ``,
  ].join('\n')
)

let stopping = false
function stop(): void {
  if (stopping) {
    return
  }
  stopping = true
  target.close().then(
    () => process.exit(0),
    error => {
      process.stderr.write(`vates-iscsi: error on shutdown: ${String(error)}\n`)
      process.exit(1)
    }
  )
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
