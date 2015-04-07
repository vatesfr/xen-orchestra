/* eslint-env mocha */

import Collection, {DuplicateEntry, NoSuchEntry} from './index'

import eventToPromise from 'event-to-promise'
import sinon from 'sinon'

import chai, {expect} from 'chai'
import dirtyChai from 'dirty-chai'
chai.use(dirtyChai)

describe('Collection', function () {
  beforeEach(function (done) {
    this.col = new Collection()
    this.col.add('bar', 0)

    process.nextTick(done)
  })

  describe('#add()', function () {
    it('adds item to the collection', function () {
      const spy = sinon.spy()
      this.col.on('add', spy)

      this.col.add('foo', true)

      expect(this.col.get('foo')).to.equal(true)

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async event.
      return eventToPromise(this.col, 'add').then(function (added) {
        expect(added).to.have.all.keys('foo')
        expect(added.foo).to.equal(true)
      })
    })

    it('throws an exception if the item already exists', function () {
      expect(() => this.col.add('bar', true)).to.throw(DuplicateEntry)
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
      expect(() => this.col.update('baz', true)).to.throw(NoSuchEntry)
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
        expect(removed.bar).to.equal(null)
      })
    })

    it('throws an exception if the item does not exist', function () {
      expect(() => this.col.remove('baz', true)).to.throw(NoSuchEntry)
    })
  })

  describe('#set()', function () {
    it('adds item if collection has not key', function () {
      const spy = sinon.spy()
      this.col.on('add', spy)

      this.col.set('foo', true)

      expect(this.col.get('foo')).to.equal(true)

      // No sync events.
      sinon.assert.notCalled(spy)

      // Async events.
      return eventToPromise(this.col, 'add').then(function (added) {
        expect(added).to.have.all.keys('foo')
        expect(added.foo).to.equal(true)
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
  })

})
