/* eslint-env mocha */

import Collection, {DuplicateItem, NoSuchItem} from './collection'

import eventToPromise from 'event-to-promise'
import forEach from 'lodash.foreach'
import sinon from 'sinon'

import chai, {expect} from 'chai'
import dirtyChai from 'dirty-chai'
chai.use(dirtyChai)

import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

function waitTicks (n = 1) {
  const {nextTick} = process

  return new Promise(function (resolve) {
    (function waitNextTick () {
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
  beforeEach(function () {
    this.col = new Collection()
    this.col.add('bar', 0)

    return waitTicks()
  })

  it('is iterable', function () {
    const iterator = this.col[Symbol.iterator]()

    expect(iterator.next()).to.eql({done: false, value: 0})
    expect(iterator.next()).to.eql({done: true, value: undefined})
  })

  describe('#add()', function () {
    it('adds item to the collection', function () {
      const spy = sinon.spy()
      this.col.on('add', spy)

      this.col.add('foo', true)

      expect(this.col.get('foo')).to.be.true()

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async event.
      return eventToPromise(this.col, 'add').then(function (added) {
        expect(added).to.have.all.keys('foo')
        expect(added.foo).to.be.true()
      })
    })

    it('throws an exception if the item already exists', function () {
      expect(() => this.col.add('bar', true)).to.throw(DuplicateItem)
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      this.col.add(foo)

      expect(this.col.get(foo.id)).to.equal(foo)
    })
  })

  describe('#update()', function () {
    it('updates an item of the collection', function () {
      const spy = sinon.spy()
      this.col.on('update', spy)

      this.col.update('bar', 1)
      expect(this.col.get('bar')).to.equal(1) // Will be forgotten by de-duplication
      this.col.update('bar', 2)
      expect(this.col.get('bar')).to.equal(2)

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async event.
      return eventToPromise(this.col, 'update').then(function (updated) {
        expect(updated).to.have.all.keys('bar')
        expect(updated.bar).to.equal(2)
      })
    })

    it('throws an exception if the item does not exist', function () {
      expect(() => this.col.update('baz', true)).to.throw(NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }

      this.col.update(bar)

      expect(this.col.get(bar.id)).to.equal(bar)
    })
  })

  describe('#remove()', function () {
    it('removes an item of the collection', function () {
      const spy = sinon.spy()
      this.col.on('remove', spy)

      this.col.update('bar', 1)
      expect(this.col.get('bar')).to.equal(1) // Will be forgotten by de-duplication
      this.col.remove('bar')

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async event.
      return eventToPromise(this.col, 'remove').then(function (removed) {
        expect(removed).to.have.all.keys('bar')
        expect(removed.bar).to.not.exist()
      })
    })

    it('throws an exception if the item does not exist', function () {
      expect(() => this.col.remove('baz', true)).to.throw(NoSuchItem)
    })

    it('accepts an object with an id property', function () {
      const bar = { id: 'bar' }

      this.col.remove(bar)

      expect(this.col.has(bar.id)).to.be.false()
    })
  })

  describe('#set()', function () {
    it('adds item if collection has not key', function () {
      const spy = sinon.spy()
      this.col.on('add', spy)

      this.col.set('foo', true)

      expect(this.col.get('foo')).to.be.true()

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async events.
      return eventToPromise(this.col, 'add').then(function (added) {
        expect(added).to.have.all.keys('foo')
        expect(added.foo).to.be.true()
      })
    })

    it('updates item if collection has key', function () {
      const spy = sinon.spy()
      this.col.on('udpate', spy)

      this.col.set('bar', 1)

      expect(this.col.get('bar')).to.equal(1)

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async events.
      return eventToPromise(this.col, 'update').then(function (updated) {
        expect(updated).to.have.all.keys('bar')
        expect(updated.bar).to.equal(1)
      })
    })

    it('accepts an object with an id property', function () {
      const foo = { id: 'foo' }

      this.col.set(foo)

      expect(this.col.get(foo.id)).to.equal(foo)
    })
  })

  describe('touch()', function () {
    it('can be used to signal an indirect update', function () {
      const foo = { id: 'foo' }
      this.col.add(foo)

      return waitTicks().then(() => {
        this.col.touch(foo)

        return eventToPromise(this.col, 'update', (items) => {
          expect(items).to.have.all.keys('foo')
          expect(items.foo).to.equal(foo)
        })
      })
    })
  })

  describe('clear()', function () {
    it('removes all items from the collection', function () {
      this.col.clear()

      expect(this.col.size).to.equal(0)

      return eventToPromise(this.col, 'remove').then((items) => {
        expect(items).to.have.all.keys('bar')
        expect(items.bar).to.not.exist()
      })
    })
  })

  describe('deduplicates events', function () {
    forEach({
      'add & update → add': [
        [
          ['add', 'foo', 0],
          ['update', 'foo', 1]
        ],
        {
          add: {
            foo: 1
          }
        }
      ],

      'add & remove → ∅': [
        [
          ['add', 'foo', 0],
          ['remove', 'foo']
        ],
        {}
      ],

      'update & update → update': [
        [
          ['update', 'bar', 1],
          ['update', 'bar', 2]
        ],
        {
          update: {
            bar: 2
          }
        }
      ],

      'update & remove → remove': [
        [
          ['update', 'bar', 1],
          ['remove', 'bar']
        ],
        {
          remove: {
            bar: undefined
          }
        }
      ],

      'remove & add → update': [
        [
          ['remove', 'bar'],
          ['add', 'bar', 0]
        ],
        {
          update: {
            bar: 0
          }
        }
      ]
    }, ([operations, results], label) => {
      it(label, function () {
        const {col} = this

        forEach(operations, ([method, ...args]) => {
          col[method](...args)
        })

        const spies = Object.create(null)
        forEach(['add', 'update', 'remove'], event => {
          col.on(event, (spies[event] = sinon.spy()))
        })

        return waitTicks(2).then(() => {
          forEach(spies, (spy, event) => {
            const items = results[event]
            if (items) {
              sinon.assert.calledOnce(spy)
              expect(spy.args[0][0]).to.eql(items)
            } else {
              sinon.assert.notCalled(spy)
            }
          })
        })
      })
    })
  })
})
