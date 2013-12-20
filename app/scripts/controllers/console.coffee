'use strict'

angular.module('xoWebApp')
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.VM = xoObjects.byUUIDs[$stateParams.uuid]
    )
