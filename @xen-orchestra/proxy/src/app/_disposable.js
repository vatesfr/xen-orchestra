import defer from 'promise-toolbox/defer'
import Resource from 'promise-toolbox/_Resource'

async function helper(gen, resolve, disposers) {
  let resourceValue
  while (true) {
    const { value } = await gen.next(resourceValue)
    if (value instanceof Resource) {
      resourceValue = await value.p
      disposers.push(value.d)
    } else {
      return resolve(value)
    }
  }
}

// inspired by https://github.com/tc39/proposal-explicit-resource-management
export const disposable = (genFn, onStop) =>
  function () {
    const gen = genFn.apply(this, arguments)

    const { promise, reject, resolve } = defer()
    const disposers = []
    const dispose = async () => {
      let disposer
      while ((disposer = disposers.pop()) !== undefined) {
        await disposer()
      }
    }
    helper(gen, resolve, disposers).catch(error => {
      reject(error)
      return dispose()
    })

    const resourceDisposer = async value => {
      await gen.return(value)
      await dispose()
    }
    onStop.apply(this, [dispose, ...arguments])
    return new Resource(promise, resourceDisposer)
  }
