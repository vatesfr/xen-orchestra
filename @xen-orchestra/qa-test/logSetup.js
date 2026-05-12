import { createWriteStream } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { inspect } from 'node:util'
import transportConsole from '@xen-orchestra/log/transports/console'
import { configure } from '@xen-orchestra/log/configure'

const logFile = join(tmpdir(), `xo-qa-test-${Date.now()}.log`)
const logStream = createWriteStream(logFile)
process.stderr.write(`[qa-test] debug log: ${logFile}\n`)

const LEVEL_NAMES = { 20: 'DEBUG', 30: 'INFO', 40: 'WARN', 50: 'ERROR', 60: 'FATAL' }

const fileTransport = ({ data, level, namespace, message, time }) => {
  const levelName = (LEVEL_NAMES[level] ?? String(level)).padEnd(5)
  const dataStr = data != null ? '  ' + inspect(data, { depth: 3, breakLength: Infinity, compact: true }) : ''
  logStream.write(`${time.toISOString()}  ${levelName}  ${namespace.padEnd(28)}  ${message}${dataStr}\n`)
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
