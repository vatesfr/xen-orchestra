'use strict'

describe 'Controller: ConsoleCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  ConsoleCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    ConsoleCtrl = $controller 'ConsoleCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
