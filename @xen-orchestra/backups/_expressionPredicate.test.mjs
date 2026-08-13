import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { compileExpression, isExpression } from './_expressionPredicate.mjs'

describe('compileExpression', () => {
  it('run:dayOfWeek:0', () => {
    const predicate = compileExpression('run:dayOfWeek:0')

    assert(predicate({ run: { dayOfWeek: 0 } }))
    assert(!predicate({ run: { dayOfWeek: 1 } }))
  })

  it('chainLength:>5', () => {
    const predicate = compileExpression('chainLength:>5')

    assert(predicate({ chainLength: 6 }))
    assert(!predicate({ chainLength: 5 }))
  })

  it('vm:tags:prod', () => {
    const predicate = compileExpression('vm:tags:prod')

    assert(predicate({ vm: { tags: ['prod'] } }))
    assert(predicate({ vm: { tags: ['prod', 'test'] } }))
    assert(!predicate({ vm: { tags: ['test'] } }))
    assert(!predicate({ vm: { tags: [] } }))
  })

  it('run:dayOfWeek:0 chainLength:>3', () => {
    const predicate = compileExpression('run:dayOfWeek:0 chainLength:>3')

    assert(predicate({ run: { dayOfWeek: 0 }, chainLength: 6 }))
    assert(!predicate({ run: { dayOfWeek: 0 }, chainLength: 2 }))
    assert(!predicate({ run: { dayOfWeek: 1 }, chainLength: 6 }))
  })

  it('|(run:dayOfWeek:0 chainLength:>6)', () => {
    const predicate = compileExpression('|(run:dayOfWeek:0 chainLength:>6)')

    assert(predicate({ run: { dayOfWeek: 0 }, chainLength: 7 }))
    assert(predicate({ run: { dayOfWeek: 1 }, chainLength: 7 }))
    assert(predicate({ run: { dayOfWeek: 0 }, chainLength: 6 }))
    assert(!predicate({ run: { dayOfWeek: 1 }, chainLength: 6 }))
  })

  it('missing field', () => {
    const predicate = compileExpression('run:dayOfWeek:0')

    assert(predicate({ run: { dayOfWeek: 0 }, chainLength: 6 }))
    assert(!predicate({ chainLength: 6 }))
    assert(!predicate({ run: {}, chainLength: 6 }))
  })

  it('null-checking', () => {
    const predicate = compileExpression('!vm')

    assert(predicate({}))
    assert(!predicate({ vm: [{ vm: 'vm' }] }))
  })

  it('throws on invalid expression', () => {
    assert.throws(() => compileExpression('vm:('))
  })
})

describe('isExpression', () => {
  it('non-empty string', () => {
    assert(isExpression('vm:tags:test'))
  })

  it('number', () => {
    assert(!isExpression(0))
  })

  it('string[]', () => {
    assert(!isExpression(['string']))
  })

  it('undefined', () => {
    assert(!isExpression(undefined))
  })

  it('empty string', () => {
    assert(!isExpression(''))
  })
})
