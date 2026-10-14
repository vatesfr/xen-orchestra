import { after, beforeEach, describe, it } from 'node:test'
import { strict as assert } from 'assert'
import sinon from 'sinon'

import { DEFAULT_ENCRYPTION_ALGORITHM, _getEncryptor } from './_encryptor'
import { Disposable, pFromCallback, TimeoutError } from 'promise-toolbox'
import { getSyncedHandler } from '.'
import { rimraf } from 'rimraf'
import AbstractHandler from './abstract'
import fs from 'fs-extra'
import tmp from 'tmp'

const TIMEOUT = 12e5

class TestHandler extends AbstractHandler {
  constructor(remoteOverrides = {}) {
    const options = { timeout: TIMEOUT, withRetry: [] }
    super({ url: 'test://', ...remoteOverrides }, options)
    Object.defineProperty(this, 'isEncrypted', {
      get: () => false, // encryption is tested separately
    })
  }

  async _closeFile() {
    Promise(() => {})
  }
  async _getInfo() {
    Promise(() => {})
  }
  async _getSize() {
    Promise(() => {})
  }
  async _list() {
    Promise(() => {})
  }
  async _openFile() {
    Promise(() => {})
  }
  async _rename() {
    Promise(() => {})
  }
  async _rmdir() {
    Promise(() => {})
  }
}

const noop = Function.prototype

const clock = sinon.useFakeTimers()

