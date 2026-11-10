import { createServer } from 'node:http'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'
import { strict as assert } from 'node:assert'

import { Xapi } from './index.mjs'

// a client with no connection: `_sessionCall` and `watchTask` are faked and the calls are recorded
function createXapi() {
  const xapi = new Xapi({ url: 'https://user:password@127.0.0.1', watchEvents: false })
  const calls = []
  xapi._sessionCall = async (method, args) => {
    calls.push([method, ...args])
    return method.startsWith('Async.') ? 'OpaqueRef:task' : undefined
  }
  xapi.watchTask = async () => 'result'
  return { calls, xapi }
}

test('no signal: arguments are unchanged', async () => {
  const { calls, xapi } = createXapi()

  assert.equal(await xapi.callAsync('VM.start', 'ref', false), 'result')
  assert.deepEqual(calls[0], ['Async.VM.start', 'ref', false])
})

test('a leading AbortSignal is not forwarded to XAPI', async () => {
  const { calls, xapi } = createXapi()
  const { signal } = new AbortController()

  assert.equal(await xapi.callAsync(signal, 'VM.start', 'ref', false), 'result')
  assert.deepEqual(calls[0], ['Async.VM.start', 'ref', false])
})

test('a leading undefined is treated as an empty signal slot', async () => {
  const { calls, xapi } = createXapi()

  assert.equal(await xapi.callAsync(undefined, 'VM.start', 'ref', false), 'result')
  assert.deepEqual(calls[0], ['Async.VM.start', 'ref', false])
})

test('signal + cache + method: the cache is used and the signal is not forwarded', async () => {
  const { calls, xapi } = createXapi()
  const { signal } = new AbortController()
  const cache = new Map()

  assert.equal(await xapi.callAsync(signal, cache, 'VM.start', 'ref'), 'result')
  assert.equal(cache.size, 1)
  assert.deepEqual(calls[0], ['Async.VM.start', 'ref'])
})

test('a leading CancelToken is rejected with a clear error and nothing is called', async () => {
  const { calls, xapi } = createXapi()
  // shape of a promise-toolbox CancelToken
  const token = { promise: new Promise(() => {}), reason: undefined, requested: false, throwIfRequested() {} }

  for (const call of [
    () => xapi.callAsync(token, 'VM.start', 'ref'),
    () => xapi.getResource(token, '/export/'),
    () => xapi.putResource(token, 'body', '/import/'),
  ]) {
    await assert.rejects(call(), { name: 'TypeError', message: /CancelToken is no longer supported/ })
  }
  assert.deepEqual(calls, [])
})

test('cache only: the cache is used', async () => {
  const { calls, xapi } = createXapi()
  const cache = new Map()

  assert.equal(await xapi.callAsync(cache, 'VM.start', 'ref'), 'result')
  assert.equal(cache.size, 1)
  assert.deepEqual(calls[0], ['Async.VM.start', 'ref'])
})

// -----------------------------------------------------------------------------
// callAsync

function deferred() {
  let _resolve, _reject
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
  return { promise, reject: _reject, resolve: _resolve }
}

test('callAsync: abort while the task is pending sends task.cancel', async () => {
  const { calls, xapi } = createXapi()
  const task = deferred()
  xapi.watchTask = () => task.promise
  const controller = new AbortController()

  const promise = xapi.callAsync(controller.signal, 'VM.snapshot', 'ref', 'name')
  await new Promise(resolve => setImmediate(resolve))
  controller.abort()

  assert.deepEqual(
    calls.filter(([method]) => method === 'task.cancel'),
    [['task.cancel', 'OpaqueRef:task']]
  )

  task.reject(new Error('cancelled by XAPI'))
  await assert.rejects(promise, /cancelled by XAPI/)
})

