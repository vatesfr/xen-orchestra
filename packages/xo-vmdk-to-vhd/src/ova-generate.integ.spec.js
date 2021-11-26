/* eslint-env jest */

import { createReadStream } from 'fs-extra'
import execa from 'execa'
import { createOvaStream } from '.'
import { pFromCallback } from 'promise-toolbox'
import tmp from 'tmp'
import rimraf from 'rimraf'

const initialDir = process.cwd()
jest.setTimeout(100000)
beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

test('An ova file is generated correctly', async () => {
  const inputRawFileName = 'random-data.raw'
  const vhdFileName = 'random-data.vhd'
  const dataSize = 100 * 1024 * 1024 // this number is an integer head/cylinder/count equation solution
  try {
    await execa('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName, [], { shell: true })
    await execa('qemu-img', ['convert', '-fraw', '-Ovpc', inputRawFileName, vhdFileName])
    const streamGetter = async () => {
      console.log('streamGetter')
      return createReadStream(vhdFileName)
    }
    await createOvaStream({ vmName: 'vm1', vmDescription: 'desc', disks: [{ name: 'disk1', getStream: streamGetter }] })
  } catch (error) {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(error.message)
    throw error
  }
})
