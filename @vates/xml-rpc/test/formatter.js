'use strict'

const { formatXml } = require('@vates/xml/format')
const { join } = require('node:path')
const { parseXml } = require('@vates/xml/parse')
const { readFileSync } = require('node:fs')
const { xmlRpcFormatter } = require('@vates/xml-rpc/formatter')
const assert = require('node:assert/strict')
const test = require('node:test')

const methodCall = require('./methodCall.js')

test(function () {
  const xmlTree = parseXml(readFileSync(join(__dirname, 'methodCall.xml')))

  const xmlRpc = xmlRpcFormatter.format_methodCall(methodCall)

  assert.deepEqual(parseXml(formatXml(xmlRpc)), xmlTree)
})
