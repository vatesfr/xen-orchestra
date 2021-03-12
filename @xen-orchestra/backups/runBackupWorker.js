const path = require('path')
const pDefer = require('promise-toolbox/defer')
const { createLogger } = require('@xen-orchestra/log')
const { fork } = require('child_process')

const { warn } = createLogger('xo:backups:runBackupWorker')

exports.runBackupWorker = function runBackupWorker(params, onLog) {
  const { promise, resolve, reject } = pDefer()

  const worker = fork(path.resolve(__dirname, '_backupWorker.js'))

  worker.on('exit', code => reject(new Error(`worker exited with code ${code}`)))
  worker.on('error', reject)

  worker.on('message', log => {
    try {
      if (log.workerEnd) {
        if (log.error !== undefined) {
          reject(log.error)
        } else {
          resolve(log.result)
        }
      } else {
        onLog(log)
      }
    } catch (error) {
      warn(error)
    }
  })

  worker.send({
    runWithLogs: onLog !== undefined,
    ...params,
  })

  return promise
}
