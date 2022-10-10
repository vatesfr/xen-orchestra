/* eslint-env jest */

import { DEFAULT_ENCRYPTION_ALGORITHM, _getEncryptor } from './_encryptor'
import { getHandler } from '.'
import { pFromCallback, TimeoutError } from 'promise-toolbox'
import AbstractHandler from './abstract'
import fs from 'fs-extra'
import rimraf from 'rimraf'
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

jest.useFakeTimers()

describe('closeFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      closeFile: () => new Promise(() => {}),
    })

    const promise = testHandler.closeFile({ fd: undefined, path: '' })
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('getInfo()', () => {
  it('throws in case of timeout', async () => {
    const testHandler = new TestHandler({
      getInfo: () => new Promise(() => {}),
    })

    const promise = testHandler.getInfo()
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('getSize()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      getSize: () => new Promise(() => {}),
    })

    const promise = testHandler.getSize('')
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('list()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      list: () => new Promise(() => {}),
    })

    const promise = testHandler.list('.')
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('openFile()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      openFile: () => new Promise(() => {}),
    })

    const promise = testHandler.openFile('path')
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('rename()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      rename: () => new Promise(() => {}),
    })

    const promise = testHandler.rename('oldPath', 'newPath')
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('rmdir()', () => {
  it(`throws in case of timeout`, async () => {
    const testHandler = new TestHandler({
      rmdir: () => new Promise(() => {}),
    })

    const promise = testHandler.rmdir('dir')
    jest.advanceTimersByTime(TIMEOUT)
    await expect(promise).rejects.toThrowError(TimeoutError)
  })
})

describe('encryption', () => {
  let handler, dir

  beforeEach(async () => {
    dir = await pFromCallback(cb => tmp.dir(cb))
  })
  afterAll(async () => {
    await handler?.forget()
    handler = undefined

    await pFromCallback(cb => rimraf(dir, cb))
  })
  it('sync should create metadata if missing (not encrypted)', async () => {
    handler = getHandler({ url: `file://${dir}` })
    await handler._checkMetadata()

    expect(await fs.readdir(dir)).toEqual(['encryption.json', 'metadata.json'])

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual('none')
    expect(async () => JSON.parse(await fs.readFile(`${dir}/metadata.json`))).not.toThrowError()
  })

  it('sync should create metadata if missing (encrypted)', async () => {
    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` })
    await handler._checkMetadata()

    expect(await fs.readdir(dir)).toEqual(['encryption.json', 'metadata.json'])

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual(DEFAULT_ENCRYPTION_ALGORITHM)
    // encrypted , should not be parsable
    expect(async () => JSON.parse(await fs.readFile(`${dir}/metadata.json`))).rejects.toThrowError()
  })

  it('sync should not modify existing metadata', async () => {
    handler = getHandler({ url: `file://${dir}` })
    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "none"}`)
    await fs.writeFile(`${dir}/metadata.json`, `{"random": "NOTSORANDOM"}`)

    await handler._checkMetadata()

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual('none')
    const metadata = JSON.parse(await fs.readFile(`${dir}/metadata.json`, 'utf-8'))
    expect(metadata.random).toEqual('NOTSORANDOM')
  })

  it('should modify metadata if empty', async () => {
    handler = getHandler({ url: `file://${dir}` })
    await handler._checkMetadata()
    await handler.forget()
    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` })
    await handler._checkMetadata()
    let encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual(DEFAULT_ENCRYPTION_ALGORITHM)
    await handler.forget()
    handler = getHandler({ url: `file://${dir}` })
    await handler._checkMetadata()
    encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual('none')
  })

  it('sync should work with encrypted', async () => {
    const encryptor = _getEncryptor(DEFAULT_ENCRYPTION_ALGORITHM, '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "${DEFAULT_ENCRYPTION_ALGORITHM}"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd91"` })
    await handler._checkMetadata()

    const encryption = JSON.parse(await fs.readFile(`${dir}/encryption.json`, 'utf-8'))
    expect(encryption.algorithm).toEqual(DEFAULT_ENCRYPTION_ALGORITHM)
    const metadata = JSON.parse(await handler.readFile(`./metadata.json`))
    expect(metadata.random).toEqual('NOTSORANDOM')
  })

  it('sync should fail when changing key on non empty remote ', async () => {
    const encryptor = _getEncryptor(DEFAULT_ENCRYPTION_ALGORITHM, '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "${DEFAULT_ENCRYPTION_ALGORITHM}"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

    // different key but empty remote => ok
    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd00"` })
    await expect(handler._checkMetadata()).resolves.not.toThrowError()

    // rmote is now non empty : can't modify key anymore
    await fs.writeFile(`${dir}/nonempty.json`, 'content')
    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd10"` })
    await expect(handler._checkMetadata()).rejects.toThrowError()
  })

  it('sync should fail when changing algorithm', async () => {
    // encrypt with a non default algorithm
    const encryptor = _getEncryptor('aes-256-cbc', '73c1838d7d8a6088ca2317fb5f29cd91')

    await fs.writeFile(`${dir}/encryption.json`, `{"algorithm": "aes-256-gmc"}`)
    await fs.writeFile(`${dir}/metadata.json`, encryptor.encryptData(`{"random": "NOTSORANDOM"}`))

    // remote is now non empty : can't modify key anymore
    await fs.writeFile(`${dir}/nonempty.json`, 'content')

    handler = getHandler({ url: `file://${dir}?encryptionKey="73c1838d7d8a6088ca2317fb5f29cd91"` })
    await expect(handler._checkMetadata()).rejects.toThrowError()
  })
})
