'use strict'

angular.module('xoWebApp')
  .controller 'LoginCtrl', ($scope, $state, xoApi) ->
    $scope.$watch(
      -> xoApi.user
      (user) ->
        console.log user
        $state.go 'home' if user
    )

    Object.defineProperties $scope,
      user: get: -> xoApi.get
      status: get: -> xoApi.status
    $scope.logIn = xoApi.logIn
