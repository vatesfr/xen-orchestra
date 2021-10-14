import { assert } from 'console'
import { EventEmitter } from 'events'

export class ConcurrencyPromise extends EventEmitter {
  #done = false

  constructor({ maxConcurrency } = {}) {
    super()
    this.maxConcurrency = maxConcurrency || 5
    this.backlog = []
    this.executing = 0
  }

  /**
   *
   * @returns <Promise> when fn is called
   */
  add(fn, context, args) {
    assert(!this.#done, `Can't add new promise when it's marked as done`)
    const toBacklog = { fn, context, args }

    toBacklog.promise = new Promise((resolve, reject) => {
      toBacklog.resolveStart = resolve
      toBacklog.rejectStart = reject
    })
    this.backlog.push(toBacklog)
    this.execute()
    return toBacklog.promise
  }

  execute() {
    if (this.backlog.length === 0 && this.executing === 0) {
      this.emit('end')
      return
    }

    if (this.executing > this.maxConcurrency) {
      return
    }
    while (this.backlog.length > 0 && this.executing < this.maxConcurrency) {
      this.executing++
      const { fn, context, args, resolveStart, rejectStart, promise } = this.backlog.shift()
      try {
        const executionPromise = Promise.resolve(fn.apply(context, args))

        // calling this will resolve the promise created by add()
        resolveStart.apply(promise, [{ promise: executionPromise, args }])

        executionPromise.then(result => {
          this.executing--
          // we can try to launch one more function during nextTick
          setImmediate(() => this.execute())
          return result
        })
      } catch (e) {
        rejectStart.apply(promise, [e]) // calling this reject the promise created by add()
        this.executing--
      }
    }
  }
  done() {
    this.#done = true
    return Promise.resolve((resolve, reject) => {
      if (this.backlog.length === 0 && this.executing === 0) {
        resolve()
      } else {
        this.on('end', () => {
          resolve()
        })
      }
    })
  }
}

/**
 * Sample usage code
 *
let count = 0;
const asyncMethod = timeout => new Promise((resolve, reject)=>{
  const index = count;
  count ++;
  setTimeout(()=>{
    resolve(index)
  }, timeout)
})
async function  start(){
  const cp = new ConcurrencyPromises()
  for(let i=0; i < 100; i++){
    const {promise, args} = await cp.add(
      asyncMethod,
      null,
      [5000, count]
    )
    console.log(new Date(), 'started done', args)
    promise.then((res)=> console.log(new Date(),'execution done ', res))
  }
  console.log(new Date(),'everything is launched')
  await cp.done()
  console.log(' all the promised resolved')
}
start()
 */
