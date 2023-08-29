import { createLogger } from '@xen-orchestra/log'
import { fork } from 'child_process'

const { warn } = createLogger('xo:backups:backupWorker')

const PATH = new URL('_backupWorker.mjs', import.meta.url).pathname

export function runBackupWorker(params, onLog) {
  return new Promise((resolve, reject) => {
    const worker = fork(PATH)

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
