'use strict'

const assert = require('node:assert/strict')
const test = require('node:test')

const diff = require('./index.js')

test('data of equal length', function () {
  const data1 = 'foo bar baz'
  const data2 = 'baz bar foo'
  assert.deepEqual(diff(data1, data2), [0, 'baz', 8, 'foo'])
})

test('data1 is longer', function () {
  const data1 = 'foo bar'
  const data2 = 'foo'
  assert.deepEqual(diff(data1, data2), [3, ''])
})

test('data2 is longer', function () {
  const data1 = 'foo'
  const data2 = 'foo bar'
  assert.deepEqual(diff(data1, data2), [3, ' bar'])
})

test('with arrays', function () {
  const data1 = 'foo bar baz'.split('')
  const data2 = 'baz bar foo'.split('')
  assert.deepEqual(diff(data1, data2), [0, 'baz'.split(''), 8, 'foo'.split('')])
})

test('with buffers', function () {
  const data1 = Buffer.from('foo bar baz')
  const data2 = Buffer.from('baz bar foo')
  assert.deepEqual(diff(data1, data2), [0, Buffer.from('baz'), 8, Buffer.from('foo')])
})

test('cb param', function () {
  const data1 = 'foo bar baz'
  const data2 = 'baz bar foo'

  const calls = []
  const cb = (...args) => calls.push(args)

  diff(data1, data2, cb)

  assert.deepEqual(calls, [
    [0, 'baz'],
    [8, 'foo'],
  ])
})
