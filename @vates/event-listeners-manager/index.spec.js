'use strict'

const t = require('tap')
const { EventEmitter } = require('events')

const { EventListenersManager } = require('./')

const noop = Function.prototype

// function spy (impl = Function.prototype) {
//   function spy() {
//     spy.calls.push([Array.from(arguments), this])
//   }
//   spy.calls = []
//   return spy
// }

function assertListeners(t, event, listeners) {
  t.strictSame(t.context.ee.listeners(event), listeners)
}

t.beforeEach(function (t) {
  t.context.ee = new EventEmitter()
  t.context.em = new EventListenersManager(t.context.ee)
})

t.test('.add adds a listener', function (t) {
  t.context.em.add('foo', noop)

  assertListeners(t, 'foo', [noop])

  t.end()
})

t.test('.add does not add a duplicate listener', function (t) {
  t.context.em.add('foo', noop).add('foo', noop)

  assertListeners(t, 'foo', [noop])

  t.end()
})

t.test('.remove removes a listener', function (t) {
  t.context.em.add('foo', noop).remove('foo', noop)

  assertListeners(t, 'foo', [])

  t.end()
})

t.test('.removeAll removes all listeners of a given type', function (t) {
  t.context.em.add('foo', noop).add('bar', noop).removeAll('foo')

  assertListeners(t, 'foo', [])
  assertListeners(t, 'bar', [noop])

  t.end()
})

t.test('.removeAll removes all listeners', function (t) {
  t.context.em.add('foo', noop).add('bar', noop).removeAll()

  assertListeners(t, 'foo', [])
  assertListeners(t, 'bar', [])

  t.end()
})
