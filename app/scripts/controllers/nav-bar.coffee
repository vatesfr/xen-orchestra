'use strict'

angular.module('xoWebApp')
  .controller 'NavBarCtrl', ($scope, $location, xoApi) ->
    $scope.$watch(
      -> xoApi.user
      (user) ->
        $scope.user = user
    )
    $scope.logIn = xoApi.logIn
    $scope.logOut = xoApi.logOut

    # Pre-fills the login form.
    $scope.login = {
      email: 'admin@admin.net'
      password: 'admin'
    }

    # When a searched is entered, we must switch to the list view if
    # necessary.
    $scope.ensureListView = ->
      $location.path '/list'
