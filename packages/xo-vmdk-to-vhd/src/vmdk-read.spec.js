import {assert} from 'chai'
import {createReadStream} from 'fs-promise'
import {describe, it} from 'mocha'
import {exec} from 'child-process-promise'

import {VMDKDirectParser} from './vmdk-read'

describe('VMDK reading', () => {
  it('VMDKDirectParser reads OK', async () => {
    let rawFileName = 'random-data'
    let fileName = 'random-data.vmdk'
    await exec('base64 /dev/urandom | head -c 104448 > ' + rawFileName)
    await exec('rm -f ' + fileName + '&& VBoxManage convertfromraw --format VMDK --variant Stream ' + rawFileName + ' ' + fileName)
    const parser = new VMDKDirectParser(createReadStream(fileName))
    const header = await parser.readHeader()
    const harvested = []
    while (true) {
      const res = await parser.next()
      if (res === null) {
        break
      }
      harvested.push(res)
    }
    assert.equal(harvested.length, 2)
    assert.equal(harvested[0].lba, 0)
    assert.equal(harvested[1].lba, header['grainSizeSectors'])
  }).timeout(10000)
})
