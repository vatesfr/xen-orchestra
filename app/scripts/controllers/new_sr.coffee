'use strict'

angular.module('xoWebApp')
  .controller 'NewSrCtrl', ($scope, $stateParams, xoObjects) ->
    {get} = xoObjects
    $scope.$watch(
      -> xoObjects.revision
      ->
        container = $scope.container = get $stateParams.container
    )