describe('closeFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.closeFile({ fd: undefined, path: '' })
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('getConfig()', () => {
  it('is undefined when not set on the remote', () => {
    assert.equal(new TestHandler().getConfig('compressionType'), undefined)
  })

  it('reads the remote-level compressionType override', () => {
    assert.equal(new TestHandler({ compressionType: 'brotli' }).getConfig('compressionType'), 'brotli')
  })
})

describe('getInfo()', () => {
  it('throws in case of timeout', async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.getInfo()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('getSize()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.getSize('')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('list()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.list('.')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('openFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.openFile('path')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('rename()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.rename('oldPath', 'newPath')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

describe('rmdir()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler()

    const promise = testHandler.rmdir('dir')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, new TimeoutError())
  })
})

// an operation on an unresponsive remote (e.g. a dead hard-mounted NFS) blocks a libuv thread until the remote
// answers, even after it timed out: starting new operations on it would end up blocking all the threads
describe('unresponsive remote', () => {
  let nCalls
  let pendingResult

  // unlike TestHandler, keeps the default retry configuration
  class UnresponsiveHandler extends AbstractHandler {
    constructor() {
      super({ url: 'test://' }, { timeout: TIMEOUT })
      Object.defineProperty(this, 'isEncrypted', {
        get: () => false,
      })
    }

    _list() {
      nCalls++
      return pendingResult
    }

    _openFile() {
      nCalls++
      return pendingResult
    }
  }

  const trackSettlement = promise => {
    const state = { settled: false }
    promise.then(
      value => {
        state.settled = true
        state.value = value
      },
      error => {
        state.settled = true
        state.error = error
      }
    )
    return state
  }

  let resolvePending
  beforeEach(() => {
    nCalls = 0
    pendingResult = new Promise(resolve => {
      resolvePending = resolve
    })
  })

  it('does not retry an operation which timed out', async () => {
    const handler = new UnresponsiveHandler()

    const state = trackSettlement(handler.list('dir'))
    // enough time for all the retry delays
    await clock.tickAsync(TIMEOUT + 10e3)

    assert.equal(nCalls, 1, 'the operation must not be retried while the first call is still pending')
    assert.equal(state.settled, true)
    assert.ok(state.error instanceof TimeoutError)
  })

  it('rejects new operations at once while a timed out one is still pending', async () => {
    const handler = new UnresponsiveHandler()

    trackSettlement(handler.list('dir'))
    await clock.tickAsync(TIMEOUT)
    const nCallsAfterTimeout = nCalls

    const listState = trackSettlement(handler.list('other-dir'))
    const openState = trackSettlement(handler.openFile('file', 'r'))
    await clock.tickAsync(0)

    assert.equal(nCalls, nCallsAfterTimeout, 'no new call must reach the unresponsive remote')
    assert.equal(listState.settled, true)
    assert.notEqual(listState.error, undefined)
    assert.equal(openState.settled, true)
    assert.notEqual(openState.error, undefined)
  })

  it('accepts operations again once the timed out one has settled', async () => {
    const handler = new UnresponsiveHandler()

    trackSettlement(handler.list('dir'))
    await clock.tickAsync(TIMEOUT)

    // the remote answers again
    resolvePending([])
    pendingResult = Promise.resolve(['file'])
    await clock.tickAsync(0)

    const nCallsBefore = nCalls
    const state = trackSettlement(handler.list('dir'))
    await clock.tickAsync(0)

    assert.equal(nCalls, nCallsBefore + 1)
    assert.deepEqual(state.value, ['file'])
  })
})

describe('encryption', () => {
  let dir
  beforeEach(async () => {
    dir = await pFromCallback(cb => tmp.dir(cb))
  })
  after(async () => {
    await rimraf(dir)
  })

  it('sync should NOT create metadata if missing (not encrypted)', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }), noop)

    assert.deepEqual(await fs.readdir(dir), [])
  })

  it('sync should create metadata if missing (encrypted)', async () => {
    await Disposable.use(
      getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` }),
      noop
    )

    assert.deepEqual(await fs.readdir(dir), ['encryption.json', 'metadata.json'])

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    assert.equal(encryption.algorithm, DEFAULT_ENCRYPTION_ALGORITHM)
    // encrypted , should not be parsable
    assert.rejects(async () => JSON.parse(await fs.readFile(`${dir}/metadata.json`)))
  })

  it('sync should not modify existing metadata', async () => {
    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "none"}`)
    await fs.writeFile(`${dir}/metadata.json`, `{"random": "NOTSORANDOM"}`)

    await Disposable.use(await getSyncedHandler({ url: `file://${dir}` }), noop)

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    assert.equal(encryption.algorithm, 'none')
    const metadata = JSON.parse(await fs.readFile(`${dir}/metadata.json`, 'utf-8'))
    assert.equal(metadata.random, 'NOTSORANDOM')
  })

  it('should modify metadata if empty', async () => {
    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }), noop)
    // nothing created without encryption

    await Disposable.use(
      getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` }),
      noop
    )
    let encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    assert.equal(encryption.algorithm, DEFAULT_ENCRYPTION_ALGORITHM)

    await Disposable.use(getSyncedHandler({ url: `file://${dir}` }), noop)
    encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    assert.equal(encryption.algorithm, 'none')
  })

  it(
    'sync should work with encrypted',
    Disposable.wrap(async function* () {
      const encryptor = _getEncryptor(DEFAULT_ENCRYPTION_ALGORITHM, '73c1838d7d8a6088ca2317fb5f29cd91')

      await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "${DEFAULT_ENCRYPTION_ALGORITHM}"}`)
      await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

      const handler = yield getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd91"` })

      const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
      assert.equal(encryption.algorithm, DEFAULT_ENCRYPTION_ALGORITHM)
      const metadata = JSON.parse(await handler.readFile(`./metadata.json`))
      assert.equal(metadata.random, 'NOTSORANDOM')
    })
  )

  it('sync should fail when changing key on non empty remote ', async () => {
    const encryptor = _getEncryptor(DEFAULT_ENCRYPTION_ALGORITHM, '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "${DEFAULT_ENCRYPTION_ALGORITHM}"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

    // different key but empty remote => ok
    await Disposable.use(
      getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` }),
      noop
    )

    // remote is now non empty : can't modify key anymore
    await fs.writeFile(`${dir}/nonempty.json`, 'content')
    await assert.rejects(
      Disposable.use(getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd10"` }), noop)
    )
  })

  it('sync should fail when changing algorithm', async () => {
    // encrypt with a non default algorithm
    const encryptor = _getEncryptor('aes-256-cbc', '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "aes-256-gcm"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

    // remote is now non empty : can't modify key anymore
    await fs.writeFile(`${dir}/nonempty.json`, 'content')

    await assert.rejects(
      Disposable.use(getSyncedHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd91"` }), noop)
    )
  })

  it('sync should fail with a clear error when the key is removed from a non empty remote', async () => {
    const encryptor = _getEncryptor(DEFAULT_ENCRYPTION_ALGORITHM, '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "${DEFAULT_ENCRYPTION_ALGORITHM}"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))
    await fs.writeFile(`${dir}/nonempty.json`, 'content')

    // no encryptionKey in the url => must not fall back to NULL_ENCRYPTOR
    await assert.rejects(Disposable.use(getSyncedHandler({ url: `file://${dir}` }), noop), {
      code: 'MISSING_ENCRYPTION_KEY',
    })
  })
})
