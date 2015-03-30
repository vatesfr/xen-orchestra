{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection} = require './MappedCollection'

#=====================================================================

describe '$MappedCollection', ->

  # Shared variables.
  collection = null

  beforeEach ->
    collection = new $MappedCollection()

  #-------------------------------------------------------------------

  describe '#dispatch()', ->

    # Test data.
    beforeEach ->
      collection.rule test: {}

    #------------------------------

    it 'should have genkey and genval', ->
      collection.dispatch = ->
        $expect(@genkey).to.equal 'a key'
        $expect(@genval).to.equal 'a value'

        'test'

      collection.set {
        'a key': 'a value'
      }

    #------------------------------

    it 'should be used to dispatch an item', ->
      collection.dispatch = -> 'test'

      collection.set [
        'any value'
      ]

      $expect(collection.getRaw('0').rule).to.equal 'test'

  #-------------------------------------------------------------------

  describe 'item hooks', ->

    # Test data.
    beforeEach ->
      collection.rule test: {}

    #------------------------------

    it 'should be called in the correct order', ->

      beforeDispatch = $sinon.spy()
      collection.hook {beforeDispatch}

      dispatcher = $sinon.spy ->
        $expect(beforeDispatch.called).to.true

        # It still is a dispatcher.
        'test'
      collection.dispatch = dispatcher

      beforeUpdate = $sinon.spy ->
        $expect(dispatcher.called).to.true
      collection.hook {beforeUpdate}

      beforeSave = $sinon.spy ->
        $expect(beforeUpdate.called).to.true
      collection.hook {beforeSave}

      collection.set [
        'any value'
      ]

      $expect(beforeSave.called).to.be.true

  #-------------------------------------------------------------------

  describe 'adding new items', ->

    beforeEach ->
      collection.rule test: {}
      collection.dispatch = -> 'test'

    #------------------------------

    it 'should trigger three `enter` events', ->
      keySpy = $sinon.spy()
      ruleSpy = $sinon.spy()
      anySpy = $sinon.spy()

      collection.on 'key=a key', keySpy
      collection.on 'rule=test', ruleSpy
      collection.on 'any', anySpy

      collection.set {
        'a key': 'a value'
      }

      item = collection.getRaw 'a key'

      # TODO: items can be an array or a object (it is not defined).
      $expect(keySpy.args).to.deep.equal [
        ['enter', item]
      ]
      $expect(ruleSpy.args).to.deep.equal [
        ['enter', [item]]
      ]
      $expect(anySpy.args).to.deep.equal [
        ['enter', {'a key': item}]
      ]
