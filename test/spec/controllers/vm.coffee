'use strict'

describe 'Controller: VmCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  VmCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    VmCtrl = $controller 'VmCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
