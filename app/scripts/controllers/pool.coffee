'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $stateParams, xoObjects) ->
    {byUUIDs} = xoObjects
    UUID = $stateParams.uuid

    $scope.$watch(
      -> byUUIDs[UUID]
      -> $scope.pool = byUUIDs[UUID]
    )
