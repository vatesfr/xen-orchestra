/* eslint-env jest */

import fromEvent from 'promise-toolbox/fromEvent'
import forEach from 'lodash/forEach.js'

import { Collection, DuplicateItem, NoSuchItem } from './collection'

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

    expect(iterator.next()).toEqual({ done: false, value: ['bar', 0] })
    expect(iterator.next()).toEqual({ done: true, value: undefined })
  })

  describe('#keys()', function () {
    it('returns an iterator over the keys', function () {
      const iterator = col.keys()

      expect(iterator.next()).toEqual({ done: false, value: 'bar' })
      expect(iterator.next()).toEqual({ done: true, value: undefined })
    })
  })

  describe('#values()', function () {
    it('returns an iterator over the values', function () {
      const iterator = col.values()

      expect(iterator.next()).toEqual({ done: false, value: 0 })
      expect(iterator.next()).toEqual({ done: true, value: undefined })
    })
  })

  describe('#add()', function () {
    it('adds item to the collection', function () {
      const spy = jest.fn()
      col.on('add', spy)

      col.add('foo', true)

      expect(col.get('foo')).toBe(true)

      // No sync events.
      expect(spy).not.toHaveBeenCalled()

      // Async event.
      return fromEvent(col, 'add').then(function (added) {
        expect(Object.keys(added)).toEqual(['foo'])
        expect(added.foo).toBe(true)
      })
    })

    it('throws an exception if the item already exists', function () {
      expect(() => col.add('bar', true)).toThrowError(DuplicateItem)
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      col.add(foo)

      expect(col.get(foo.id)).toBe(foo)
    })
  })

  describe('#update()', function () {
    it('updates an item of the collection', function () {
      const spy = jest.fn()
      col.on('update', spy)

      col.update('bar', 1)
      expect(col.get('bar')).toBe(1) // Will be forgotten by de-duplication
      col.update('bar', 2)
      expect(col.get('bar')).toBe(2)

      // No sync events.
      expect(spy).not.toHaveBeenCalled()

      // Async event.
      return fromEvent(col, 'update').then(function (updated) {
        expect(Object.keys(updated)).toEqual(['bar'])
        expect(updated.bar).toBe(2)
      })
    })

    it('throws an exception if the item does not exist', function () {
      expect(() => col.update('baz', true)).toThrowError(NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }

      col.update(bar)

      expect(col.get(bar.id)).toBe(bar)
    })
  })

  describe('#remove()', function () {
    it('removes an item of the collection', function () {
      const spy = jest.fn()
      col.on('remove', spy)

      col.update('bar', 1)
      expect(col.get('bar')).toBe(1) // Will be forgotten by de-duplication
      col.remove('bar')

      // No sync events.
      expect(spy).not.toHaveBeenCalled()

      // Async event.
      return fromEvent(col, 'remove').then(function (removed) {
        expect(Object.keys(removed)).toEqual(['bar'])
        expect(removed.bar).toBeUndefined()
      })
    })

    it('throws an exception if the item does not exist', function () {
      expect(() => col.remove('baz', true)).toThrowError(NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }

      col.remove(bar)

      expect(col.has(bar.id)).toBe(false)
    })
  })

  describe('#set()', function () {
    it('adds item if collection has not key', function () {
      const spy = jest.fn()
      col.on('add', spy)

      col.set('foo', true)

      expect(col.get('foo')).toBe(true)

      // No sync events.
      expect(spy).not.toHaveBeenCalled()

      // Async events.
      return fromEvent(col, 'add').then(function (added) {
        expect(Object.keys(added)).toEqual(['foo'])
        expect(added.foo).toBe(true)
      })
    })

    it('updates item if collection has key', function () {
      const spy = jest.fn()
      col.on('udpate', spy)

      col.set('bar', 1)

      expect(col.get('bar')).toBe(1)

      // No sync events.
      expect(spy).not.toHaveBeenCalled()

      // Async events.
      return fromEvent(col, 'update').then(function (updated) {
        expect(Object.keys(updated)).toEqual(['bar'])
        expect(updated.bar).toBe(1)
      })
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      col.set(foo)

      expect(col.get(foo.id)).toBe(foo)
    })
  })

  describe('#unset()', function () {
    it('removes an existing item', function () {
      col.unset('bar')

      expect(col.has('bar')).toBe(false)

      return fromEvent(col, 'remove').then(function (removed) {
        expect(Object.keys(removed)).toEqual(['bar'])
        expect(removed.bar).toBeUndefined()
      })
    })

    it('does not throw if the item does not exists', function () {
      col.unset('foo')
    })

    it('accepts an object with an id property', function () {
      col.unset({ id: 'bar' })

      expect(col.has('bar')).toBe(false)

      return fromEvent(col, 'remove').then(function (removed) {
        expect(Object.keys(removed)).toEqual(['bar'])
        expect(removed.bar).toBeUndefined()
      })
    })
  })

  describe('touch()', function () {
    it('can be used to signal an indirect update', function () {
      const foo = { id: 'foo' }
      col.add(foo)

      return waitTicks().then(() => {
        col.touch(foo)

        return fromEvent(col, 'update', items => {
          expect(Object.keys(items)).toEqual(['foo'])
          expect(items.foo).toBe(foo)
        })
      })
    })
  })

  describe('clear()', function () {
    it('removes all items from the collection', function () {
      col.clear()

      expect(col.size).toBe(0)

      return fromEvent(col, 'remove').then(items => {
        expect(Object.keys(items)).toEqual(['bar'])
        expect(items.bar).toBeUndefined()
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
            col.on(event, (spies[event] = jest.fn()))
          })

          return waitTicks().then(() => {
            forEach(spies, (spy, event) => {
              const items = results[event]
              if (items) {
                expect(spy.mock.calls).toEqual([[items]])
              } else {
                expect(spy).not.toHaveBeenCalled()
              }
            })
          })
        })
      }
    )
  })
})
