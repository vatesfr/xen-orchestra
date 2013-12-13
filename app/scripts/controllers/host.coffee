'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, xoObjects) ->
    {byUUIDs} = xoObjects
    UUID = $stateParams.uuid

    $scope.$watch(
      -> byUUIDs[UUID]
      -> $scope.host = byUUIDs[UUID]
    )
