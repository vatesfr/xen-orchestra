'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { ast, pattern } = require('./index.fixtures')
const {
  getPropertyClausesStrings,
  GlobPattern,
  Null,
  NumberNode,
  NumberOrStringNode,
  parse,
  Property,
  setPropertyClause,
  StringNode,
} = require('./')

it('getPropertyClausesStrings', () => {
  const tmp = getPropertyClausesStrings(parse('foo bar:baz baz:|(foo bar /^boo$/ /^far$/) foo:/^bar$/'))
  assert.deepEqual(tmp, {
    bar: ['baz'],
    baz: ['foo', 'bar', 'boo', 'far'],
    foo: ['bar'],
  })
})

describe('parse', () => {
  it('analyses a string and returns a node/tree', () => {
    assert.deepEqual(parse(pattern), ast)
  })

  it('supports an empty string', () => {
    assert.deepEqual(parse(''), new Null())
  })

  it('differentiate between numbers and numbers in strings', () => {
    let node

    node = parse('32')
    assert.equal(node.match(32), true)
    assert.equal(node.match('32'), true)
    assert.equal(node.toString(), '32')

    node = parse('"32"')
    assert.equal(node.match(32), false)
    assert.equal(node.match('32'), true)
    assert.equal(node.toString(), '"32"')
  })

  it('supports non-ASCII letters in raw strings', () => {
    assert.deepEqual(parse('åäöé:ÅÄÖÉ'), new Property('åäöé', new StringNode('ÅÄÖÉ')))
  })
})

describe('GlobPattern', () => {
  it('matches a glob pattern recursively', () => {
    assert.equal(new GlobPattern('b*r').match({ foo: 'bar' }), true)
  })
})

describe('Number', () => {
  it('match a number recursively', () => {
    assert.equal(new NumberNode(3).match([{ foo: 3 }]), true)
  })
})

describe('NumberOrStringNode', () => {
  it('match a string', () => {
    assert.equal(new NumberOrStringNode('123').match([{ foo: '123' }]), true)
  })
})

describe('setPropertyClause', () => {
  it('creates a node if none passed', () => {
    assert.equal(setPropertyClause(undefined, 'foo', 'bar').toString(), 'foo:bar')
  })

  it('adds a property clause if there was none', () => {
    assert.equal(setPropertyClause(parse('baz'), 'foo', 'bar').toString(), 'baz foo:bar')
  })

  it('replaces the property clause if there was one', () => {
    assert.equal(setPropertyClause(parse('plip foo:baz plop'), 'foo', 'bar').toString(), 'plip plop foo:bar')

    assert.equal(setPropertyClause(parse('foo:|(baz plop)'), 'foo', 'bar').toString(), 'foo:bar')
  })

  it('removes the property clause if no chid is passed', () => {
    assert.equal(setPropertyClause(parse('foo bar:baz qux'), 'bar', undefined).toString(), 'foo qux')

    assert.equal(setPropertyClause(parse('foo bar:baz qux'), 'baz', undefined).toString(), 'foo bar:baz qux')
  })
})

it('toString', () => {
  assert.equal(ast.toString(), pattern)
})
