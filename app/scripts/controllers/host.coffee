'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $location, $routeParams, objects) ->
    $scope.goToVM = (uuid) ->
      $location.path "/vms/#{uuid}"

    $scope.goToSR = (uuid) ->
      $location.path "/srs/#{uuid}"

    $scope.host = objects.byUUIDs[$routeParams.uuid]
