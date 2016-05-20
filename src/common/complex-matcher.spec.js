import test from 'ava'

import {
  addPropertyClause,
  parse,
  toString
} from './complex-matcher'
import {
  ast,
  pattern
} from './complex-matcher.fixtures'

test('addPropertyClause', t => {
  t.is(
    null::addPropertyClause('foo', 'bar')::toString(),
    'foo:bar'
  )

  t.is(
    parse('baz')::addPropertyClause('foo', 'bar')::toString(),
    'baz foo:bar'
  )

  t.is(
    parse('plip foo:baz plop')::addPropertyClause('foo', 'bar')::toString(),
    'plip foo:|(baz bar) plop'
  )

  t.is(
    parse('foo:|(baz plop)')::addPropertyClause('foo', 'bar')::toString(),
    'foo:|(baz plop bar)'
  )
})

test('parse', t => {
  t.deepEqual(parse(pattern), ast)
})

test('toString', t => {
  t.is(pattern, ast::toString())
})
