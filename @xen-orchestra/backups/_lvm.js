'use strict'

const fromCallback = require('promise-toolbox/fromCallback')
const { createParser } = require('parse-pairs')
const { execFile } = require('child_process')

// ===================================================================

const parse = createParser({
  keyTransform: key => key.slice(5).toLowerCase(),
})
const makeFunction =
  command =>
  async (fields, ...args) => {
    const info = await fromCallback(execFile, command, [
      '--noheading',
      '--nosuffix',
      '--nameprefixes',
      '--unbuffered',
      '--units',
      'b',
      '-o',
      String(fields),
      ...args,
    ])
    return info
      .trim()
      .split(/\r?\n/)
      .map(Array.isArray(fields) ? parse : line => parse(line)[fields])
  }

exports.lvs = makeFunction('lvs')
exports.pvs = makeFunction('pvs')
