'use strict'

const { join } = require('node:path')
const { parseXml } = require('@vates/xml/parse')
const { readFileSync } = require('node:fs')
const { xmlRpcParser } = require('@vates/xml-rpc/parser')
const assert = require('node:assert/strict')
const test = require('node:test')

const methodCall = require('./methodCall.js')

test('parser.parse()', function () {
  const xml = String(readFileSync(join(__dirname, 'methodCall.xml')))
  const xmlRpc = parseXml(xml)

  assert.deepEqual(xmlRpcParser.parse(xmlRpc), methodCall)
})

test('datetime without dashes nor milliseconds', function () {
  assert.deepEqual(
    xmlRpcParser.parse({ name: 'dateTime.iso8601', children: ['19980717T14:08:55Z'] }),
    new Date('1998-07-17T14:08:55Z')
  )
})

test('i4 support', function () {
  assert.equal(xmlRpcParser.parse({ name: 'i4', children: ['42'] }), 42)
})

test('string support', function () {
  assert.equal(xmlRpcParser.parse({ name: 'string', children: ['foo'] }), 'foo')
})
