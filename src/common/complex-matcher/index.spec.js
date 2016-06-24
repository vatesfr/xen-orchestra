import test from 'ava'

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

test('getPropertyClausesStrings', t => {
  let tmp = parse('foo bar:baz baz:|(foo bar)')::getPropertyClausesStrings()
  t.deepEqual(
    tmp,
    {
      bar: [ 'baz' ],
      baz: [ 'foo', 'bar' ]
    }
  )
})

test('parse', t => {
  t.deepEqual(parse(pattern), ast)
})

test('setPropertyClause', t => {
  t.is(
    null::setPropertyClause('foo', 'bar')::toString(),
    'foo:bar'
  )

  t.is(
    parse('baz')::setPropertyClause('foo', 'bar')::toString(),
    'baz foo:bar'
  )

  t.is(
    parse('plip foo:baz plop')::setPropertyClause('foo', 'bar')::toString(),
    'plip plop foo:bar'
  )

  t.is(
    parse('foo:|(baz plop)')::setPropertyClause('foo', 'bar')::toString(),
    'foo:bar'
  )
})

test('toString', t => {
  t.is(pattern, ast::toString())
})
