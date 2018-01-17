/* eslint-env jest */

import {
  getPropertyClausesStrings,
  Null,
  parse,
  setPropertyClause,
} from './'
import { ast, pattern } from './index.fixtures'

it('getPropertyClausesStrings', () => {
  const tmp = getPropertyClausesStrings(parse('foo bar:baz baz:|(foo bar)'))
  expect(tmp).toEqual({
    bar: ['baz'],
    baz: ['foo', 'bar'],
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
    expect(node.match('32')).toBe(false)
    expect(node.toString()).toBe('32')

    node = parse('"32"')
    expect(node.match(32)).toBe(false)
    expect(node.match('32')).toBe(true)
    expect(node.toString()).toBe('"32"')
  })
})

describe('setPropertyClause', () => {
  it('creates a node if none passed', () => {
    expect(setPropertyClause(undefined, 'foo', 'bar').toString()).toBe('foo:bar')
  })

  it('adds a property clause if there was none', () => {
    expect(
      setPropertyClause(parse('baz'), 'foo', 'bar').toString()
    ).toBe('baz foo:bar')
  })

  it('replaces the property clause if there was one', () => {
    expect(
      setPropertyClause(parse('plip foo:baz plop'), 'foo', 'bar').toString()
    ).toBe('plip plop foo:bar')

    expect(
      setPropertyClause(parse('foo:|(baz plop)'), 'foo', 'bar').toString()
    ).toBe('foo:bar')
  })

  it('removes the property clause if no chid is passed', () => {
    expect(
      setPropertyClause(parse('foo bar:baz qux'), 'bar', undefined).toString()
    ).toBe('foo qux')

    expect(
      setPropertyClause(parse('foo bar:baz qux'), 'baz', undefined).toString()
    ).toBe('foo bar:baz qux')
  })
})

it('toString', () => {
  expect(pattern).toBe(ast.toString())
})
