'use strict'

angular.module('xoWebApp')
  .controller 'LoginCtrl', ($scope, $state, xoApi) ->
    Object.defineProperties $scope,
      user: get: -> xoApi.get
      status: get: -> xoApi.status
    $scope.logIn = (email, password) ->
      xoApi.logIn email, password
        .then -> $state.go 'home'
