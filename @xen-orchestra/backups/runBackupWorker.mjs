import { createLogger } from '@xen-orchestra/log'
import { fork } from 'child_process'

const { warn } = createLogger('xo:backups:backupWorker')

const PATH = new URL('_backupWorker.mjs', import.meta.url).pathname

export function runBackupWorker(params, onLog) {
  return new Promise((resolve, reject) => {
    const inspectArg = process.execArgv.find(arg => arg.startsWith('--inspect'))
    const execArgv = inspectArg
      ? [inspectArg.replace(/^(--inspect)(=.*)?$/, (_, prefix) => `${prefix}=localhost:9230`)]
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
