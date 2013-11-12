'use strict'

describe 'Controller: NavBarCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  NavBarCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    NavBarCtrl = $controller 'NavBarCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
