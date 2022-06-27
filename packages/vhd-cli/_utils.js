'use strict'

const { createWriteStream } = require('fs')
const { PassThrough } = require('stream')

const createOutputStream = path => {
  if (path !== undefined && path !== '-') {
    return createWriteStream(path)
  }

  // introduce a through stream because stdout is not a normal stream!
  const stream = new PassThrough()
  stream.pipe(process.stdout)
  return stream
}

exports.writeStream = function writeStream(input, path) {
  const output = createOutputStream(path)

  return new Promise((resolve, reject) =>
    input.on('error', reject).pipe(output.on('error', reject).on('finish', resolve))
  )
}
