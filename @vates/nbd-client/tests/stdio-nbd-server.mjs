#!/usr/bin/env node

// Read-only NBD server serving a file through its standard streams, à la
// `nbdkit -s`. Used by nbdstdio.integ.mjs, since nbdkit is not necessarily
// installed on the test machine.
//
// Usage: stdio-nbd-server.mjs <file> [--export-name=NAME] [--die-after=N]
//
// --die-after=N exits with a failure after having answered N read requests, to
// exercise the reconnection path of the client.

import fs from 'node:fs/promises'
import { serveNbd } from './fake-nbd-server.mjs'

const args = process.argv.slice(2)
const path = args.find(arg => !arg.startsWith('--'))
if (path === undefined) {
  console.error('usage: stdio-nbd-server.mjs <file> [--export-name=NAME] [--die-after=N]')
  process.exit(64)
}

const getOption = (name, defaultValue) => {
  const prefix = `--${name}=`
  const arg = args.find(arg => arg.startsWith(prefix))
  return arg === undefined ? defaultValue : arg.slice(prefix.length)
}

const exportName = getOption('export-name', '')
const dieAfter = Number(getOption('die-after', Infinity))

const data = await fs.readFile(path)

let answered = 0

try {
  await serveNbd({
    readable: process.stdin,
    writable: process.stdout,
    data,
    exportName,
    errorCode: () => {
      if (++answered > dieAfter) {
        console.error(`stdio-nbd-server: dying after ${dieAfter} read(s)`)
        process.exit(1)
      }
      return 0
    },
  })
} catch (error) {
  console.error('stdio-nbd-server:', error)
  process.exit(1)
}
