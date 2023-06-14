const noop = Function.prototype

const BARRIER = Symbol('runAsync.BARRIER')

export default function runAsync(stack, worker, { concurrency = 10, signal, stopOnError = true } = {}) {
  return new Promise((resolve, reject) => {
    const errors = []
    let onAbort
    let working = 0

    if (signal !== undefined) {
      onAbort = () => {
        stop(reject, signal.reason)
      }
      signal.addEventListener('abort', onAbort)
    }

    function stop(cb, arg) {
      if (run !== noop) {
        run = noop
        if (signal !== undefined) {
          signal.removeEventListener('abort', onAbort)
        }
        cb(arg)
      }
    }
    function push(...args) {
      stack.push(...args)
      run()
    }
    async function runOne(entry) {
      ++working
      try {
        await worker(entry, push)
      } catch (error) {
        if (stopOnError) {
          stop(reject, error)
        } else {
          errors.push(error)
        }
      }
      --working
      run()
    }
    let run = function () {
      if (stack.length === 0) {
        if (working === 0) {
          if (errors.length !== 0) {
            stop(reject, new AggregateError(errors))
          } else {
            stop(resolve)
          }
        }
        return
      }

      while (working < concurrency && stack.length !== 0) {
        const entry = stack.pop()
        if (entry === BARRIER) {
          if (working === 0) {
            continue
          } else {
            stack.push(entry)
            return
          }
        }
        runOne(entry)
      }
    }
    run()
  })
}

runAsync.BARRIER = BARRIER
