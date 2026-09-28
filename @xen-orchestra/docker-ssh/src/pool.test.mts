import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CONNECTION_CLOSED,
  DOCKER_API_ERROR,
  DockerError,
  POOL_EXHAUSTED,
  SSH_AUTH_FAILED,
  SSH_UNREACHABLE,
} from './errors.mjs'
import type { DockerRequestOptions } from './connection.mjs'
import { type DockerConnectionFacade, DockerConnectionPool } from './pool.mjs'

class FakeConnection {
  static instances: FakeConnection[] = []

  closed = 0
  connected = false
  connects = 0
  connectDelay: number
  connectError: DockerError | undefined

  constructor({ connectError, connectDelay = 0 }: { connectError?: DockerError; connectDelay?: number } = {}) {
    this.connectDelay = connectDelay
    this.connectError = connectError
    FakeConnection.instances.push(this)
  }

  get apiVersion() {
    return '1.43'
  }

  async connect() {
    ++this.connects
    await new Promise(resolve => setTimeout(resolve, this.connectDelay))
    if (this.connectError !== undefined) {
      throw this.connectError
    }
    this.connected = true
  }

  async close() {
    ++this.closed
    this.connected = false
  }

  async request({ path }: DockerRequestOptions) {
    return { statusCode: 200, headers: {}, body: path }
  }

  // not used by these tests, but part of `PoolableConnection`
  get engineVersion() {
    return undefined
  }

  get observedHostKey() {
    return undefined
  }

  async requestStream(): Promise<never> {
    throw new Error('not implemented')
  }

  async exec(): Promise<never> {
    throw new Error('not implemented')
  }
}

const createClock = (start = 1e6) => {
  const clock = () => clock.time
  clock.time = start
  return clock
}

const engine = (id: string, revision: number | string = 0) => ({ id, revision })

const idle = () => {}

