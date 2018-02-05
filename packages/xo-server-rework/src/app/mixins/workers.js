// @flow

import { cpus as getCpus } from 'os'
import { ChildProcess, fork } from 'child_process'

const MAX = getCpus().length
const WORKER = `${__dirname}/../../worker.js`

class Task {
  data: any
  reject: (error: any) => void
  resolve: (result: any) => void

  constructor (data, resolve, reject) {
    this.data = data
    this.reject = reject
    this.resolve = resolve
  }
}

export default class Workers {
  _idleWorker: ?ChildProcess
  _nWorkers: number
  _tasksQueue: Array<Task>

  constructor () {
    this._idleWorker = undefined
    this._nWorkers = 0
    this._tasksQueue = []
  }

  callWorker (data: any): any {
    return new Promise((resolve, reject) => {
      const task = new Task(data, resolve, reject)

      const worker = this._getWorker()
      if (worker !== undefined) {
        this._submitTask(worker, task)
      } else {
        this._tasksQueue.push(task)
      }
    })
  }

  _getWorker () {
    let worker = this._idleWorker
    if (worker !== undefined) {
      this._idleWorker = undefined
      return worker
    }

    if (this._nWorkers < MAX) {
      this._nWorkers++

      worker = fork(WORKER)
      worker.on('error', error => {
        console.error('worker error', error)
      })
      worker.on('exit', (code, signal) => {
        console.log('worker exit', code, signal)
        this._nWorkers--
      })

      return worker
    }
  }

  _submitTask (worker: ChildProcess, task: Task) {
    worker.once('message', response => {
      if ('error' in response) {
        task.reject(response.error)
      } else {
        task.resolve(response.result)
      }

      const nextTask = this._tasksQueue.shift()
      if (nextTask !== undefined) {
        this._submitTask(worker, nextTask)
      } else if (this._idleWorker !== undefined) {
        worker.kill()
      } else {
        this._idleWorker = worker
      }
    })

    worker.send(task.data)
  }
}
