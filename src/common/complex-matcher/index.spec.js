/* eslint-env jest */

import {
  getPropertyClausesStrings,
  parse,
  setPropertyClause,
  toString
} from './'
import {
  ast,
  pattern
} from './index.fixtures'

it('getPropertyClausesStrings', () => {
  const tmp = parse('foo bar:baz baz:|(foo bar)')::getPropertyClausesStrings()
  expect(tmp).toEqual({
    bar: [ 'baz' ],
    baz: [ 'foo', 'bar' ]
  })
})

it('parse', () => {
  expect(parse(pattern)).toEqual(ast)
})

it('setPropertyClause', () => {
  expect(
    null::setPropertyClause('foo', 'bar')::toString()
  ).toBe('foo:bar')

  expect(
    parse('baz')::setPropertyClause('foo', 'bar')::toString()
  ).toBe('baz foo:bar')

  expect(
    parse('plip foo:baz plop')::setPropertyClause('foo', 'bar')::toString()
  ).toBe('plip plop foo:bar')

  expect(
    parse('foo:|(baz plop)')::setPropertyClause('foo', 'bar')::toString()
  ).toBe('foo:bar')
})

it('toString', () => {
  expect(pattern).toBe(ast::toString())
})
