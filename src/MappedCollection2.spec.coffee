{expect: $expect} = require 'chai'

$sinon = require 'sinon'

#---------------------------------------------------------------------

{$MappedCollection2} = require './MappedCollection2.coffee'

#=====================================================================

describe '$MappedCollection2', ->

  # Shared variables.
  collection = null

  beforeEach ->
    collection = new $MappedCollection2()

  #-------------------------------------------------------------------

  describe '#dispatch()', ->

    # Test data.
    beforeEach ->
      collection.rule test: {}

    #------------------------------

    it 'should provides genkey and genval to the dispatch function', ->
      collection.dispatch ->
        $expect(@genkey).to.equal 'a key'
        $expect(@genval).to.equal 'a value'

        'test'

      collection.set {
        'a key': 'a value'
      }

    #------------------------------

    it 'should register a dispatch function', ->
      collection.dispatch -> 'test'

      collection.set [
        'any value'
      ]

      $expect(collection.getRaw('0').rule).to.equal 'test'

    #------------------------------

    it 'should return the dispatch function with no parameter', ->
      dispatcher = -> 'test'
      collection.dispatch dispatcher

      $expect(collection.dispatch()).to.equal dispatcher

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
      collection.dispatch dispatcher

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
