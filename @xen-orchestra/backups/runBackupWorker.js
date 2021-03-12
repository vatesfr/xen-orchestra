const path = require('path')
const pDefer = require('promise-toolbox/defer')
const { fork } = require('child_process')

exports.runBackupWorker = function runBackupWorker(params, onLog) {
  const { promise, resolve, reject } = pDefer()

  const worker = fork(path.resolve(__dirname, '_backupWorker.js'))

  worker.on('exit', code => reject(new Error(`worker exited with code ${code}`)))
  worker.on('error', reject)

  worker.on('message', log => {
    if (log.workerEnd) {
      worker.disconnect()

      if (log.error !== undefined) {
        reject(log.error)
      } else {
        resolve(log.result)
      }
    } else {
      onLog(log)
    }
  })

  worker.send({
    runWithLogs: onLog !== undefined,
    ...params,
  })

  return promise
}
