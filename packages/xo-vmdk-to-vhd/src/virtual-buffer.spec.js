import expect from 'must'
import {createReadStream, readFile} from 'fs-promise'
import {describe, it} from 'mocha'
import {exec} from 'child-process-promise'

import {VirtualBuffer} from './virtual-buffer'

describe('Virtual Buffer', function () {
  it('can read a file correctly', async () => {
    let rawFileName = 'random-data'
    await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
    const buffer = new VirtualBuffer(createReadStream(rawFileName))
    const part1 = await buffer.readChunk(10)
    const part2 = await buffer.readChunk(-1)
    const original = await readFile(rawFileName)
    expect(buffer.isDepleted).to.be.true()
    expect(Buffer.concat([part1, part2]).toString('ascii')).to.equal(original.toString('ascii'))
  })
})
