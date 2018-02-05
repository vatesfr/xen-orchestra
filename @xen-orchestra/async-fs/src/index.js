// @flow

import fs from 'fs'
import { promisifyAll } from 'promise-toolbox'

const NOT_PROMISIFIABLE_RE = /^(?:[_A-Z]|exists$)|(?:Async|Stream|Sync)$/

module.exports = promisifyAll(fs, {
  mapper: name => !NOT_PROMISIFIABLE_RE.test(name) && name,
})
