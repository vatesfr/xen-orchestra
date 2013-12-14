'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $stateParams, xoObjects) ->
    {byUUIDs} = xoObjects
    UUID = $stateParams.uuid

    $scope.$watch(
      -> byUUIDs[UUID]
      -> $scope.VM = byUUIDs[UUID]
    )

    $scope.select2Options =
      'multiple': true
      'simple_tags': true
      'tags': []
