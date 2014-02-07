'use strict'

describe 'Controller: NewVmCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  NewVmCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    NewVmCtrl = $controller 'NewVmCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
