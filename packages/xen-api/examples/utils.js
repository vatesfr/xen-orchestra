const { createReadStream, createWriteStream, statSync } = require('fs')
const { PassThrough } = require('stream')

exports.createInputStream = path => {
  if (path === undefined || path === '-') {
    return process.stdin
  }

  const { size } = statSync(path)

  const stream = createReadStream(path)
  stream.length = size
  return stream
}

exports.createOutputStream = path => {
  if (path !== undefined && path !== '-') {
    return createWriteStream(path)
  }

  // introduce a through stream because stdout is not a normal stream!
  const stream = new PassThrough()
  stream.pipe(process.stdout)
  return stream
}
