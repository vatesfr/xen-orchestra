/* eslint-env jest */

import { ast, pattern } from './index.fixtures'
import {
  getPropertyClausesStrings,
  GlobPattern,
  Null,
  NumberNode,
  NumberOrStringNode,
  parse,
  setPropertyClause,
} from './'

it('getPropertyClausesStrings', () => {
  const tmp = getPropertyClausesStrings(parse('foo bar:baz baz:|(foo bar /^boo$/ /^far$/) foo:/^bar$/'))
  expect(tmp).toEqual({
    bar: ['baz'],
    baz: ['foo', 'bar', 'boo', 'far'],
    foo: ['bar'],
  })
})

describe('parse', () => {
  it('analyses a string and returns a node/tree', () => {
    expect(parse(pattern)).toEqual(ast)
  })

  it('supports an empty string', () => {
    expect(parse('')).toEqual(new Null())
  })

  it('differentiate between numbers and numbers in strings', () => {
    let node

    node = parse('32')
    expect(node.match(32)).toBe(true)
    expect(node.match('32')).toBe(true)
    expect(node.toString()).toBe('32')

    node = parse('"32"')
    expect(node.match(32)).toBe(false)
    expect(node.match('32')).toBe(true)
    expect(node.toString()).toBe('"32"')
  })
})

describe('GlobPattern', () => {
  it('matches a glob pattern recursively', () => {
    expect(new GlobPattern('b*r').match({ foo: 'bar' })).toBe(true)
  })
})

describe('Number', () => {
  it('match a number recursively', () => {
    expect(new NumberNode(3).match([{ foo: 3 }])).toBe(true)
  })
})

describe('NumberOrStringNode', () => {
  it('match a string', () => {
    expect(new NumberOrStringNode('123').match([{ foo: '123' }])).toBe(true)
  })
})

describe('setPropertyClause', () => {
  it('creates a node if none passed', () => {
    expect(setPropertyClause(undefined, 'foo', 'bar').toString()).toBe('foo:bar')
  })

  it('adds a property clause if there was none', () => {
    expect(setPropertyClause(parse('baz'), 'foo', 'bar').toString()).toBe('baz foo:bar')
  })

  it('replaces the property clause if there was one', () => {
    expect(setPropertyClause(parse('plip foo:baz plop'), 'foo', 'bar').toString()).toBe('plip plop foo:bar')

    expect(setPropertyClause(parse('foo:|(baz plop)'), 'foo', 'bar').toString()).toBe('foo:bar')
  })

  it('removes the property clause if no chid is passed', () => {
    expect(setPropertyClause(parse('foo bar:baz qux'), 'bar', undefined).toString()).toBe('foo qux')

    expect(setPropertyClause(parse('foo bar:baz qux'), 'baz', undefined).toString()).toBe('foo bar:baz qux')
  })
})

it('toString', () => {
  expect(ast.toString()).toBe(pattern)
})
