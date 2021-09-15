'use strict'
import { instantiateParser } from './vhdparser.js'
import { instantiateBuilder } from './buildVhdFromEvents'
import aws from '@sullux/aws-sdk'
import https from 'https'
import { exec } from 'child_process'
import fs from 'fs'
import { createLogger } from '@xen-orchestra/log'

const { debug } = createLogger('vhd-lib:test-emitter')

const params = {
  accessKeyId: 'MINIO LOGIN',
  apiVersion: '2006-03-01',
  endpoint: 'MINIO IP',
  s3ForcePathStyle: true,
  secretAccessKey: 'MINIO PASSWORD',
  signatureVersion: 'v4',
  httpOptions: {
    timeout: 600000,

    agent: new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
    }),
  },
}
const s3 = aws(params).s3

const src = 'ADD YOUR SRC '
const dest = 'A TEMP FILE '

function fromLocalToS3(maxConcurrency, compressed) {
  const parser = instantiateParser('stream', {
    stream: fs.createReadStream(src),
  })

  const promise = instantiateBuilder('s3', parser, {
    s3,
    bucket: 'xoa',
    dir: 'xoa_backup/' + (compressed ? compressed + '/' : 'raw/'),
    maxConcurrency,
    compressed,
  })
  parser.parse()
  return promise
}

function fromS3ToLocal(compressed) {
  fs.unlinkSync(dest)
  const parser = instantiateParser('s3', {
    s3,
    bucket: 'xoa',
    dir: 'xoa_backup/' + (compressed ? compressed + '/' : 'raw/'),
    compressed,
  })
  const promise = instantiateBuilder('stream', parser, {
    outputStream: fs.createWriteStream(dest),
  })
  parser.parse()
  return promise
}

function checkFile() {
  return new Promise((resolve, reject) => {
    exec(`cmp "${src}" "${dest}"`, (err, out) => {
      if (err) {
        reject(err)
      }
      if (out || out.length > 10) {
        reject(out)
      }
      resolve()
    })
  })
}

function format(stats) {
  if (!stats) {
    return
  }

  const titles = []
  for (const key in stats[0]) {
    titles.push(key)
  }
  debug(titles.join('\t|'))
  for (const stat of stats) {
    let line = ''

    for (const key of titles) {
      let formatted = ''
      if (key.indexOf('Size') > 0) {
        formatted = '' + Math.round((10 * stat[key]) / 1024 / 1024 / 1024) / 10
      } else {
        if (key.indexOf('Duration') > 0) {
          formatted = '' + Math.round(stat[key] / 1000)
        } else {
          formatted = stat[key] ?? ''
        }
      }
      line += (formatted.length < 3 ? '\t' : '') + formatted + '\t|'
    }
    debug(line)
  }
}

/**
 * will bench different parallelism size for sending file
 */

async function bench() {
  const stats = []
  for (let i = 16; i > 0; i -= 4) {
    for (const compression of ['zstd', 'gz', null]) {
      const res = await fromLocalToS3(i, compression)
      stats.push({ compression, parallel: i, ...res })
    }
    format(stats)
  }
}

/**
 * check if we are still bit perfect when saving a file to s3 , downloading it and comapring it bits for bits
 * @param {int} parallel
 */
// eslint-disable-next-line no-unused-vars
async function check(parallel) {
  const size = fs.statSync(src).size / 1024 / 1024
  for (const compression of ['zstd', 'gz', null]) {
    const start = new Date()
    await fromLocalToS3(parallel, compression)
    const sent = new Date()
    await fromS3ToLocal(compression)
    const downloaded = new Date()
    await checkFile()
    const checked = new Date()
    debug(
      compression,
      '\t',
      Math.round(size / ((sent - start) / 1000)),
      'MB/s\t',
      Math.round(size / ((downloaded - sent) / 1000)),
      'MB/s\t',
      Math.round(size / ((checked - downloaded) / 1000)),
      'MB/s\t'
    )
  }
}

bench()
