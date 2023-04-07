'use strict'

const assert = require('node:assert/strict')
const test = require('test')

const diff = require('./_diff.js')

test('data of equal length', function () {
  const data1 = 'foo bar baz'
  const data2 = 'baz bar foo'
  assert.deepEqual(diff(data1, data2), [
    [0, 'baz'],
    [8, 'foo'],
  ])
})

test('data1 is longer', function () {
  const data1 = 'foo bar'
  const data2 = 'foo'
  assert.deepEqual(diff(data1, data2), [[3, '']])
})

test('data2 is longer', function () {
  const data1 = 'foo'
  const data2 = 'foo bar'
  assert.deepEqual(diff(data1, data2), [[3, ' bar']])
})

test('with arrays', function () {
  const data1 = 'foo bar baz'.split('')
  const data2 = 'baz bar foo'.split('')
  assert.deepEqual(diff(data1, data2), [
    [0, 'baz'.split('')],
    [8, 'foo'.split('')],
  ])
})

test('with buffers', function () {
  const data1 = Buffer.from('foo bar baz')
  const data2 = Buffer.from('baz bar foo')
  assert.deepEqual(diff(data1, data2), [
    [0, Buffer.from('baz')],
    [8, Buffer.from('foo')],
  ])
})

test('encodeDiff param', function () {
  const data1 = Buffer.from('foo bar baz')
  const data2 = Buffer.from('baz bar foo')
  assert.deepEqual(
    diff(data1, data2, b => b.toString('hex')),
    [
      [0, '62617a'],
      [8, '666f6f'],
    ]
  )
})
