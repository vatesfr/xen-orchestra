import asyncIteratorToStream from 'async-iterator-to-stream'
import { pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'
import execa from 'execa'
import fs from 'fs-extra'

export async function createRandomFile(name, sizeMB) {
  const createRandomStream = asyncIteratorToStream(function* (size) {
    while (size-- > 0) {
      yield Buffer.from([Math.floor(Math.random() * 256)])
    }
  })
  const input = createRandomStream(sizeMB * 1024 * 1024)
  await pFromCallback(cb => pipeline(input, fs.createWriteStream(name), cb))
}

export async function checkFile(vhdName) {
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdName])
}

export async function recoverRawContent(vhdName, rawName, originalSize) {
  await checkFile(vhdName)
  await execa('qemu-img', ['convert', '-fvpc', '-Oraw', vhdName, rawName])
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}

export async function convertFromRawToVhd(rawName, vhdName) {
  await execa('qemu-img', ['convert', '-f', 'raw', '-Ovpc', rawName, vhdName])
}

export async function createRandomVhdFile(path, sizeMB) {
  const rawFileName = `${path}.temp.raw`
  await createRandomFile(rawFileName, sizeMB)
  const vhdFileName = `${path}`
  await convertFromRawToVhd(rawFileName, vhdFileName)
}

export async function createRandomVhdDirectory(path, sizeMB) {
  fs.mkdir(path)
  const rawFileName = `${path}/temp.raw`
  await createRandomFile(rawFileName, sizeMB)
  const vhdFileName = `${path}/vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)

  const srcVhd = await fs.open(vhdFileName, 'r')

  const footer = Buffer.alloc(512)
  await fs.read(srcVhd, footer, 0, footer.length, 0)
  await fs.writeFile(path + '/footer', footer)

  const header = Buffer.alloc(1024)
  await fs.read(srcVhd, header, 0, header.length, 512)
  await fs.writeFile(path + '/header', header)

  await fs.close(srcVhd)

  // a BAT , with at most 512 blocks of 2MB
  const bat = Buffer.alloc(512, 1)
  await fs.writeFile(path + '/bat', bat)

  // copy blocks
  const srcRaw = await fs.open(rawFileName, 'r')
  const blockDataSize = 512 * 4096
  const bitmap = Buffer.alloc(4096)
  await fs.mkdir(path + '/blocks/')
  await fs.mkdir(path + '/blocks/1/')
  for (let i = 0, offset = 0; i < sizeMB; i++, offset += blockDataSize) {
    const blockData = Buffer.alloc(blockDataSize)
    await fs.read(srcRaw, blockData, offset)
    await fs.writeFile(path + '/blocks/1/' + i, Buffer.concat([bitmap, blockData]))
  }
  await fs.close(srcRaw)
}
