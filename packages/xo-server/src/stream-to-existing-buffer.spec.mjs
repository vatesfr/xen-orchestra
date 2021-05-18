/* eslint-env jest */

import { createReadStream, readFile } from 'fs'
import { fromCallback } from 'promise-toolbox'

import streamToExistingBuffer from './stream-to-existing-buffer.mjs'

describe('streamToExistingBuffer()', () => {
  it('read the content of a stream in a buffer', async () => {
    const stream = createReadStream(import.meta.url)

    const expected = await fromCallback(readFile, import.meta.url, 'utf-8')

    const buf = Buffer.allocUnsafe(expected.length + 1)
    buf[0] = 'A'.charCodeAt()
    await streamToExistingBuffer(stream, buf, 1)

    expect(String(buf)).toBe(`A${expected}`)
  })
})
