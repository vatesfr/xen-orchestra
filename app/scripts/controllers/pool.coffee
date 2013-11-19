'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $location, $routeParams, objects) ->
    $scope.goToSR = (uuid) ->
      $location.path "/srs/#{uuid}"

    $scope.goToHost = (uuid) ->
      $location.path "/hosts/#{uuid}"

    $scope.pool = objects.byUUIDs[$routeParams.uuid]
