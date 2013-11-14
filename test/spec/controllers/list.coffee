'use strict'

describe 'Controller: ListCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  ListCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    ListCtrl = $controller 'ListCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
