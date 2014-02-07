'use strict'

describe 'Controller: SettingsCtrl', () ->

  # load the controller's module
  beforeEach module 'xoWebApp'

  SettingsCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    SettingsCtrl = $controller 'SettingsCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3
