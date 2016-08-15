import {assert} from 'chai'
import {createReadStream, readFile} from 'fs-promise'
import {describe, it} from 'mocha'
import {exec} from 'child-process-promise'

import {VirtualBuffer} from './virtual-buffer'

describe('Virtual Buffer', function () {
  it('can read a file correctly', async () => {
    let rawFileName = 'random-data'
    await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
    const buffer = new VirtualBuffer(createReadStream(rawFileName))
    const array = await Promise.all([readFile(rawFileName), buffer.readChunk(0, 10), buffer.readChunk(10, -1)])
    const original = array.shift()
    assert.equal(Buffer.concat(array).toString('ascii'), original.toString('ascii'))
    assert(buffer.isDepleted, 'virtual buffer is depleted')
  })
})
