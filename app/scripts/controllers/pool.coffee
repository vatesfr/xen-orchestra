'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.pool = xoObjects.get $stateParams.uuid
    )

    $scope.savePool = ($data) ->
      {pool} = $scope
      {name_label, name_description} = $data

      $data = {
        id: pool.UUID
      }
      if name_label isnt pool.name_label
        $data.name_label = name_label
      if name_description isnt pool.name_description
        $data.name_description = name_description

      xoApi.call 'pool.set', $data
