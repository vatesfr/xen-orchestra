'use strict'

angular.module('xoWebApp')
  .controller 'LoginCtrl', ($scope, $state, $rootScope, xoApi) ->
    toState = $rootScope._login?.state.name ? 'home'
    toStateParams = $rootScope._login?.stateParams
    delete $rootScope._login

    $scope.$watch(
      -> xoApi.user
      (user) ->
        $state.go toState, toStateParams if user
    )

    Object.defineProperties $scope,
      user: get: -> xoApi.get
      status: get: -> xoApi.status
    $scope.logIn = xoApi.logIn
