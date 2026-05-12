import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'

const logFile = join(tmpdir(), `xo-qa-test-${Date.now()}.log`)
const logStream = createWriteStream(logFile)
process.stderr.write(`[qa-test] debug log: ${logFile}\n`)

const fileTransport = ({ data, level, namespace, message, time }) => {
  logStream.write(JSON.stringify({ time: time.toISOString(), level, namespace, message, data }) + '\n')
}

configure([
  {
    filter: process.env.DEBUG,
    level: process.env.DEBUG_LEVEL ?? 'info',
    transport: transportConsole(),
  },
  {
    level: 'debug', // capture everything
    transport: fileTransport,
  },
])
