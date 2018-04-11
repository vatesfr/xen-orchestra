/* eslint-env jest */

import { computeGeometryForSize } from '@xen-orchestra/vhd-lib'
import execa from 'execa'
import eventToPromise from 'event-to-promise'
import { createReadStream, createWriteStream } from 'fs-promise'
import { fromCallback as pFromCallback } from 'promise-toolbox'

import convertFromVMDK from '.'
import rimraf from 'rimraf'
import tmp from 'tmp'

const initialDir = process.cwd()
jest.setTimeout(10000)

beforeEach(async () => {
  const dir = await pFromCallback(cb => tmp.dir(cb))
  process.chdir(dir)
})

afterEach(async () => {
  const tmpDir = process.cwd()
  process.chdir(initialDir)
  await pFromCallback(cb => rimraf(tmpDir, cb))
})

test('VMDK to VHD can convert a random data file with VMDKDirectParser', async () => {
  const inputRawFileName = 'random-data.raw'
  const vmdkFileName = 'random-data.vmdk'
  const vhdFileName = 'from-vmdk-VMDKDirectParser.vhd'
  const reconvertedFromVhd = 'from-vhd.raw'
  const reconvertedFromVmdk = 'from-vhd-by-vbox.raw'
  const dataSize = computeGeometryForSize(8 * 1024 * 1024).actualSize
  try {
    await execa.shell(
      'base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName
    )
    await execa.shell(
      'python /usr/share/pyshared/VMDKstream.py ' +
        inputRawFileName +
        ' ' +
        vmdkFileName
    )
    const pipe = (await convertFromVMDK(createReadStream(vmdkFileName))).pipe(
      createWriteStream(vhdFileName)
    )
    await eventToPromise(pipe, 'finish')
    await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdFileName])
    await execa.shell(
      'qemu-img convert -fvmdk -Oraw ' +
        vmdkFileName +
        ' ' +
        reconvertedFromVmdk
    )
    await execa.shell(
      'qemu-img convert -fvpc -Oraw ' + vhdFileName + ' ' + reconvertedFromVhd
    )
    await execa.shell(
      'qemu-img compare ' + reconvertedFromVmdk + ' ' + reconvertedFromVhd
    )
  } catch (error) {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(error.message)
    throw error
  }
})
