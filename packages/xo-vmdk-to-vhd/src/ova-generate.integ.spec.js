/* eslint-env jest */
import { validateXMLWithXSD } from 'validate-with-xmllint'
import { createReadStream, createWriteStream, readFile } from 'fs-extra'
import execa from 'execa'
import path from 'path'
import { pFromCallback, fromEvent } from 'promise-toolbox'
import tmp from 'tmp'
import rimraf from 'rimraf'
import { writeOvaOn } from './ova-generate'
import { parseOVF } from './ova-read'

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
  const inputRawFileName1 = 'random-data1.raw'
  const inputRawFileName2 = 'random-data2.raw'
  const vhdFileName1 = 'random-data1.vhd'
  const vhdFileName2 = 'random-data2.vhd'
  const ovaFileName1 = 'random-disk1.ova'
  const dataSize = 100 * 1024 * 1024 // this number is an integer head/cylinder/count equation solution
  try {
    await execa('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName1, [], { shell: true })
    await execa('base64 /dev/urandom | head -c ' + dataSize + ' > ' + inputRawFileName2, [], { shell: true })
    await execa('qemu-img', ['convert', '-fraw', '-Ovpc', inputRawFileName1, vhdFileName1])
    await execa('qemu-img', ['convert', '-fraw', '-Ovpc', inputRawFileName2, vhdFileName2])
    const destination = await createWriteStream(ovaFileName1)
    const diskName1 = 'disk1'
    const diskName2 = 'disk2'
    const vmdkDiskName1 = `${diskName1}.vmdk`
    const vmdkDiskName2 = `${diskName2}.vmdk`
    const pipe = await writeOvaOn(destination, {
      vmName: 'vm1',
      vmDescription: 'desc',
      vmMemoryMB: 100,
      cpuCount: 3,
      nics: [{ name: 'eth12', networkName: 'BigLan' }],
      disks: [{
        name: diskName1,
        fileName: 'diskName1.vmdk',
        capacityMB: Math.ceil(dataSize / 1024 * 1024),
        getStream: async () => {
          return createReadStream(vhdFileName1)
        }
      },
        {
          name: diskName2,
          fileName: 'diskName1.vmdk',
          capacityMB: Math.ceil(dataSize / 1024 * 1024),
          getStream: async () => {
            return createReadStream(vhdFileName2)
          }
        }]
    })
    await fromEvent(pipe, 'finish')
    await execa('tar', ['xf', ovaFileName1, 'vm1.ovf'])
    const xml = await readFile('vm1.ovf', { encoding: 'utf-8' })

    try {
      await validateXMLWithXSD(xml, path.join(__dirname, 'ova-schema', 'dsp8023_1.1.1.xsd'))
      await execa('tar', ['xf', ovaFileName1, vmdkDiskName1])
      await execa('tar', ['xf', ovaFileName1, vmdkDiskName2])
      await execa('qemu-img', ['check', vmdkDiskName1])
      await execa('qemu-img', ['check', vmdkDiskName2])
      await execa('qemu-img', ['compare', inputRawFileName1, vmdkDiskName1])
      await execa('qemu-img', ['compare', inputRawFileName2, vmdkDiskName2])
      const result = await parseOVF({ read: () => xml }, s => s)
      console.log('result', result)
    } catch (e) {
      console.log({ xml })
      throw e
    }
  } catch (error) {
    console.error(error.stdout)
    console.error(error.stderr)
    console.error(error.message)
    throw error
  }
})
