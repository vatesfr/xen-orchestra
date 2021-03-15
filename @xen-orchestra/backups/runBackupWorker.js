const path = require('path')
const pDefer = require('promise-toolbox/defer')
const { createLogger } = require('@xen-orchestra/log')
const { fork } = require('child_process')

const { warn } = createLogger('xo:backups:backupWorker')

exports.runBackupWorker = function runBackupWorker(params, onLog) {
  const { promise, resolve, reject } = pDefer()

  const worker = fork(path.resolve(__dirname, '_backupWorker.js'))

  worker.on('exit', code => reject(new Error(`worker exited with code ${code}`)))
  worker.on('error', reject)

  worker.on('message', ({ type, data, status, result }) => {
    try {
      if (type === 'result') {
        if (status === 'success') {
          resolve(result)
        } else {
          reject(result)
        }
      } else {
        onLog(data)
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

  return promise
}
