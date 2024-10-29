import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

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

    assert.equal(buffer.toString(), 'hello')
  })
})
