/* eslint-env jest */

import { Readable } from 'readable-stream'
import createBufferFromStream from './_createBufferFromStream.js'

describe('createBufferFromStream', () => {
  it('should create a buffer from a stream', async () => {
    const stream = new Readable({
      read() {
        this.push('hello')
        this.push(null)
      },
    })

    const buffer = await createBufferFromStream(stream)

    expect(buffer.toString()).toBe('hello')
  })
})
