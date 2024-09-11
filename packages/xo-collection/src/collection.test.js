import fromEvent from 'promise-toolbox/fromEvent'
import forEach from 'lodash/forEach.js'

import assert from 'assert'
import { test, describe, beforeEach } from 'node:test'

import { Collection, DuplicateItem, NoSuchItem } from './collection'

// ===================================================================

function waitTicks(n = 2) {
  const { nextTick } = process

  return new Promise(function (resolve) {
    ;(function waitNextTick() {
      if (--n) {
        nextTick(waitNextTick)
      } else {
        resolve()
      }
    })()
  })
}

describe('Collection', () => {
  let col
  beforeEach(() => {
    col = new Collection()
    col.add('bar', 0)

    return waitTicks()
  })

  test('is iterable', () => {
    const iterator = col[Symbol.iterator]()

    assert.deepStrictEqual(iterator.next(), { done: false, value: ['bar', 0] })
    assert.deepStrictEqual(iterator.next(), { done: true, value: undefined })
  })

  describe('#keys()', () => {
    test('returns an iterator over the keys', () => {
      const iterator = col.keys()

      assert.deepStrictEqual(iterator.next(), { done: false, value: 'bar' })
      assert.deepStrictEqual(iterator.next(), { done: true, value: undefined })
    })
  })

  describe('#values()', () => {
    test('returns an iterator over the values', () => {
      const iterator = col.values()

      assert.deepStrictEqual(iterator.next(), { done: false, value: 0 })
      assert.deepStrictEqual(iterator.next(), { done: true, value: undefined })
    })
  })

  describe('#add()', () => {
    test('adds item to the collection', async () => {
      let called = false
      col.on('add', () => {
        called = true
      })

      col.add('foo', true)
      assert.strictEqual(col.get('foo'), true)

      // No sync events.
      assert.strictEqual(called, false)

      // Async event.
      return fromEvent(col, 'add').then(function (added) {
        assert.deepStrictEqual(Object.keys(added), ['foo'])
        assert.strictEqual(added.foo, true)
      })
    })

    test('throws an exception if the item already exists', () => {
      assert.throws(() => col.add('bar', true), DuplicateItem)
    })

    test('accepts an object with an id property', () => {
      const foo = { id: 'foo' }

      col.add(foo)

      assert.strictEqual(col.get(foo.id), foo)
    })
  })

  describe('#update()', () => {
    test('updates an item of the collection', async () => {
      let called = false
      col.on('update', () => {
        called = true
      })

      col.update('bar', 1)
      assert.strictEqual(col.get('bar'), 1)
      col.update('bar', 2)
      assert.strictEqual(col.get('bar'), 2)

      // No sync events.
      assert.strictEqual(called, false)

      // Async event.
      return fromEvent(col, 'update').then(function (updated) {
        assert.deepStrictEqual(Object.keys(updated), ['bar'])
        assert.strictEqual(updated.bar, 2)
      })
    })

    test('throws an exception if the item does not exist', () => {
      assert.throws(() => col.update('baz', true), NoSuchItem)
    })

    test('accepts an object with an id property', () => {
      const bar = { id: 'bar' }

      col.update(bar)

      assert.strictEqual(col.get(bar.id), bar)
    })
  })

  describe('#remove()', () => {
    test('removes an item of the collection', async () => {
      let called = false
      col.on('remove', () => {
        called = true
      })

      col.update('bar', 1)
      assert.strictEqual(col.get('bar'), 1) // Will be forgotten by de-duplication
      col.remove('bar')

      // No sync events.
      assert.strictEqual(called, false)

      // Async event.
      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepStrictEqual(Object.keys(removed), ['bar'])
        assert.strictEqual(removed.bar, undefined)
      })
    })

    test('throws an exception if the item does not exist', () => {
      assert.throws(() => col.remove('baz', true), NoSuchItem)
    })

    test('accepts an object with an id property', () => {
      const bar = { id: 'bar' }
      col.remove(bar)
      assert.strictEqual(col.has(bar.id), false)
    })
  })

  describe('#set()', () => {
    test('adds item if collection has no key', async () => {
      let called = false
      col.on('add', () => {
        called = true
      })

      col.set('foo', true)
      assert.strictEqual(col.get('foo'), true)

      // No sync events.
      assert.strictEqual(called, false)

      // Async events.
      return fromEvent(col, 'add').then(function (added) {
        assert.deepStrictEqual(Object.keys(added), ['foo'])
        assert.strictEqual(added.foo, true)
      })
    })

    test('updates item if collection has key', async () => {
      let called = false
      col.on('update', () => {
        called = true
      })

      col.set('bar', 1)
      assert.strictEqual(col.get('bar'), 1)

      // No sync events.
      assert.strictEqual(called, false)

      // Async events.
      return fromEvent(col, 'update').then(function (updated) {
        assert.deepStrictEqual(Object.keys(updated), ['bar'])
        assert.strictEqual(updated.bar, 1)
      })
    })

    test('accepts an object with an id property', () => {
      const foo = { id: 'foo' }

      col.set(foo)

      assert.strictEqual(col.get(foo.id), foo)
    })
  })

  describe('#unset()', () => {
    test('removes an existing item', async () => {
      col.unset('bar')
      assert.strictEqual(col.has('bar'), false)

      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepStrictEqual(Object.keys(removed), ['bar'])
        assert.strictEqual(removed.bar, undefined)
      })
    })

    test('does not throw if the item does not exist', () => {
      col.unset('foo')
    })

    test('accepts an object with an id property', async () => {
      col.unset({ id: 'bar' })
      assert.strictEqual(col.has('bar'), false)

      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepStrictEqual(Object.keys(removed), ['bar'])
        assert.strictEqual(removed.bar, undefined)
      })
    })
  })

  describe('#touch()', () => {
    test('can be used to signal an indirect update', async () => {
      const foo = { id: 'foo' }
      col.add(foo)

      return waitTicks().then(() => {
        col.touch(foo)

        return fromEvent(col, 'update', items => {
          assert.deepStrictEqual(Object.keys(items), ['foo'])
          assert.strictEqual(items.foo, foo)
        })
      })
    })
  })

  describe('#clear()', () => {
    test('removes all items from the collection', async () => {
      col.clear()

      assert.strictEqual(col.size, 0)

      return fromEvent(col, 'remove').then(items => {
        assert.deepStrictEqual(Object.keys(items), ['bar'])
        assert.strictEqual(items.bar, undefined)
      })
    })
  })

  describe('deduplicates events', () => {
    forEach(
      {
        'add & update → add': [
          [
            ['add', 'foo', 0],
            ['update', 'foo', 1],
          ],
          {
            add: {
              foo: 1,
            },
          },
        ],

        'add & remove → ∅': [
          [
            ['add', 'foo', 0],
            ['remove', 'foo'],
          ],
          {},
        ],

        'update & update → update': [
          [
            ['update', 'bar', 1],
            ['update', 'bar', 2],
          ],
          {
            update: {
              bar: 2,
            },
          },
        ],

        'update & remove → remove': [
          [
            ['update', 'bar', 1],
            ['remove', 'bar'],
          ],
          {
            remove: {
              bar: undefined,
            },
          },
        ],

        'remove & add → update': [
          [
            ['remove', 'bar'],
            ['add', 'bar', 0],
          ],
          {
            update: {
              bar: 0,
            },
          },
        ],
      },
      ([operations, results], label) => {
        test(label, function () {
          forEach(operations, ([method, ...args]) => {
            col[method](...args)
          })

          const spies = Object.create(null)
          forEach(['add', 'update', 'remove'], event => {
            spies[event] = {
              calls: [],
              fn: function (...args) {
                this.calls.push(...args)
              },
            }
            col.on(event, spies[event].fn.bind(spies[event]))
          })

          return waitTicks().then(() => {
            // console.log("Captured events:", spies);
            forEach(spies, (spy, event) => {
              const items = [results[event]]
                .map(r => Object.assign(Object.create(null), r))
                .filter(r => Object.keys(r).length > 0)

              if (items) {
                assert.deepStrictEqual(spy.calls, items, `${event} should have been called with the correct arguments`)
              } else {
                assert.strictEqual(spy.calls.length, 0, `${event} should not have been called`)
              }
            })
          })
        })
      }
    )
  })
})
