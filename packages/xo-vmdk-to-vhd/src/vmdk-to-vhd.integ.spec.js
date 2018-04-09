/* eslint-env jest */

import { computeGeometryForSize } from '@xen-orchestra/vhd-lib'
import execa from 'execa'
import { exec } from 'child-process-promise'
import { createReadStream, createWriteStream } from 'fs-promise'
import { convertFromVMDK } from './vhd-write'

jest.setTimeout(10000)

test('VMDK to VHD can convert a random data file with VMDKDirectParser', async () => {
  const inputRawFileName = 'random-data.raw'
  const vmdkFileName = 'random-data.vmdk'
  const vhdFileName = 'from-vmdk-VMDKDirectParser.vhd'
  const reconvertedRawFilemane = 'from-vhd.raw'
  const reconvertedByVBoxRawFilemane = 'from-vhd-by-vbox.raw'
  const dataSize = computeGeometryForSize(8 * 1024 * 1024).actualSize
  await exec(
    'rm -f ' +
      [
        inputRawFileName,
        vmdkFileName,
        vhdFileName,
        reconvertedRawFilemane,
        reconvertedByVBoxRawFilemane,
      ].join(' ')
  )
  await exec(
    'base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName
  )
  await exec(
    'python /usr/share/pyshared/VMDKstream.py ' +
      inputRawFileName +
      ' ' +
      vmdkFileName
  )
  const pipe = (await convertFromVMDK(createReadStream(vmdkFileName))).pipe(
    createWriteStream(vhdFileName)
  )
  await new Promise((resolve, reject) => {
    pipe.on('finish', resolve)
    pipe.on('error', reject)
  })
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdFileName])
  await exec(
    'qemu-img convert -fvmdk -Oraw ' +
      vmdkFileName +
      ' ' +
      reconvertedByVBoxRawFilemane
  )
  await exec(
    'qemu-img convert -fvpc -Oraw ' + vhdFileName + ' ' + reconvertedRawFilemane
  )
  return exec(
    'qemu-img compare ' +
      reconvertedByVBoxRawFilemane +
      ' ' +
      reconvertedRawFilemane
  ).catch(error => {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(vhdFileName, vmdkFileName, error.message)
    throw error
  })
})
