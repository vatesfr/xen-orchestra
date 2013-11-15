'use strict'

angular.module('xoWebApp')
  .controller 'NavBarCtrl', ($scope, $location) ->
    $scope.login = {
      email: 'admin@admin.net'
      password: 'admin'
    }
    $scope.user = null

    $scope.ensureListView = ->
      $location.path '/list'

    $scope.logIn = ->
      $scope.user = {
        email: $scope.login.email
      }

    $scope.logOut = ->
      $scope.user = null
