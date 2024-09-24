import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import forEach from 'lodash/forEach.js'
import fromEvent from 'promise-toolbox/fromEvent'

import { Collection, DuplicateItem, NoSuchItem } from 'xo-collection'

// ===================================================================

function waitTicks(n = 2) {
  const { nextTick } = process

  return new Promise(function (resolve) {
    ;(function waitNextTick() {
      // The first tick is handled by Promise#then()
      if (--n) {
        nextTick(waitNextTick)
      } else {
        resolve()
      }
    })()
  })
}

describe('Collection', function () {
  let col
  beforeEach(function () {
    col = new Collection()
    col.add('bar', 0)

    return waitTicks()
  })

  it('is iterable', function () {
    const iterator = col[Symbol.iterator]()

    assert.deepEqual(iterator.next(), { done: false, value: ['bar', 0] })
    assert.deepEqual(iterator.next(), { done: true, value: undefined })
  })

  describe('#keys()', function () {
    it('returns an iterator over the keys', function () {
      const iterator = col.keys()

      assert.deepEqual(iterator.next(), { done: false, value: 'bar' })
      assert.deepEqual(iterator.next(), { done: true, value: undefined })
    })
  })

  describe('#values()', function () {
    it('returns an iterator over the values', function () {
      const iterator = col.values()

      assert.deepEqual(iterator.next(), { done: false, value: 0 })
      assert.deepEqual(iterator.next(), { done: true, value: undefined })
    })
  })

  describe('#add()', function () {
    it('adds item to the collection', function () {
      let called = false
      col.on('add', function () {
        called = true
      })

      col.add('foo', true)
      assert.equal(col.get('foo'), true)

      // No sync events.
      assert.equal(called, false)

      // Async event.
      return fromEvent(col, 'add').then(function (added) {
        assert.deepEqual(Object.keys(added), ['foo'])
        assert.equal(added.foo, true)
      })
    })

    it('throws an exception if the item already exists', function () {
      assert.throws(() => col.add('bar', true), DuplicateItem)
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      col.add(foo)

      assert.equal(col.get(foo.id), foo)
    })
  })

  describe('#update()', function () {
    it('updates an item of the collection', function () {
      let called = false
      col.on('update', function () {
        called = true
      })

      col.update('bar', 1)
      assert.equal(col.get('bar'), 1) // Will be forgotten by de-duplication
      col.update('bar', 2)
      assert.equal(col.get('bar'), 2)

      // No sync events.
      assert.equal(called, false)

      // Async event.
      return fromEvent(col, 'update').then(function (updated) {
        assert.deepEqual(Object.keys(updated), ['bar'])
        assert.equal(updated.bar, 2)
      })
    })

    it('throws an exception if the item does not exist', function () {
      assert.throws(() => col.update('baz', true), NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }

      col.update(bar)

      assert.equal(col.get(bar.id), bar)
    })
  })

  describe('#remove()', function () {
    it('removes an item of the collection', function () {
      let called = false
      col.on('remove', function () {
        called = true
      })

      col.update('bar', 1)
      assert.equal(col.get('bar'), 1) // Will be forgotten by de-duplication
      col.remove('bar')

      // No sync events.
      assert.equal(called, false)

      // Async event.
      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepEqual(Object.keys(removed), ['bar'])
        assert.equal(removed.bar, undefined)
      })
    })

    it('throws an exception if the item does not exist', function () {
      assert.throws(() => col.remove('baz', true), NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }
      col.remove(bar)
      assert.equal(col.has(bar.id), false)
    })
  })

  describe('#set()', function () {
    it('adds item if collection has no key', function () {
      let called = false
      col.on('add', function () {
        called = true
      })

      col.set('foo', true)
      assert.equal(col.get('foo'), true)

      // No sync events.
      assert.equal(called, false)

      // Async events.
      return fromEvent(col, 'add').then(function (added) {
        assert.deepEqual(Object.keys(added), ['foo'])
        assert.equal(added.foo, true)
      })
    })

    it('updates item if collection has key', function () {
      let called = false
      col.on('update', function () {
        called = true
      })

      col.set('bar', 1)
      assert.equal(col.get('bar'), 1)

      // No sync events.
      assert.equal(called, false)

      // Async events.
      return fromEvent(col, 'update').then(function (updated) {
        assert.deepEqual(Object.keys(updated), ['bar'])
        assert.equal(updated.bar, 1)
      })
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      col.set(foo)

      assert.equal(col.get(foo.id), foo)
    })
  })

  describe('#unset()', function () {
    it('removes an existing item', function () {
      col.unset('bar')
      assert.equal(col.has('bar'), false)

      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepEqual(Object.keys(removed), ['bar'])
        assert.equal(removed.bar, undefined)
      })
    })

    it('does not throw if the item does not exist', function () {
      col.unset('foo')
    })

    it('accepts an object with an id property', function () {
      col.unset({ id: 'bar' })
      assert.equal(col.has('bar'), false)

      return fromEvent(col, 'remove').then(function (removed) {
        assert.deepEqual(Object.keys(removed), ['bar'])
        assert.equal(removed.bar, undefined)
      })
    })
  })

  describe('#touch()', function () {
    it('can be used to signal an indirect update', function () {
      const foo = { id: 'foo' }
      col.add(foo)

      return waitTicks().then(function () {
        col.touch(foo)

        return fromEvent(col, 'update', items => {
          assert.deepEqual(Object.keys(items), ['foo'])
          assert.equal(items.foo, foo)
        })
      })
    })
  })

  describe('#clear()', function () {
    it('removes all items from the collection', function () {
      col.clear()

      assert.equal(col.size, 0)

      return fromEvent(col, 'remove').then(items => {
        assert.deepEqual(Object.keys(items), ['bar'])
        assert.equal(items.bar, undefined)
      })
    })
  })

  describe('deduplicates events', function () {
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
        it(label, function () {
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

          return waitTicks().then(function () {
            // console.log("Captured events:", spies);
            forEach(spies, (spy, event) => {
              const items = [results[event]]
                .map(r => Object.assign(Object.create(null), r))
                .filter(r => Object.keys(r).length > 0)

              if (items) {
                assert.deepEqual(spy.calls, items, `${event} should have been called with the correct arguments`)
              } else {
                assert.equal(spy.calls.length, 0, `${event} should not have been called`)
              }
            })
          })
        })
      }
    )
  })
})