describe('DockerConnectionPool', () => {
  it('shares one handshake between concurrent first uses', async () => {
    const pool = new DockerConnectionPool()
    let created = 0
    const create = () => {
      ++created
      return new FakeConnection({ connectDelay: 20 })
    }
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) => pool.use(engine('a'), create, c => c.request({ path: '/' + i })))
    )
    assert.equal(created, 1)
    assert.deepEqual(
      results.map(_ => _.body),
      Array.from({ length: 10 }, (_, i) => '/' + i)
    )
    assert.deepEqual(pool.getState('a', 0), { status: 'connected' })
    await pool.destroy()
  })

  it('reuses the connection for later uses and uses a new one for a new revision', async () => {
    const pool = new DockerConnectionPool()
    const connections = []
    const create = () => {
      const connection = new FakeConnection()
      connections.push(connection)
      return connection
    }
    await pool.use(engine('a', 0), create, idle)
    await pool.use(engine('a', 0), create, idle)
    assert.equal(connections.length, 1)
    await pool.use(engine('a', 1), create, idle)
    assert.equal(connections.length, 2)
    assert.deepEqual(pool.getState('a', 0), { status: 'connected' })
    assert.deepEqual(pool.getState('b', 0), { status: 'idle' })
    await pool.destroy()
  })

  it('negative cache: fails fast after a connection failure, then retries after failureTtl', async () => {
    const now = createClock()
    const pool = new DockerConnectionPool({ failureTtl: 30e3, now })
    let created = 0
    const create = () => {
      ++created
      return new FakeConnection({ connectError: new DockerError(SSH_UNREACHABLE, 'unreachable') })
    }

    await assert.rejects(pool.use(engine('a'), create, idle), { code: SSH_UNREACHABLE })
    assert.equal(created, 1)
    assert.equal(FakeConnection.instances.at(-1)!.closed, 1, 'the failed connection is closed')

    now.time += 10e3
    await assert.rejects(pool.use(engine('a'), create, idle), (error: DockerError) => {
      assert.equal(error.code, SSH_UNREACHABLE)
      assert.equal(error.data!.failFast, true)
      assert.equal(error.data!.retryAt, 1e6 + 30e3)
      return true
    })
    assert.equal(created, 1, 'no new attempt during failureTtl')

    // the error is exposed passively, without connecting
    assert.deepEqual(pool.getState('a', 0), {
      status: 'error',
      error: { code: SSH_UNREACHABLE, message: 'unreachable' },
    })

    now.time += 25e3
    await assert.rejects(pool.use(engine('a'), create, idle), { code: SSH_UNREACHABLE })
    assert.equal(created, 2, 'retried after failureTtl')
    await pool.destroy()
  })

  it('keeps reporting the last error after failureTtl, until a connection succeeds', async () => {
    const now = createClock()
    const pool = new DockerConnectionPool({ failureTtl: 30e3, now })
    let error: DockerError | undefined = new DockerError(SSH_AUTH_FAILED, 'bad key')
    const create = () => new FakeConnection({ connectError: error })

    await assert.rejects(pool.use(engine('a'), create, idle))
    now.time += 60e3
    assert.equal(pool.getState('a').status, 'error')

    error = undefined
    await pool.use(engine('a'), create, idle)
    assert.deepEqual(pool.getState('a'), { status: 'connected' })
    await pool.destroy()
  })

  it('an engine failure while using a connection evicts it and is negatively cached', async () => {
    const pool = new DockerConnectionPool()
    const create = () => new FakeConnection()
    await pool.use(engine('a'), create, idle)
    const [connection] = FakeConnection.instances.slice(-1)

    await assert.rejects(
      pool.use(engine('a'), create, () => {
        throw new DockerError(SSH_UNREACHABLE, 'connection lost')
      }),
      { code: SSH_UNREACHABLE }
    )
    assert.equal(pool.size, 0)
    assert.equal(connection.closed, 1)
    assert.equal(pool.getState('a').status, 'error')
    await assert.rejects(pool.use(engine('a'), create, idle), (error: DockerError) => error.data!.failFast === true)
    await pool.destroy()
  })

  it('a Docker API error does not evict the connection', async () => {
    const pool = new DockerConnectionPool()
    const create = () => new FakeConnection()
    await assert.rejects(
      pool.use(engine('a'), create, () => {
        throw new DockerError(DOCKER_API_ERROR, 'no such container', { data: { statusCode: 404 } })
      }),
      { code: DOCKER_API_ERROR }
    )
    assert.equal(pool.size, 1)
    assert.deepEqual(pool.getState('a'), { status: 'connected' })
    await pool.destroy()
  })

  it('idle GC closes the connections unused for idleTimeout, not the busy ones', async () => {
    const now = createClock()
    const pool = new DockerConnectionPool({ idleTimeout: 5 * 60e3, now })
    const create = () => new FakeConnection()

    await pool.use(engine('idle'), create, idle)
    const idleConnection = FakeConnection.instances.at(-1)!

    let finish: (() => void) | undefined
    const busy = pool.use(engine('busy'), create, () => new Promise<void>(resolve => (finish = resolve)))
    await new Promise(resolve => setTimeout(resolve, 5))
    const busyConnection = FakeConnection.instances.at(-1)!

    now.time += 4 * 60e3
    pool.sweep()
    assert.equal(pool.size, 2, 'not idle long enough')

    now.time += 2 * 60e3
    pool.sweep()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(idleConnection.closed, 1)
    assert.equal(busyConnection.closed, 0, 'busy connections are never collected')
    assert.equal(pool.size, 1)
    assert.deepEqual(pool.getState('idle'), { status: 'idle' })

    finish!()
    await busy
    now.time += 6 * 60e3
    pool.sweep()
    assert.equal(pool.size, 0)
    await pool.destroy()
  })

  it('the sweeper runs periodically, calls onSweep and stops on destroy', async () => {
    let sweeps = 0
    const pool = new DockerConnectionPool({ sweepInterval: 10, onSweep: () => ++sweeps })
    await pool.use(engine('a'), () => new FakeConnection(), idle)
    await new Promise(resolve => setTimeout(resolve, 35))
    assert.ok(sweeps >= 2, `${sweeps} sweeps`)
    await pool.destroy()
    const count = sweeps
    await new Promise(resolve => setTimeout(resolve, 25))
    assert.equal(sweeps, count, 'no sweeps after destroy')
  })

  it('caps the connections: evicts the least recently used idle one', async () => {
    const now = createClock()
    const pool = new DockerConnectionPool({ maxConnections: 2, now })
    const byId: Record<string, FakeConnection> = {}
    const create = (id: string) => () => (byId[id] = new FakeConnection())

    await pool.use(engine('a'), create('a'), idle)
    now.time += 1e3
    await pool.use(engine('b'), create('b'), idle)
    now.time += 1e3
    await pool.use(engine('a'), create('a2'), idle) // a is now the most recently used
    assert.equal(byId.a2, undefined)

    now.time += 1e3
    await pool.use(engine('c'), create('c'), idle)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(pool.size, 2)
    assert.equal(byId.b.closed, 1, 'b was the LRU')
    assert.equal(byId.a.closed, 0)
    assert.deepEqual(pool.getState('b'), { status: 'idle' })
    await pool.destroy()
  })

  it('throws POOL_EXHAUSTED when all the connections are busy', async () => {
    const pool = new DockerConnectionPool({ maxConnections: 2 })
    const create = () => new FakeConnection()
    const finishes: (() => void)[] = []
    const busy = ['a', 'b'].map(id =>
      pool.use(engine(id), create, () => new Promise<void>(resolve => finishes.push(resolve)))
    )
    await new Promise(resolve => setTimeout(resolve, 5))

    let created = 0
    await assert.rejects(
      pool.use(
        engine('c'),
        () => {
          ++created
          return new FakeConnection()
        },
        idle
      ),
      { code: POOL_EXHAUSTED }
    )
    assert.equal(created, 0)
    // not an engine failure: not negatively cached
    assert.deepEqual(pool.getState('c'), { status: 'idle' })

    // a busy engine can still be used
    await pool.use(engine('a'), create, idle)

    finishes.forEach(finish => finish())
    await Promise.all(busy)
    await pool.use(engine('c'), create, idle)
    await pool.destroy()
  })

  it('prunes the failures of the other revisions of an engine (fixes)', async () => {
    const pool = new DockerConnectionPool()
    const error = new DockerError(SSH_AUTH_FAILED, 'nope')
    await assert.rejects(
      pool.use(engine('a', 'old'), () => new FakeConnection({ connectError: error }), idle),
      { code: SSH_AUTH_FAILED }
    )
    assert.equal(pool.getState('a', 'old').status, 'error')
    await pool.use(engine('a', 'new'), () => new FakeConnection(), idle)
    assert.deepEqual(pool.getState('a', 'old'), { status: 'idle' })
    assert.deepEqual(pool.getState('a', 'new'), { status: 'connected' })
    await pool.destroy()
  })

  it('invalidate() closes the connections of an engine and forgets its failure', async () => {
    const pool = new DockerConnectionPool()
    await pool.use(engine('a'), () => new FakeConnection(), idle)
    const connection = FakeConnection.instances.at(-1)!
    await assert.rejects(
      pool.use(engine('b'), () => new FakeConnection({ connectError: new DockerError(SSH_AUTH_FAILED, 'x') }), idle)
    )

    await pool.invalidate('a')
    assert.equal(connection.closed, 1)
    assert.equal(pool.size, 0)

    await pool.invalidate('b')
    assert.deepEqual(pool.getState('b'), { status: 'idle' })
    await pool.destroy()
  })

  it('a connection closed by the pool refuses new requests', async () => {
    const pool = new DockerConnectionPool()
    let facade: DockerConnectionFacade | undefined
    let started: (() => void) | undefined
    let finish: (() => void) | undefined
    const running = new Promise<void>(resolve => (started = resolve))
    const done = pool.use(
      engine('a'),
      () => new FakeConnection(),
      async connection => {
        facade = connection
        started!()
        await new Promise<void>(resolve => (finish = resolve))
      }
    )
    await running
    await pool.invalidate('a')
    await assert.rejects(facade!.request({ path: '/info' }), { code: CONNECTION_CLOSED })
    finish!()
    await done
    await pool.destroy()
  })

  it('invalidation while connecting: the waiters get CONNECTION_CLOSED and the connection is closed', async () => {
    const pool = new DockerConnectionPool()
    const promise = pool.use(engine('a'), () => new FakeConnection({ connectDelay: 200 }), idle)
    await new Promise(resolve => setTimeout(resolve, 2))
    const connection = FakeConnection.instances.at(-1)!
    await pool.invalidate('a')
    await assert.rejects(promise, { code: CONNECTION_CLOSED })
    assert.ok(connection.closed >= 1)
    assert.deepEqual(pool.getState('a'), { status: 'idle' })
    await pool.destroy()
  })

  it('destroy() closes everything, including pending connections, and refuses new uses', async () => {
    const pool = new DockerConnectionPool()
    await pool.use(engine('a'), () => new FakeConnection(), idle)
    const established = FakeConnection.instances.at(-1)!
    const pending = pool.use(engine('b'), () => new FakeConnection({ connectDelay: 200 }), idle)
    await new Promise(resolve => setTimeout(resolve, 2))
    const connecting = FakeConnection.instances.at(-1)!

    await pool.destroy()
    assert.equal(established.closed, 1)
    assert.ok(connecting.closed >= 1)
    await assert.rejects(pending, { code: CONNECTION_CLOSED })
    assert.equal(pool.size, 0)
    await assert.rejects(
      pool.use(engine('a'), () => new FakeConnection(), idle),
      { code: CONNECTION_CLOSED }
    )
  })
})
