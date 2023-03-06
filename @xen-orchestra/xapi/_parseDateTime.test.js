'use strict'

const assert = require('node:assert/strict')
const test = require('test')

const { parseDateTime } = require('./')

test('parseDateTime()', function () {
  for (const [input, output] of [
    // number
    [0, null],
    [1678040309, 1678040309],

    // string
    ['19700101T00:00:00Z', null],
    ['20230305T18:18:29Z', 1678040309],
    ['0', null],
    ['1675817747.', 1675817747],
    ['1647628715.91', 1647628715.91],

    // date
    [new Date(0), null],
    [new Date(1678040309000), 1678040309],
  ]) {
    assert.equal(parseDateTime(input), output)
  }
})

test('failing parseDateTime()' , function(){
    for (const [input, error] of [
    // object
    [{}, TypeError],
    [undefined, TypeError],

    // string
    ['XXX 03/10/2010', RangeError]
  ]) {
    assert.throws(() => parseDateTime(input), error)
  }
})
