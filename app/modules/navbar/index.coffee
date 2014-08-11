require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.navbar', []
  .controller 'NavbarCtrl', ($scope, $state, xoApi) ->
    # TODO: It would make sense to inject xoApi in the scope.
    $scope.$watch(
      -> xoApi.status
      (status) ->
        $scope.status = status
    )
    $scope.$watch(
      -> xoApi.user
      (user) ->
        $scope.user = user
    )
    $scope.logIn = xoApi.logIn
    $scope.logOut = ->
      xoApi.logOut()
      $state.go 'login'

    # When a searched is entered, we must switch to the list view if
    # necessary.
    $scope.ensureListView = ->
      $state.go 'list'
  .directive 'navbar', ->
    return {
      restrict: 'E'
      controller: 'NavbarCtrl'
      template: require './view'
      replace: true
    }
