'use strict'

const { pFromCallback } = require('promise-toolbox')
const { pipeline } = require('readable-stream')
const asyncIteratorToStream = require('async-iterator-to-stream')
const execa = require('execa')
const fs = require('fs-extra')
const fsPromise = require('node:fs/promises')
const { randomBytes } = require('crypto')

const createRandomStream = asyncIteratorToStream(function* (size) {
  while (size > 0) {
    yield randomBytes(Math.min(size, 1024))
    size -= 1024
  }
})

async function createRandomFile(name, sizeMB) {
  const input = createRandomStream(sizeMB * 1024 * 1024)
  await pFromCallback(cb => pipeline(input, fs.createWriteStream(name), cb))
}
exports.createRandomFile = createRandomFile

async function checkFile(vhdName) {
  // Since the qemu-img check command isn't compatible with vhd format, we use
  // the convert command to do a check by conversion. Indeed, the conversion will
  // fail if the source file isn't a proper vhd format.
  const target = vhdName + '.qcow2'
  try {
    await execa('qemu-img', ['convert', '-fvpc', '-Oqcow2', vhdName, target])
  } finally {
    try {
      await fsPromise.unlink(target)
    } catch (err) {
      console.warn(err)
    }
  }
}
exports.checkFile = checkFile

const RAW = 'raw'
const VHD = 'vpc'
const VMDK = 'vmdk'

async function convert(inputFormat, inputFile, outputFormat, outputFile) {
  await execa('qemu-img', ['convert', `-f${inputFormat}`, '-O', outputFormat, inputFile, outputFile])
}

async function convertFromRawToVhd(rawName, vhdName) {
  await convert(RAW, rawName, VHD, vhdName)
}
exports.convertFromRawToVhd = convertFromRawToVhd

async function convertFromVhdToRaw(vhdName, rawName) {
  await convert(VHD, vhdName, RAW, rawName)
}
exports.convertFromVhdToRaw = convertFromVhdToRaw

exports.convertFromVmdkToRaw = async function convertFromVmdkToRaw(vmdkName, rawName) {
  await convert(VMDK, vmdkName, RAW, rawName)
}

exports.recoverRawContent = async function recoverRawContent(vhdName, rawName, originalSize) {
  // todo should use createContentStream
  await checkFile(vhdName)
  await convertFromVhdToRaw(vhdName, rawName)
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}

// @ todo how can I call vhd-cli copy from here
async function convertToVhdDirectory(rawFileName, vhdFileName, path, { dedup = false } = {}) {
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
  // make a block bitmap full of 1, marking all sectors of the block as used
  const bitmap = Buffer.alloc(512, 255)
  await fs.mkdir(path + '/blocks/')
  await fs.mkdir(path + '/blocks/0/')
  const stats = await fs.stat(rawFileName)

  for (let i = 0, offset = 0; offset < stats.size; i++, offset += blockDataSize) {
    const blockData = Buffer.alloc(blockDataSize)
    await fs.read(srcRaw, blockData, 0, blockData.length, offset)
    await fs.writeFile(path + '/blocks/0/' + i, Buffer.concat([bitmap, blockData]))
  }

  await fs.writeFile(path + '/chunk-filters.json', JSON.stringify(['none', dedup]))
  await fs.close(srcRaw)
}
exports.convertToVhdDirectory = convertToVhdDirectory

exports.createRandomVhdDirectory = async function createRandomVhdDirectory(path, sizeMB, { dedup = false } = {}) {
  fs.mkdirp(path)
  const rawFileName = `${path}/temp.raw`
  await createRandomFile(rawFileName, sizeMB)
  const vhdFileName = `${path}/temp.vhd`
  await convertFromRawToVhd(rawFileName, vhdFileName)
  await convertToVhdDirectory(rawFileName, vhdFileName, path, { dedup })
}
