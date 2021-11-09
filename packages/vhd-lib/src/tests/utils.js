import { pFromCallback } from 'promise-toolbox'
import { pipeline } from 'readable-stream'
import asyncIteratorToStream from 'async-iterator-to-stream'
import execa from 'execa'
import fs from 'fs-extra'
import { randomBytes } from 'crypto'

const createRandomStream = asyncIteratorToStream(function* (size) {
  while (size > 0) {
    yield randomBytes(Math.min(size, 1024))
    size -= 1024
  }
})

export async function createRandomFile(name, sizeMB) {
  const input = createRandomStream(sizeMB * 1024 * 1024)
  await pFromCallback(cb => pipeline(input, fs.createWriteStream(name), cb))
}

export async function checkFile(vhdName) {
  await execa('vhd-util', ['check', '-p', '-b', '-t', '-n', vhdName])
}

const RAW = 'raw'
const VHD = 'vpc'
const VMDK = 'vmdk'

async function convert(inputFormat, inputFile, outputFormat, outputFile) {
  await execa('qemu-img', ['convert', `-f${inputFormat}`, '-O', outputFormat, inputFile, outputFile])
}

export async function convertFromRawToVhd(rawName, vhdName) {
  await convert(RAW, rawName, VHD, vhdName)
}

export async function convertFromVhdToRaw(vhdName, rawName) {
  await convert(VHD, vhdName, RAW, rawName)
}

export async function convertFromVmdkToRaw(vmdkName, rawName) {
  await convert(VMDK, vmdkName, RAW, rawName)
}

export async function recoverRawContent(vhdName, rawName, originalSize) {
  // todo should use createContentStream
  await checkFile(vhdName)
  await convertFromVhdToRaw(vhdName, rawName)
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}

// @ todo how can I call vhd-cli copy from here
export async function convertToVhdDirectory(rawFileName, vhdFileName, path) {
  fs.mkdirp(path)

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
  await fs.mkdir(path + '/blocks/0/')
  const stats = await fs.stat(rawFileName)

  const sizeMB = stats.size / 1024 / 1024
  for (let i = 0, offset = 0; i < sizeMB; i++, offset += blockDataSize) {
    const blockData = Buffer.alloc(blockDataSize)
    await fs.read(srcRaw, blockData, offset)
    await fs.writeFile(path + '/blocks/0/' + i, Buffer.concat([bitmap, blockData]))
  }
  await fs.close(srcRaw)
}

export async function createRandomVhdDirectory(path, sizeMB) {
  fs.mkdirp(path)
  const rawFileName = `${path}/temp.raw`
  await createRandomFile(rawFileName, sizeMB)
  const vhdFileName = `${path}/temp.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await convertToVhdDirectory(rawFileName, vhdFileName, path)
}
