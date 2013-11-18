'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $location, $routeParams, objects) ->
    $scope.goToVM = (uuid) ->
      $location.path "/vms/#{uuid}"

    $scope.host = objects.byUUIDs[$routeParams.uuid]
