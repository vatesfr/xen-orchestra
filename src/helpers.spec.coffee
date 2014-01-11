{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection2} = require './MappedCollection2.coffee'

$nonBindedHelpers = require './helpers'

#=====================================================================

describe 'Helper', ->

  # Shared variables.
  collection = $set = $sum = $val = null
  beforeEach ->
    # Creates the collection.
    collection = new $MappedCollection2()

    # Dispatcher used for tests.
    collection.dispatch = -> (@genkey.split '.')[0]

    # Missing rules should be automatically created.
    collection.missingRule = collection.rule

    # # Monkey patch the collection to see all emitted events.
    # emit = collection.emit
    # collection.emit = (args...) ->
    #   console.log args...
    #   emit.call collection, args...

    # Binds helpers to this collections.
    {$set, $sum, $val} = do ->
      helpers = {}
      helpers[name] = fn.bind collection for name, fn of $nonBindedHelpers
      helpers

  #-------------------------------------------------------------------

  # All helpers share the same logical code, we need only to test one
  # extensively and test the others basically.
  #
  # $sum was chosen because it is the simplest helper to test.
  describe '$sum', ->

    it 'with single key', ->
      collection.set foo: 1

      collection.item sum: ->
        @val = $sum {
          key: 'foo'
        }

      $expect(collection.get 'sum').to.equal 1

      collection.set foo:2

      $expect(collection.get 'sum').to.equal 2

      collection.remove 'foo'

      $expect(collection.get 'sum').to.equal 0

    it 'with multiple keys', ->
      collection.set {
        foo: 1
        bar: 2
      }

      collection.item sum: ->
        @val = $sum {
          keys: ['foo', 'bar']
        }

      $expect(collection.get 'sum').to.equal 3

      collection.set bar:3

      $expect(collection.get 'sum').to.equal 4

      collection.remove 'foo'

      $expect(collection.get 'sum').to.equal 3

    it 'with dynamic keys', ->
      collection.set {
        foo: 1
        bar: 2
      }

      collection.rule sum: ->
        @val = $sum {
          key: -> (@key.split '.')[1]
        }
      collection.set {
        'sum.foo': null
        'sum.bar': null
      }

      $expect(collecter.get 'sum.foo').to.equal 1
      $expect(collecter.get 'sum.bar').to.equal 2

      collection.remove 'bar'

      $expect(collecter.get 'sum.foo').to.equal 1
      $expect(collecter.get 'sum.bar').to.equal 0

    it 'with single rule', ->
      collection.set {
        'foo.1': 1
        'foo.2': 2
      }

      collection.item sum: ->
        @val = $sum {
          rule: 'foo'
        }

      $expect(collection.get 'sum').to.equal 3

      collection.set 'foo.2':3

      $expect(collection.get 'sum').to.equal 4

      collection.remove 'foo.1'

      $expect(collection.get 'sum').to.equal 3

    it 'with multiple rules', ->
      collection.set {
        'foo': 1
        'bar.1': 2
        'bar.2': 3
      }

      collection.item sum: ->
        @val = $sum {
          rules: ['foo', 'bar']
        }

      $expect(collection.get 'sum').to.equal 6

      collection.set 'bar.1':3

      $expect(collection.get 'sum').to.equal 7

      collection.remove 'bar.2'

      $expect(collection.get 'sum').to.equal 4

    it 'with bind', ->
      collection.set {
        'foo': {
          sum: 2 # This item will participate to `sum.2`.
          val: 1
        }
        'bar': {
          sum: 1 # This item will participate to `sum.1`.
          val: 2
        }
      }

      collection.rule sum: ->
        @val = $sum {
          bind: ->
            id = @val.sum
            return unless id?
            "sum.#{id}"
          val: -> @val.val
        }
      collection.set {
        'sum.1': null
        'sum.2': null
      }

      $expect(collection.get 'sum.1').equal 2
      $expect(collection.get 'sum.2').equal 1

    it 'with predicate', ->
      collection.set {
        foo: 1
        bar: 2
        baz: 3
      }

      collection.item sum: ->
        @val = $sum {
          if: -> /^b/.test @rule
        }

      $expect(collection.get 'sum').equal 5

      collection.set foo:4

      $expect(collection.get 'sum').equal 5

      collection.set bar:5

      $expect(collection.get 'sum').equal 8

      collection.remove 'baz'

      $expect(collection.get 'sum').equal 5

    it 'with initial value', ->
      collection.set foo: 1

      collection.item sum: ->
        @val = $sum {
          key: 'foo'
          init: 2
        }

      $expect(collection.get 'sum').to.equal 3

      collection.set foo:2

      $expect(collection.get 'sum').to.equal 4

      collection.remove 'foo'

      $expect(collection.get 'sum').to.equal 2

# TODO:
# - dynamic keys
# - dynamic rules
