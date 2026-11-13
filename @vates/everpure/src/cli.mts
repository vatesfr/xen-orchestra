#!/usr/bin/env node
import { parseArgs } from 'node:util'

import { EverpureClient, EverpureError } from './index.mjs'

const USAGE = `Usage: vates-everpure [options] <command> [arguments]

Talk to an Everpure (Pure Storage FlashArray) REST API 2.x.

Commands:
  volume create <name> <size>           Create an empty thin volume (size: 512-multiple,
                                        suffixes K/M/G/T accepted).
  volume delete <name>                  Destroy and eradicate a volume (must be disconnected).
  snapshot list <volume>                List the snapshots of a volume.
  snapshot create <volume> [<suffix>]   Snapshot a volume as <volume>.<suffix>.
  snapshot delete <snapshot>            Destroy and eradicate a snapshot.
  diff <snapshot> [--base <snapshot>]   List the allocated blocks of a snapshot,
                                        or the blocks changed since --base.

Options:
  --array <url>            Array URL (default: $EVERPURE_URL).
  --token <api token>      API token (default: $EVERPURE_API_TOKEN).
  --insecure               Accept an untrusted or self-signed certificate.
  --base <snapshot>        diff: compare against this snapshot.
  --block-size <bytes>     diff: granularity, multiple of 512 (default: 2M).
  --segment-length <bytes> diff: query the volume by segments of this size
                           (default: whole volume in one query).
  --json                   diff: one JSON object per line instead of
                           "<offset> <length>".
  -h, --help               Show this help.
`

function fail(message: string): never {
  process.stderr.write(`vates-everpure: ${message}\n`)
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

function formatBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`
}

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    array: { type: 'string' },
    token: { type: 'string' },
    insecure: { type: 'boolean' },
    base: { type: 'string' },
    'block-size': { type: 'string' },
    'segment-length': { type: 'string' },
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
})

if (values.help === true || positionals.length === 0) {
  process.stdout.write(USAGE)
  process.exit(values.help === true ? 0 : 1)
}

const url = values.array ?? process.env.EVERPURE_URL
const apiToken = values.token ?? process.env.EVERPURE_API_TOKEN
if (url === undefined || apiToken === undefined) {
  fail('--array and --token (or EVERPURE_URL and EVERPURE_API_TOKEN) are required')
}

const client = new EverpureClient({ url, apiToken, allowUnauthorized: values.insecure === true })

async function run([command, ...args]: ReadonlyArray<string>): Promise<void> {
  if (command === 'volume') {
    const [action, name, size] = args
    if (name === undefined) {
      fail(`volume ${action ?? ''}: missing argument\n${USAGE}`)
    }
    if (action === 'create') {
      if (size === undefined) {
        fail(`volume create: missing size\n${USAGE}`)
      }
      const volume = await client.createVolume(name, { provisioned: parseSize(size, 'size') })
      process.stdout.write(`${volume.name}\t${formatBytes(volume.provisioned)}\tserial ${volume.serial}\n`)
      return
    }
    if (action === 'delete') {
      const { eradicated } = await client.deleteVolume(name)
      process.stdout.write(`${name} ${eradicated ? 'eradicated' : 'destroyed, pending eradication'}\n`)
      return
    }
    fail(`unknown volume action: ${action ?? ''}\n${USAGE}`)
  }

  if (command === 'snapshot') {
    const [action, name, suffix] = args
    if (name === undefined) {
      fail(`snapshot ${action ?? ''}: missing argument\n${USAGE}`)
    }
    if (action === 'list') {
      for await (const snapshot of client.listVolumeSnapshots(name)) {
        const flags = snapshot.destroyed ? ' (destroyed)' : ''
        process.stdout.write(
          `${snapshot.name}\t${new Date(snapshot.created).toISOString()}\t${formatBytes(snapshot.provisioned)}${flags}\n`
        )
      }
      return
    }
    if (action === 'create') {
      const snapshot = await client.createVolumeSnapshot(name, { suffix })
      process.stdout.write(`${snapshot.name}\n`)
      return
    }
    if (action === 'delete') {
      const { eradicated } = await client.deleteVolumeSnapshot(name)
      process.stdout.write(`${name} ${eradicated ? 'eradicated' : 'destroyed, pending eradication'}\n`)
      return
    }
    fail(`unknown snapshot action: ${action ?? ''}\n${USAGE}`)
  }

  if (command === 'diff') {
    const [name] = args
    if (name === undefined) {
      fail(`diff: missing snapshot name\n${USAGE}`)
    }
    const blockSize = parseSize(values['block-size'] ?? '2M', 'block size')
    const segmentLength =
      values['segment-length'] === undefined ? undefined : parseSize(values['segment-length'], 'segment length')
    let count = 0
    let bytes = 0
    for await (const range of client.listChangedBlocks({ name, baseName: values.base, blockSize, segmentLength })) {
      count++
      bytes += range.length
      process.stdout.write(values.json === true ? `${JSON.stringify(range)}\n` : `${range.offset} ${range.length}\n`)
    }
    process.stderr.write(
      `${count} ranges, ${formatBytes(bytes)} (${bytes / blockSize} blocks of ${formatBytes(blockSize)})\n`
    )
    return
  }

  fail(`unknown command: ${command}\n${USAGE}`)
}

try {
  await client.connect()
  try {
    await run(positionals)
  } finally {
    await client.close()
  }
} catch (error) {
  if (error instanceof EverpureError) {
    fail(error.message)
  }
  throw error
}
