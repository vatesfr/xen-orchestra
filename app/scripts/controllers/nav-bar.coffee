'use strict'

angular.module('xoWebApp')
  .controller 'NavBarCtrl', ($scope, $location, session) ->
    $scope.login = {
      email: 'admin@admin.net'
      password: 'admin'
    }

    $scope.ensureListView = ->
      $location.path '/list'

    $scope.session = session
