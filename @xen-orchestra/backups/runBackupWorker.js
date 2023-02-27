'use strict'

const path = require('path')
const { createLogger } = require('@xen-orchestra/log')
const { fork } = require('child_process')

const { warn } = createLogger('xo:backups:backupWorker')

const PATH = path.resolve(__dirname, '_backupWorker.js')

exports.runBackupWorker = function runBackupWorker(params, onLog) {
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
