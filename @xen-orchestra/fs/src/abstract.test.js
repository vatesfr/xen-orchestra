import { after, beforeEach, describe, it } from 'test'
import { strict as assert } from 'assert'
import sinon from 'sinon'

import { DEFAULT_ENCRYPTION_ALGORITHM, _getEncryptor } from './_encryptor'
import { Disposable, pFromCallback, TimeoutError } from 'promise-toolbox'
import { getSyncedHandler } from '.'
import { rimraf } from 'rimraf'
import AbstractHandler from './abstract'
import fs from 'fs-extra'
import tmp from 'tmp'

const TIMEOUT = 10e3

class TestHandler extends AbstractHandler {
  constructor(impl) {
    super({ url: 'test://' }, { timeout: TIMEOUT })
    Object.defineProperty(this, 'isEncrypted', {
      get: () => false, // encryption is tested separatly
    })
    Object.keys(impl).forEach(method => {
      this[`_${method}`] = impl[method]
    })
  }
}

const noop = Function.prototype

const clock = sinon.useFakeTimers()

describe('closeFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      closeFile: () => new Promise(() => {}),
    })

    const promise = testHandler.closeFile({ fd: undefined, path: '' })
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('getInfo()', () => {
  it('throws in case of timeout', async () => {
    const testHandler = new TestHandler({
      getInfo: () => new Promise(() => {}),
    })

    const promise = testHandler.getInfo()
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('getSize()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      getSize: () => new Promise(() => {}),
    })

    const promise = testHandler.getSize('')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('list()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      list: () => new Promise(() => {}),
    })

    const promise = testHandler.list('.')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('openFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      openFile: () => new Promise(() => {}),
    })

    const promise = testHandler.openFile('path')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('rename()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      rename: () => new Promise(() => {}),
    })

    const promise = testHandler.rename('oldPath', 'newPath')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
  })
})

describe('rmdir()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      rmdir: () => new Promise(() => {}),
    })

    const promise = testHandler.rmdir('dir')
    clock.tick(TIMEOUT)
    await assert.rejects(promise, TimeoutError)
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
})
