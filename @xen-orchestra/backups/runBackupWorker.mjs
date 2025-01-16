import { createLogger } from '@xen-orchestra/log'
import { fork } from 'child_process'

const { warn } = createLogger('xo:backups:backupWorker')

const PATH = new URL('_backupWorker.mjs', import.meta.url).pathname
const DEFAULT_INSPECTOR_PORT = 9229

export function runBackupWorker(params, onLog) {
  return new Promise((resolve, reject) => {
    // run Node inspector on port+1 if --inspect or --inspect-brk
    const inspectArg = process.execArgv.find(arg => arg.startsWith('--inspect') || arg.startsWith('--inspect-brk'))
    const execArgv = inspectArg
      ? [
          inspectArg.replace(/^(--inspect(-brk)?)(=([^:]+:)?(\d+))?$/, (_, prefix, brk, _fullMatch, host, port) => {
            const basePort = port ? parseInt(port) : DEFAULT_INSPECTOR_PORT
            return `${prefix}=${host || ''}${basePort + 1}`
          }),
        ]
      : []

    const worker = fork(PATH, [], { execArgv })

    worker.on('exit', (code, signal) => reject(new Error(`worker exited with code ${code} and signal ${signal}`)))
    worker.on('error', reject)

    worker.on('message', message => {
      try {
        if (message.type === 'result') {
          if (message.status === 'success') {
            resolve(message.result)
          } else {
            reject(message.result)
          }
        } else if (message.type === 'log') {
          onLog(message.data)
        }
      } catch (error) {
        warn(error)
      }
    })

    worker.send({
      action: 'run',
      data: params,
      runWithLogs: onLog !== undefined,
    })
  })
}
