'use strict'

const { formatXml } = require('@vates/xml/format')
const { join } = require('node:path')
const { readFileSync } = require('node:fs')
const assert = require('node:assert/strict')
const test = require('node:test')

test('format()', function () {
  const xml = String(readFileSync(join(__dirname, 'data.xml')))
  const tree = JSON.parse(readFileSync(join(__dirname, 'data.json')))

  assert.equal(formatXml(tree) + '\n', xml)
})

test('supports missing attributes and children', function () {
  assert.equal(formatXml({ name: 'foo' }, { includeDeclaration: false }), '<foo />')
})
