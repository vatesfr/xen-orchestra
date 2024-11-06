import { describe, it } from 'node:test'
import { strict as assert } from 'assert'

import { Readable } from 'readable-stream'
import copyStreamToBuffer from './_copyStreamToBuffer.js'

describe('copyStreamToBuffer', () => {
  it('should copy the stream to the buffer', async () => {
    const stream = new Readable({
      read() {
        this.push('hello')
        this.push(null)
      },
    })

    const buffer = Buffer.alloc(3)

    await copyStreamToBuffer(stream, buffer)

    assert.equal(buffer.toString(), 'hel')
  })
})
