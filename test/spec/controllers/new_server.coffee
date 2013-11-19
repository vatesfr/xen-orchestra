'use strict'

describe 'Controller: NewServerCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  NewServerCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    NewServerCtrl = $controller 'NewServerCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
