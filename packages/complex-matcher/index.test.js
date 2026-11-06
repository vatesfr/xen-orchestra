'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { ast, pattern } = require('./index.fixtures')
const {
  getPropertyClausesStrings,
  Comparison,
  GlobPattern,
  Null,
  NumberNode,
  NumberOrStringNode,
  parse,
  Property,
  setPropertyClause,
  StringNode,
  UNKNOWN,
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

describe('createResolver', () => {
  const resolve = (pattern, value, knownFields) => parse(pattern).createResolver(knownFields)(value)

  describe('without known fields', () => {
    it('behaves like createPredicate', () => {
      assert.equal(resolve('name_label:foo', { name_label: 'foo' }), true)
      assert.equal(resolve('name_label:foo', { name_label: 'bar' }), false)
      assert.equal(resolve('name_label:foo', {}), false)
      assert.equal(resolve('!name_label:foo', {}), true)
      assert.equal(resolve('foo', { name_label: 'bar' }), false)
    })
  })

  describe('with known fields', () => {
    it('resolves a known and present property', () => {
      assert.equal(resolve('name_label:foo', { name_label: 'foo' }, ['name_label']), true)
      assert.equal(resolve('name_label:foo', { name_label: 'bar' }, ['name_label']), false)
      assert.equal(resolve('!name_label:foo', { name_label: 'bar' }, ['name_label']), true)
    })

    it('resolves a known but absent property as not matching', () => {
      assert.equal(resolve('creation:creator:1', { id: 'vm' }, ['id', 'creation']), false)
      assert.equal(resolve('!creation:creator:1', { id: 'vm' }, ['id', 'creation']), true)
    })

    it('returns UNKNOWN on an unknown property', () => {
      assert.equal(resolve('creation:creator:1', { id: 'vm' }, ['id']), UNKNOWN)
      assert.equal(resolve('!creation:creator:1', { id: 'vm' }, ['id']), UNKNOWN)
    })

    it('treats a present property as known even if not listed', () => {
      assert.equal(resolve('$pool:1', { $pool: '1' }, []), true)
      assert.equal(resolve('$pool:1', { $pool: '2' }, []), false)
    })

    it('treats everything below a known property as known', () => {
      assert.equal(resolve('creation:creator:1', { creation: {} }, ['creation']), false)
      assert.equal(resolve('creation:creator:1', { creation: { creator: '1' } }, ['creation']), true)
      assert.equal(resolve('tags:prod', { tags: ['test'] }, ['tags']), false)
    })

    it('resolves a known truthy property', () => {
      assert.equal(resolve('is_a_template?', { is_a_template: true }, ['is_a_template']), true)
      assert.equal(resolve('is_a_template?', { is_a_template: false }, ['is_a_template']), false)
      assert.equal(resolve('is_a_template?', {}, ['is_a_template']), false)
    })

    it('returns UNKNOWN on an unknown truthy property', () => {
      assert.equal(resolve('is_a_template?', {}, []), UNKNOWN)
    })

    it('resolves a bare term matching a known value', () => {
      assert.equal(resolve('foo', { name_label: 'foo' }, ['name_label']), true)
    })

    it('returns UNKNOWN on a bare term not matching any known value', () => {
      assert.equal(resolve('foo', { name_label: 'bar' }, ['name_label']), UNKNOWN)
    })

    it('resolves an empty pattern', () => {
      assert.equal(resolve('', {}, []), true)
    })
  })

  describe('and', () => {
    const known = { name_label: 'foo' }
    const knownFields = ['name_label']

    it('is false if a term is false', () => {
      assert.equal(resolve('name_label:bar $pool:1', known, knownFields), false)
      assert.equal(resolve('$pool:1 name_label:bar', known, knownFields), false)
    })

    it('returns UNKNOWN if other terms are true', () => {
      assert.equal(resolve('name_label:foo $pool:1', known, knownFields), UNKNOWN)
      assert.equal(resolve('$pool:1 name_label:foo', known, knownFields), UNKNOWN)
    })
  })

  describe('or', () => {
    const known = { name_label: 'foo' }
    const knownFields = ['name_label']

    it('is true if a term is true', () => {
      assert.equal(resolve('|(name_label:foo $pool:1)', known, knownFields), true)
      assert.equal(resolve('|($pool:1 name_label:foo)', known, knownFields), true)
    })

    it('returns UNKNOWN if other terms are false', () => {
      assert.equal(resolve('|(name_label:bar $pool:1)', known, knownFields), UNKNOWN)
      assert.equal(resolve('|($pool:1 name_label:bar)', known, knownFields), UNKNOWN)
    })
  })

  describe('not', () => {
    const known = { name_label: 'foo' }
    const knownFields = ['name_label']

    it('negates a resolved group containing an unknown term', () => {
      assert.equal(resolve('!(name_label:bar $pool:1)', known, knownFields), true)
      assert.equal(resolve('!|(name_label:foo $pool:1)', known, knownFields), false)
    })

    it('returns UNKNOWN on an unresolved group', () => {
      assert.equal(resolve('!(name_label:foo $pool:1)', known, knownFields), UNKNOWN)
    })
  })
})
