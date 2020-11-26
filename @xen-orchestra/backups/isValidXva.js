const assert = require('assert')
const fs = require('fs-extra')

const isGzipFile = async fd => {
  // https://tools.ietf.org/html/rfc1952.html#page-5
  const magicNumber = Buffer.allocUnsafe(2)
  assert.strictEqual((await fs.read(fd, magicNumber, 0, magicNumber.length, 0)).bytesRead, magicNumber.length)
  return magicNumber[0] === 31 && magicNumber[1] === 139
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
const isValidTar = async (size, fd) => {
  if (size <= 1024 || size % 512 !== 0) {
    return false
  }

  const buf = Buffer.allocUnsafe(1024)
  assert.strictEqual((await fs.read(fd, buf, 0, buf.length, size - buf.length)).bytesRead, buf.length)
  return buf.every(_ => _ === 0)
}

// TODO: find an heuristic for compressed files
const isValidXva = async path => {
  try {
    const fd = await fs.open(path, 'r')
    try {
      const { size } = await fs.fstat(fd)
      if (size < 20) {
        // neither a valid gzip not tar
        return false
      }

      return (await isGzipFile(fd))
        ? true // gzip files cannot be validated at this time
        : await isValidTar(size, fd)
    } finally {
      fs.close(fd).catch(noop)
    }
  } catch (error) {
    // never throw, log and report as valid to avoid side effects
    console.error('isValidXva', path, error)
    return true
  }
}
exports.isValidXva = isValidXva

const noop = Function.prototype
