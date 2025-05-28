#!/usr/bin/env node

'use strict'

const { inspect } = require('node:util')
const { formatXml } = require('@vates/xml/format')
const { parseXml } = require('@vates/xml/parse')
const { readFileSync } = require('node:fs')

function log(val) {
  process.stdout.write(inspect(val, false, null, true))
  process.stdout.write('\n')
}

function main([inputPath = 0]) {
  const input = readFileSync(inputPath)

  // attempt to parse from JSON
  let data
  try {
    data = JSON.parse(input)
  } catch (error) {
    // fall back to XML
    log(parseXml(input))
    return
  }

  process.stdout.write(formatXml(data))
}
main(process.argv.slice(2))
