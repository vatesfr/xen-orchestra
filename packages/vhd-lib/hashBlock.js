'use strict'

const { createHash } = require('node:crypto')

// using xxhash as for xva would make smaller hash and the collision risk would be low for the dedup,
// since we have a tuple(index, hash), but it would be notable if
// we implement dedup on top of this later
// at most, a 2TB full vhd will use 32MB for its hashes
// and this file is compressed with vhd block
exports.hashBlock = function (buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}
