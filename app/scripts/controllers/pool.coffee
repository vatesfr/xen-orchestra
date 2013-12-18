'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $stateParams, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.pool = xoObjects.byUUIDs[$stateParams.uuid]
    )
