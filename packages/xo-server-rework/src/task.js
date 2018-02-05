import toDecorator from './to-decorator'
import { EventEmitter } from 'events'
import { CancelToken } from 'promise-toolbox'

class Task extends EventEmitter {
  constructor (name, { cancelToken, parent, steps } = {}) {
    super()

    this._cancelToken = cancelToken || (parent && parent.cancelToken)
    this._name = name
    this._step = 0
    this._steps = steps || 0
  }

  get cancelToken () {
    return this._cancelToken
  }

  plan (n) {
    this._steps += n
  }

  step (stepName) {
    this.emit('progress', {
      step: ++this._step,
      stepName,
      steps: this._steps,
    })

    const token = this._cancelToken
    token && token.throwIfRequested()
  }
}

export default opts =>
  toDecorator(
    fn =>
      function () {
        const { name = fn.name, steps } = opts || {}

        const n = arguments.length
        const i = 0
        let task
        if (n !== 0) {
          const arg = arguments[0]
          if (arg instanceof Task) {
            task = new Task(name, { parent: arg, steps })
          } else if (CancelToken.isCancelToken(arg)) {
            task = new Task(name, { cancelToken: arg, steps })
          }
        }
        if (task === undefined) {
          task = new Task(name, { steps })
        }

        const args = new Array(i + n)
        args[0] = task
        for (let j = 1; j < n; ++j) {
          args[j] = arguments[j + i]
        }

        const promise = new Promise(resolve => resolve(fn.apply(this, args)))
        promise.onProgress = cb => {
          task.on('progress', cb)

          return () => task.removeListener('progress', cb)
        }

        return promise
      }
  )
