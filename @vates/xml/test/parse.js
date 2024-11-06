'use strict'

const { parseXml } = require('@vates/xml/parse')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const assert = require('node:assert/strict')
const test = require('node:test')

test('parse()', function () {
  const xml = String(readFileSync(join(__dirname, 'data.xml')))
  const tree = JSON.parse(readFileSync(join(__dirname, 'data.json')))

  assert.deepEqual(parseXml(xml), tree)
})
