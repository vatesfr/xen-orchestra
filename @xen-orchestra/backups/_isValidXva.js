'use strict'

const assert = require('assert')

const COMPRESSED_MAGIC_NUMBERS = [
  // https://tools.ietf.org/html/rfc1952.html#page-5
  Buffer.from('1F8B', 'hex'),

  // https://github.com/facebook/zstd/blob/dev/doc/zstd_compression_format.md#zstandard-frames
  Buffer.from('28B52FFD', 'hex'),
]
const MAGIC_NUMBER_MAX_LENGTH = Math.max(...COMPRESSED_MAGIC_NUMBERS.map(_ => _.length))

const isCompressedFile = async (handler, fd) => {
  const header = Buffer.allocUnsafe(MAGIC_NUMBER_MAX_LENGTH)
  assert.strictEqual((await handler.read(fd, header, 0)).bytesRead, header.length)

  for (const magicNumber of COMPRESSED_MAGIC_NUMBERS) {
    if (magicNumber.compare(header, 0, magicNumber.length) === 0) {
      return true
    }
  }
  return false
}

// TODO: better check?
//
// our heuristic is not good enough, there has been some false positives
// (detected as invalid by us but valid by `tar` and imported with success),
// either THOUGH THEY MAY HAVE BEEN COMPRESSED FILES:
// - these files were normal but the check is incorrect
// - these files were invalid but without data loss
// - these files were invalid but with silent data loss
//
// maybe reading the end of the file looking for a file named
// /^Ref:\d+/\d+\.checksum$/ and then validating the tar structure from it
//
// https://github.com/npm/node-tar/issues/234#issuecomment-538190295
const isValidTar = async (handler, size, fd) => {
  if (size <= 1024 || size % 512 !== 0) {
    return false
  }

  const buf = Buffer.allocUnsafe(1024)
  assert.strictEqual((await handler.read(fd, buf, size - buf.length)).bytesRead, buf.length)
  return buf.every(_ => _ === 0)
}

// TODO: find an heuristic for compressed files
async function isValidXva(path) {
  const handler = this._handler

  // size is longer when encrypted  + reading part of an encrypted file is not implemented
  if (handler.isEncrypted) {
    return true
  }
  try {
    const fd = await handler.openFile(path, 'r')
    try {
      const size = await handler.getSize(fd)
      if (size < 20) {
        // neither a valid gzip not tar
        return false
      }

      return (await isCompressedFile(handler, fd))
        ? true // compressed files cannot be validated at this time
        : await isValidTar(handler, size, fd)
    } finally {
      handler.closeFile(fd).catch(noop)
    }
  } catch (error) {
    // never throw, log and report as valid to avoid side effects
    return true
  }
}
exports.isValidXva = isValidXva

const noop = Function.prototype
