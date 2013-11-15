'use strict'

describe 'Controller: SrCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  SrCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    SrCtrl = $controller 'SrCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
