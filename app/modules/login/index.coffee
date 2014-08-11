require 'angular'
require 'angular-ui-router'

#=====================================================================

module.exports = angular.module 'xoWebApp.login', [
  'ui.router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'login',
      url: '/login'
      controller: 'LoginCtrl'
      template: require './view'
  .controller 'LoginCtrl', ($scope, $state, $rootScope, xoApi) ->
    toState = $rootScope._login?.state.name ? 'home'
    toStateParams = $rootScope._login?.stateParams
    delete $rootScope._login

    $scope.$watch(
      -> xoApi.user
      (user) ->
        # When the user is logged in, go the wanted view, fallbacks on
        # the home view if necessary.
        if user
          $state.go toState, toStateParams
            .catch ->
              $state.go 'home'
    )

    Object.defineProperties $scope,
      user: get: -> xoApi.get
      status: get: -> xoApi.status
    $scope.logIn = xoApi.logIn
