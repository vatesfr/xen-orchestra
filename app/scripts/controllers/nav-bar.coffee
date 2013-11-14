'use strict'

angular.module('xoWebApp')
  .controller 'NavBarCtrl', ($scope, $location) ->
    $scope.user = ''

    $scope.ensureListView = ->
      $location.path '/list'
