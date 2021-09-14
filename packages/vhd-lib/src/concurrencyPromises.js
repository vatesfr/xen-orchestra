import { EventEmitter } from 'events'

export default class ConcurrencyPromises extends EventEmitter {
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
  cp.on('end' , ()=>{
    console.log(new Date(),'no more backlog');
  })
}

start()

 */
