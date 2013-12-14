'use strict'

angular.module('xoWebApp')
  .controller 'SrCtrl', ($scope, $stateParams, xoObjects) ->
    {byUUIDs} = xoObjects
    UUID = $stateParams.uuid

    $scope.$watch(
      -> byUUIDs[UUID]
      -> $scope.SR = byUUIDs[UUID]
    )
