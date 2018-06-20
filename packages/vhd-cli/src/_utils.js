const { createReadStream, createWriteStream, statSync } = require('fs')
const { PassThrough } = require('stream')

export const createInputStream = path => {
  if (path === undefined || path === '-') {
    return process.stdin
  }

  const { size } = statSync(path)

  const stream = createReadStream(path)
  stream.length = size
  return stream
}

const createOutputStream = path => {
  if (path !== undefined && path !== '-') {
    return createWriteStream(path)
  }

  // introduce a through stream because stdout is not a normal stream!
  const stream = new PassThrough()
  stream.pipe(process.stdout)
  return stream
}

export const writeStream = (input, path) => {
  const output = createOutputStream(path)

  return new Promise((resolve, reject) =>
    input
      .on('error', reject)
      .pipe(output.on('error', reject).on('finish', resolve))
  )
}
