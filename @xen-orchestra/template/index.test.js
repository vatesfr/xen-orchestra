'use strict'

const { it } = require('node:test')
const assert = require('assert').strict

const { compileTemplate } = require('.')

it("correctly replaces the template's variables", () => {
  const replacer = compileTemplate('{property}_\\{property}_\\\\{property}_{constant}_%_FOO', {
    '{property}': obj => obj.name,
    '{constant}': 1235,
    '%': (_, i) => i,
  })
  assert.strictEqual(replacer({ name: 'bar' }, 5), 'bar_{property}_\\bar_1235_5_FOO')
})
