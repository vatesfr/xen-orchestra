/* eslint-env jest */

import { createReadStream, createWriteStream } from 'fs-extra'
import execa from 'execa'
import { pFromCallback, fromEvent } from 'promise-toolbox'
import tmp from 'tmp'
import rimraf from 'rimraf'
import { writeOvaOn } from './ova-generate'

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
  const ovaFileName = 'random-disk.ova'
  const dataSize = 100 * 1024 * 1024 // this number is an integer head/cylinder/count equation solution
  try {
    await execa('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName, [], { shell: true })
    await execa('qemu-img', ['convert', '-fraw', '-Ovpc', inputRawFileName, vhdFileName])
    const streamGetter = async () => {
      return createReadStream(vhdFileName)
    }

    const destination = await createWriteStream(ovaFileName)
    const diskName = 'disk1'
    const vmdkDiskName = `${diskName}.vmdk`
    const pipe = await writeOvaOn(destination, {
      vmName: 'vm1',
      vmDescription: 'desc',
      disks: [{ name: diskName, getStream: streamGetter }]
    })
    await fromEvent(pipe, 'finish')
    await execa('tar', ['tf', ovaFileName, vmdkDiskName])
    await execa('tar', ['xf', ovaFileName, vmdkDiskName])
    await execa('qemu-img', ['check', vmdkDiskName])
  } catch (error) {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(error.message)
    throw error
  }
})
