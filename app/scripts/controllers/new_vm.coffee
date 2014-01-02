'use strict'

angular.module('xoWebApp')
  .controller 'NewVmCtrl', ($scope, $stateParams, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.container = xoObjects.byUUIDs[$stateParams.container]
    )
    $scope.selected_template = null