// makes `task.cancel` fail as XAPI does for a task it has already ended, and records unhandled rejections
function failTaskCancel(xapi, calls) {
  const sessionCall = xapi._sessionCall
  xapi._sessionCall = async (method, args) => {
    if (method === 'task.cancel') {
      calls.push([method, ...args])
      throw Object.assign(new Error('HANDLE_INVALID'), { code: 'HANDLE_INVALID' })
    }
    return sessionCall(method, args)
  }
  const unhandled = []
  const onUnhandled = reason => unhandled.push(reason)
  process.on('unhandledRejection', onUnhandled)
  return {
    unhandled,
    restore: () => process.off('unhandledRejection', onUnhandled),
  }
}

test('callAsync: a failing task.cancel is ignored and the call keeps the outcome reported by XAPI', async () => {
  const { calls, xapi } = createXapi()
  const { restore, unhandled } = failTaskCancel(xapi, calls)
  try {
    const task = deferred()
    xapi.watchTask = () => task.promise
    const controller = new AbortController()

    const promise = xapi.callAsync(controller.signal, 'VM.snapshot', 'ref', 'name')
    await new Promise(resolve => setImmediate(resolve))
    controller.abort()
    task.resolve('OpaqueRef:snapshot') // XAPI ended the task before the cancel

    assert.equal(await promise, 'OpaqueRef:snapshot')
    assert.equal(calls.filter(([method]) => method === 'task.cancel').length, 1)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(unhandled, [])
  } finally {
    restore()
  }
})

test('callAsync: abort after the task ended sends nothing', async () => {
  const { calls, xapi } = createXapi()
  const controller = new AbortController()

  await xapi.callAsync(controller.signal, 'VM.snapshot', 'ref', 'name')
  controller.abort()

  assert.equal(calls.filter(([method]) => method === 'task.cancel').length, 0)
})

test('callAsync: an aborted signal creates no task', async () => {
  const { calls, xapi } = createXapi()
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(xapi.callAsync(controller.signal, 'VM.snapshot', 'ref', 'name'), { name: 'AbortError' })
  assert.deepEqual(calls, [])
})

test('callAsync: no listener is left on the signal after the call', async () => {
  const { xapi } = createXapi()
  const controller = new AbortController()
  const { signal } = controller

  let listeners = 0
  const { addEventListener, removeEventListener } = signal
  signal.addEventListener = function (type, ...args) {
    ++listeners
    return addEventListener.call(this, type, ...args)
  }
  signal.removeEventListener = function (type, ...args) {
    --listeners
    return removeEventListener.call(this, type, ...args)
  }

  await xapi.callAsync(signal, 'VM.snapshot', 'ref', 'name')
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(listeners, 0)
})

// -----------------------------------------------------------------------------
// getResource / putResource

function listen(requestListener) {
  const server = createServer(requestListener)
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve(server))
  })
}

function createXapiFor(server) {
  const { port } = server.address()
  const { calls, xapi } = createXapi()
  xapi._url = new URL(`http://127.0.0.1:${port}`)
  xapi._setHostAddressInUrl = async url => {
    url.hostname = '127.0.0.1'
    url.port = port
  }
  Object.defineProperty(xapi, 'sessionId', { value: 'session' })
  xapi._autoTask = async task => task
  const taskResult = deferred()
  taskResult.promise.catch(() => {})
  xapi.watchTask = () => taskResult.promise
  return { calls, taskResult, xapi }
}

test('getResource: abort rejects the download and cancels the task', async () => {
  const requests = []
  const server = await listen((req, res) => {
    requests.push(req.url)
    res.writeHead(200)
    res.write('start') // never ends
  })
  try {
    const { calls, taskResult, xapi } = createXapiFor(server)
    const controller = new AbortController()

    const response = await xapi.getResource(controller.signal, '/export', { task: 'OpaqueRef:t' })
    const read = response.body.text()
    controller.abort()

    await assert.rejects(read)
    assert.deepEqual(
      calls.filter(([method]) => method === 'task.cancel'),
      [['task.cancel', 'OpaqueRef:t']]
    )
    taskResult.resolve()
  } finally {
    server.closeAllConnections()
    server.close()
  }
})

