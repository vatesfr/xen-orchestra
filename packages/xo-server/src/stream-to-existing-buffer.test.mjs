import assert from 'assert/strict'
import test from 'node:test'
import { createReadStream, readFile } from 'fs'
import { fromCallback } from 'promise-toolbox'

import streamToExistingBuffer from './stream-to-existing-buffer.mjs'

const { describe, it } = test

describe('streamToExistingBuffer()', () => {
  it('read the content of a stream in a buffer', async () => {
    const { pathname } = new URL(import.meta.url)

    const stream = createReadStream(pathname)

    const expected = await fromCallback(readFile, pathname, 'utf-8')

    const buf = Buffer.allocUnsafe(expected.length + 1)
    buf[0] = 'A'.charCodeAt()
    await streamToExistingBuffer(stream, buf, 1)

    assert.equal(String(buf), `A${expected}`)
  })
})
