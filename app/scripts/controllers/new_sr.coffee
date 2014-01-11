'use strict'

angular.module('xoWebApp')
  .controller 'NewSrCtrl', ($scope, $stateParams, xoObjects) ->
    {byUUIDs} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        container = $scope.container = byUUIDs[$stateParams.container]
    )

