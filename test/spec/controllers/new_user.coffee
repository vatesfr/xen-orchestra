'use strict'

describe 'Controller: NewUserCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  NewUserCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    NewUserCtrl = $controller 'NewUserCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
