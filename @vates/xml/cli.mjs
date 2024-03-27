#!/usr/bin/env node

import { inspect } from 'node:util'
import { parse } from '@vates/xml/parse.mjs'
import { readFileSync } from 'node:fs'

function log(val) {
  process.stdout.write(inspect(val, false, null, true))
  process.stdout.write('\n')
}

function main([input = 0]) {
  log(parse(readFileSync(input)))
}
main(process.argv.slice(2))
