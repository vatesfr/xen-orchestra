'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { ast, pattern } = require('./index.fixtures')
const {
  getPropertyClausesStrings,
  Comparison,
  getResolveFields,
  GlobPattern,
  Null,
  NumberNode,
  NumberOrStringNode,
  parse,
  Property,
  Resolve,
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

describe('Comparison', () => {
  it('value should be a valid number', () => {
    const cmp = value => new Comparison('>', value)

    cmp(1)
    assert.throws(() => cmp('foo'), { message: 'value must be a number' })
    assert.throws(() => cmp(NaN), { message: 'value must be a number' })
  })

  it('can compare with numbers', () => {
    assert(new Comparison('>', 42).match(43))
    assert(!new Comparison('>', 42).match(42))

    assert(new Comparison('>', 42).match(43))
    assert(new Comparison('>=', 42).match(42))

    assert(new Comparison('<', 42).match(41))
    assert(!new Comparison('<', 42).match(42))

    assert(new Comparison('<', 42).match(41))
    assert(new Comparison('<=', 42).match(42))
  })

  it('can match with non numbers', () => {
    const ts = Date.now()

    assert(new Comparison('>', ts).match(new Date(ts + 1)))
    assert(!new Comparison('>', ts).match(new Date(ts)))
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

describe('getResolveFields', () => {
  it('returns field name and resolve node for a single property', () => {
    const resolveFields = getResolveFields(parse('object:[resolve]:tags:tag'))
    assert.deepEqual(resolveFields[0].path, ['object'])
    assert(resolveFields[0].resolveNode instanceof Resolve)
  })

  it('returns empty array when no [resolve] is present', () => {
    const resolveFields = getResolveFields(parse('tags:tag'))
    assert.equal(resolveFields.length, 0)
  })

  it('returns all field names and resolve nodes for an And node', () => {
    const resolveFields = getResolveFields(parse('object1:[resolve]:tags:tag object2:[resolve]:tags:tag'))
    assert.deepEqual(resolveFields[0].path, ['object1'])
    assert(resolveFields[0].resolveNode instanceof Resolve)
    assert.deepEqual(resolveFields[1].path, ['object2'])
    assert(resolveFields[1].resolveNode instanceof Resolve)
  })

  it('only returns properties with [resolve] in a mixed And node', () => {
    const resolveFields2 = getResolveFields(parse('object3:[resolve]:tags:tag tags:tag'))
    assert.equal(resolveFields2.length, 1)
    assert.deepEqual(resolveFields2[0].path, ['object3'])
    assert(resolveFields2[0].resolveNode instanceof Resolve)
  })

  it('returns all field names and resolve nodes for an Or node', () => {
    const resolveFields = getResolveFields(parse('|(object1:[resolve]:tags:tag object2:[resolve]:tags:tag)'))
    assert.equal(resolveFields.length, 2)
    assert.deepEqual(resolveFields[0].path, ['object1'])
    assert(resolveFields[0].resolveNode instanceof Resolve)
    assert.deepEqual(resolveFields[1].path, ['object2'])
    assert(resolveFields[1].resolveNode instanceof Resolve)
  })

  it('returns field names and resolve nodes inside a Not node', () => {
    const resolveFields = getResolveFields(parse('!(object:[resolve]:tags:tag)'))
    assert.equal(resolveFields.length, 1)
    assert.deepEqual(resolveFields[0].path, ['object'])
    assert(resolveFields[0].resolveNode instanceof Resolve)
  })

  it('returns the full path and resolve node for a nested property', () => {
    const resolveFields = getResolveFields(parse('properties:userId:[resolve]:tags:tag'))
    assert.equal(resolveFields.length, 1)
    assert.deepEqual(resolveFields[0].path, ['properties', 'userId'])
    assert(resolveFields[0].resolveNode instanceof Resolve)
  })

  it('prefixes paths for resolves inside a grouped property', () => {
    const resolveFields = getResolveFields(parse('object1:(object2:[resolve]:tags:tag object3:[resolve]:tags:tag)'))
    assert.equal(resolveFields.length, 2)
    assert.deepEqual(resolveFields[0].path, ['object1', 'object2'])
    assert.deepEqual(resolveFields[1].path, ['object1', 'object3'])
  })

  it('ignores non-resolve terms in a group', () => {
    const resolveFields = getResolveFields(parse('object1:(object2:[resolve]:tags:tag property)'))
    assert.equal(resolveFields.length, 1)
    assert.deepEqual(resolveFields[0].path, ['object1', 'object2'])
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

describe('resolve', () => {
  const target = { objects: 'object' }
  const targetArray = { objects: ['object'] }
  const store = { object: { tags: ['tag'], nested: 'nested-object' }, 'nested-object': { tags: ['nested-tag'] } }
  const notFoundStore = { 'not-object': { tags: ['tag'] } }

  it('match a single ID', () => {
    assert(parse('objects:[resolve]:tags:tag').createPredicate(id => store[id])(target))
  })

  it('match an array of IDs', () => {
    assert(parse('objects:[resolve]:tags:tag').createPredicate(id => store[id])(targetArray))
  })

  it('match with recursive resolution', () => {
    assert(parse('objects:[resolve]:nested:[resolve]:tags:nested-tag').createPredicate(id => store[id])(target))
  })

  it("doesn't match when resolved object does not satisfy the predicate", () => {
    assert(!parse('objects:[resolve]:tags:not-found-tag').createPredicate(id => store[id])(target))
  })

  it("doesn't match when resolved object not found", () => {
    assert(!parse('objects:[resolve]:tags:tag').createPredicate(id => notFoundStore[id])(target))
  })

  it("doesn't match recursively when resolved object does not satisfy the predicate", () => {
    assert(!parse('objects:[resolve]:nested:[resolve]:tags:not-found-tag').createPredicate(id => store[id])(target))
  })

  it('throws when no resolver is provided', () => {
    assert.throws(() => parse('objects:[resolve]:tags:tag').createPredicate()(target), {
      message: '[resolve] requires a resolver',
    })
  })

  it('toString round-trips correctly', () => {
    assert.equal(parse('objects:[resolve]:tags:tag').toString(), 'objects:[resolve]:tags:tag')
  })
})

describe('resolve quantifiers', () => {
  const store = {
    'object-1': { tags: ['tag'] },
    'object-2': { tags: ['tag'] },
    'object-3': { tags: ['other'] },
  }
  const resolver = id => store[id]

  const allResolve = { objects: ['object-1', 'object-2'] }
  const someFail = { objects: ['object-1', 'object-3'] }
  const oneUnresolvable = { objects: ['object-1', 'object-2', 'ghost'] }
  const allUnresolvable = { objects: ['ghost-1', 'ghost-2'] }
  const emptyArray = { objects: [] }
  const scalar = { objects: 'object-1' }

  const every = 'objects:[resolve]:[every]:tags:tag'
  const some = 'objects:[resolve]:[some]:tags:tag'

  it('[every] matches when all resolved objects satisfy the predicate', () => {
    assert(parse(every).createPredicate(resolver)(allResolve))
  })

  it("[every] doesn't match when only some resolved objects satisfy the predicate", () => {
    assert(!parse(every).createPredicate(resolver)(someFail))
  })

  it('[every] ignores ids which cannot be resolved', () => {
    assert(parse(every).createPredicate(resolver)(oneUnresolvable))
  })

  it("[every] doesn't match when nothing could be resolved", () => {
    assert(!parse(every).createPredicate(resolver)(allUnresolvable))
  })

  it("[every] doesn't match an empty collection", () => {
    assert(!parse(every).createPredicate(resolver)(emptyArray))
  })

  it('[some] matches when at least one resolved object satisfies the predicate', () => {
    assert(parse(some).createPredicate(resolver)(someFail))
  })

  it("[some] doesn't match when nothing could be resolved", () => {
    assert(!parse(some).createPredicate(resolver)(allUnresolvable))
  })

  it("[some] doesn't match an empty collection", () => {
    assert(!parse(some).createPredicate(resolver)(emptyArray))
  })

  it('both quantifiers agree on a single id', () => {
    assert(parse(every).createPredicate(resolver)(scalar))
    assert(parse(some).createPredicate(resolver)(scalar))
  })

  it('[resolve] without a quantifier behaves as [some]', () => {
    assert(parse('objects:[resolve]:tags:tag').createPredicate(resolver)(someFail))
  })

  it('toString round-trips an explicit quantifier', () => {
    assert.equal(parse(every).toString(), every)
  })

  it('toString does not emit the implicit [some]', () => {
    assert.equal(parse('objects:[resolve]:tags:tag').toString(), 'objects:[resolve]:tags:tag')
  })

  it('getResolveFields walks through a quantifier', () => {
    const [field] = getResolveFields(parse('a:[resolve]:[every]:b:[resolve]:c:d'))
    assert.deepEqual(field.path, ['a'])
    assert.deepEqual(
      getResolveFields(field.resolveNode.child).map(_ => _.path),
      [['b']]
    )
  })
})

describe('resolve depth limit', () => {
  // mirrors MAX_RESOLVE_DEPTH in index.js: update both together
  const maxDepth = 5

  // `a:[resolve]:b:[resolve]:…:tags:tag`
  const nested = depth =>
    Array.from({ length: depth }, (_, i) => `${String.fromCharCode(97 + i)}:[resolve]`).join(':') + ':tags:tag'

  it('parses a filter nested up to the maximum depth', () => {
    assert(parse(nested(maxDepth)) instanceof Property)
  })

  it('throws beyond the maximum depth', () => {
    assert.throws(() => parse(nested(maxDepth + 1)), {
      message: '[resolve] cannot be nested more than 5 levels',
    })
  })

  it('counts nesting, not the number of [resolve]', () => {
    const siblings = Array.from({ length: maxDepth + 1 }, (_, i) => `${String.fromCharCode(97 + i)}:[resolve]:tags:tag`)
    assert.doesNotThrow(() => parse(siblings.join(' ')))
  })

  it('counts nesting through a quantifier', () => {
    assert.throws(
      () => parse('a:[resolve]:[every]:b:[resolve]:[some]:c:[resolve]:d:[resolve]:e:[resolve]:f:[resolve]:tags:tag'),
      { message: '[resolve] cannot be nested more than 5 levels' }
    )
  })

  it('throws if resolve does not follow a property', () => {
    assert.throws(() => parse('[resolve]:tags:tag'), {
      message: '[resolve] must follow a property',
    })
  })

  it('throws if some/every does not follow a resolve', () => {
    assert.throws(() => parse('a:[some]:tags:tag'), {
      message: '[some]/[every] must follow a [resolve]',
    })

    assert.throws(() => parse('a:[every]:tags:tag'), {
      message: '[some]/[every] must follow a [resolve]',
    })
  })
})
