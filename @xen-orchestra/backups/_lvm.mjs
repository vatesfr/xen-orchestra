import fromCallback from 'promise-toolbox/fromCallback'
import { createParser } from 'parse-pairs'
import { execFile } from 'child_process'

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

export const lvs = makeFunction('lvs')
export const pvs = makeFunction('pvs')
