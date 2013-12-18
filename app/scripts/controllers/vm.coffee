'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $stateParams, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.VM = xoObjects.byUUIDs[$stateParams.uuid]
    )

    $scope.select2Options =
      'multiple': true
      'simple_tags': true
      'tags': []
