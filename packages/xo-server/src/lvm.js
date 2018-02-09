import execa from 'execa'
import splitLines from 'split-lines'
import { createParser } from 'parse-pairs'
import { isArray, map } from 'lodash'

// ===================================================================

const parse = createParser({
  keyTransform: key => key.slice(5).toLowerCase(),
})
const makeFunction = command => (fields, ...args) =>
  execa
    .stdout(command, [
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
    .then(stdout =>
      map(
        splitLines(stdout),
        isArray(fields)
          ? parse
          : line => {
            const data = parse(line)
            return data[fields]
          }
      )
    )

export const lvs = makeFunction('lvs')
export const pvs = makeFunction('pvs')
