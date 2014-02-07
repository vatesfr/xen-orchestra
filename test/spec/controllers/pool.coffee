'use strict'

describe 'Controller: PoolCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  PoolCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    PoolCtrl = $controller 'PoolCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
