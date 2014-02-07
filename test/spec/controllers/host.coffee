'use strict'

describe 'Controller: HostCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  HostCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    HostCtrl = $controller 'HostCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
