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
    collection = new $MappedCollection2 {
      createMissingRules: true
    }

    # Dispatcher used for tests.
    collection.dispatch -> (@genkey.split '.')[0]

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

  describe '$set', ->

    describe 'with key', ->

      beforeEach ->
        collection.rule watcher: ->
          @val = $set {
            keys: [
              'foo'
              'bar'
            ]
            val: -> @val
          }

      it 'should works with new items', ->
        # Register a watcher.
        collection.set {
          watcher: null
        }

        # The set must be empty.
        set = collection.get 'watcher'
        $expect(set).to.have.members []

        # Register a watched item.
        collection.set {
          foo: 'foo 1'
        }

        # The set must contains the value of foo.
        set = collection.get 'watcher'
        $expect(set).to.have.members [
          collection.get 'foo'
        ]

        # Register another watched item.
        collection.set {
          bar: 'bar'
        }

        # The set must contains the values of foo and bar.
        set = collection.get 'watcher'
        $expect(set).to.have.members [
          collection.get 'foo'
          collection.get 'bar'
        ]

        # Updates foo and deletes bar.
        collection.set {
          foo: 'foo 2'
        }
        collection.remove 'bar'

        # The set must contains the value of foo.
        set = collection.get 'watcher'
        $expect(set).to.have.members [
          collection.get 'foo'
        ]

        # Deletes foo.
        collection.remove 'foo'

        # The set must be empty.
        set = collection.get 'watcher'
        $expect(set).to.have.members []

      it 'should works with previous items', ->
        # Register watched items.
        collection.set {
          foo: 'foo'
          bar: 'bar'
        }

        # Register a watcher.
        collection.set {
          watcher: null
        }

        # The set must be an array containing only the value of foo
        # and bar.
        set = collection.get 'watcher'
        $expect(set).to.have.members [
          collection.get 'foo'
          collection.get 'bar'
        ]

  #-------------------------------------------------------------------

  describe '$sum', ->

    describe 'with key', ->

      beforeEach ->
        collection.rule watcher: ->
          @val = $sum {
            keys: [
              'foo'
              'bar'
            ]
          }

      it 'should works with new items', ->
        # Register a watcher.
        collection.set {
          watcher: null
        }

        # The sum must null.
        sum = collection.get 'watcher'
        $expect(sum).to.equal 0

        # Register a watched item.
        collection.set {
          foo: 1
        }

        # The sum must contains the value of foo.
        sum = collection.get 'watcher'
        $expect(sum).to.equal (collection.get 'foo')

        # Register another watched item.
        collection.set {
          bar: 2
        }

        # The sum must contains the values of foo and bar.
        sum = collection.get 'watcher'
        $expect(sum).to.equal ((collection.get 'foo') + (collection.get 'bar'))

        # Updates foo and deletes bar.
        collection.set {
          foo: 3
        }
        collection.remove 'bar'

        # The sum must contains the value of foo.
        sum = collection.get 'watcher'
        $expect(sum).to.equal (collection.get 'foo')

  #-------------------------------------------------------------------

  describe '$val', ->

    describe 'with key', ->

      def = 'no value'

      beforeEach ->
        collection.rule watcher: ->
          @val = $val {
            keys: [
              'foo'
            ]
            default: def
          }

      it 'should works with new items', ->
        # Register a watcher.
        collection.set {
          watcher: null
        }

        # The value must equals the default value.
        value = collection.get 'watcher'
        $expect(value).to.equal def

        # Register a watched item.
        collection.set {
          foo: 'foo'
        }

        # The value must contains the value of foo.
        value = collection.get 'watcher'
        $expect(value).to.equal (collection.get 'foo')

        # Deletes foo.
        collection.remove 'foo'

        # The value must equals the default value.
        value = collection.get 'watcher'
        $expect(value).to.equal def

# TODO:
# - bind
# - dynamic key
# - handle previously existing items.
