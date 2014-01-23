'use strict'

angular.module('xoWebApp')
  .controller 'SrCtrl', ($scope, $stateParams, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.SR = xoObjects.get $stateParams.uuid
    )
