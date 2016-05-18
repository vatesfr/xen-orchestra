import test from 'ava'

import {
  parse,
  toString
} from './complex-matcher'
import {
  ast,
  pattern
} from './complex-matcher.fixtures'

test('parse', t => {
  t.deepEqual(parse(pattern), ast)
})

test('toString', t => {
  t.is(pattern, toString(ast))
})