test('getResource: a failing task.cancel does not replace the error reported to the caller', async () => {
  const server = await listen((req, res) => {
    res.writeHead(200)
    res.write('start') // never ends
  })
  try {
    const { calls, taskResult, xapi } = createXapiFor(server)
    const { restore, unhandled } = failTaskCancel(xapi, calls)
    try {
      const controller = new AbortController()

      const response = await xapi.getResource(controller.signal, '/export', { task: 'OpaqueRef:t' })
      const read = response.body.text()
      controller.abort()

      await assert.rejects(read, error => {
        assert.notEqual(error.code, 'HANDLE_INVALID')
        assert.equal(error.name, 'AbortError')
        return true
      })
      assert.equal(calls.filter(([method]) => method === 'task.cancel').length, 1)
      taskResult.resolve()
      await new Promise(resolve => setImmediate(resolve))
      assert.deepEqual(unhandled, [])
    } finally {
      restore()
    }
  } finally {
    server.closeAllConnections()
    server.close()
  }
})

test('getResource: an aborted signal sends no request and marks the caller task as cancelled', async () => {
  let count = 0
  const server = await listen((req, res) => {
    ++count
    res.end()
  })
  try {
    const { calls, xapi } = createXapiFor(server)
    const controller = new AbortController()
    controller.abort()

    await assert.rejects(xapi.getResource(controller.signal, '/export', { task: 'OpaqueRef:t' }), {
      name: 'AbortError',
    })
    assert.equal(count, 0)
    // task.cancel would leave a task that no request drives pending forever
    assert.deepEqual(calls, [['task.set_status', 'OpaqueRef:t', 'cancelled']])
  } finally {
    server.closeAllConnections()
    server.close()
  }
})

test('putResource: abort rejects the upload and cancels the task', async () => {
  const server = await listen((req, res) => {
    // answers at the end of the upload only
    req.resume()
    req.on('end', () => res.end())
  })
  try {
    const { calls, taskResult, xapi } = createXapiFor(server)
    const controller = new AbortController()

    const body = new PassThrough()
    body.length = 1000
    body.write('chunk')

    const promise = xapi.putResource(controller.signal, body, '/import/', { task: 'OpaqueRef:t' })
    promise.catch(() => {})
    await new Promise(resolve => setTimeout(resolve, 100))
    controller.abort()

    await assert.rejects(promise)
    assert.deepEqual(
      calls.filter(([method]) => method === 'task.cancel'),
      [['task.cancel', 'OpaqueRef:t']]
    )
    taskResult.resolve()
  } finally {
    server.closeAllConnections()
    server.close()
  }
})

test('putResource: an aborted signal sends no request and marks the caller task as cancelled', async () => {
  let count = 0
  const server = await listen((req, res) => {
    ++count
    res.end()
  })
  try {
    const { calls, xapi } = createXapiFor(server)
    const controller = new AbortController()
    controller.abort()

    await assert.rejects(xapi.putResource(controller.signal, 'body', '/import/', { task: 'OpaqueRef:t' }), {
      name: 'AbortError',
    })
    assert.equal(count, 0)
    // task.cancel would leave a task that no request drives pending forever
    assert.deepEqual(calls, [['task.set_status', 'OpaqueRef:t', 'cancelled']])
  } finally {
    server.closeAllConnections()
    server.close()
  }
})

test('getResource/putResource: an aborted signal without a task calls nothing', async () => {
  const { calls, xapi } = createXapi()
  const signal = AbortSignal.abort()

  await assert.rejects(xapi.getResource(signal, '/export'), { name: 'AbortError' })
  await assert.rejects(xapi.putResource(signal, 'body', '/import/', { task: false }), { name: 'AbortError' })
  assert.deepEqual(calls, [])
})

test('getResource: an aborted signal with a task promise marks the task as cancelled once it is known', async () => {
  const { calls, xapi } = createXapi()

  await assert.rejects(xapi.getResource(AbortSignal.abort(), '/export', { task: Promise.resolve('OpaqueRef:p') }), {
    name: 'AbortError',
  })
  assert.deepEqual(calls, [['task.set_status', 'OpaqueRef:p', 'cancelled']])
})
