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
  await checkFile(vhdName)
  await convertFromVhdToRaw(vhdName, rawName)
  if (originalSize !== undefined) {
    await execa('truncate', ['-s', originalSize, rawName])
  }
}
