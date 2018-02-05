/* eslint-env jest */

import { CancelToken } from 'promise-toolbox'

import task from './task'

// ===================================================================

const rejectionOf = promise =>
  promise.then(result => {
    throw result
  }, reason => reason)

// ===================================================================

const sleep = () => new Promise(resolve => setTimeout(resolve, 0))

describe('@task', () => {
  const fn = task()(async $task => {
    await sleep()
    $task.step('foo')
    await sleep()
    $task.step('bar')
    await sleep()
    $task.step('baz')
  })

  it('', () => {
    const promise = fn()
    promise.onProgress((...args) => console.log(args))

    return promise
  })

  it('supports cancel tokens', async () => {
    const { cancel, token } = CancelToken.source()
    const promise = fn(token)

    cancel('foo')
    expect((await rejectionOf(promise)).message).toBe('foo')
  })

  it('supports subtasks', async () => {
    const fn2 = task()(async $task => {
      await sleep()
      await fn($task)
      await sleep()
      await fn($task)
    })

    const promise = fn2()
    await promise
  })
})
