'use strict'

angular.module('xoWebApp')
  .controller 'NewSrCtrl', ($scope, $stateParams, xo) ->
    $scope.$watch(
      -> xo.revision
      ->
        $scope.container = xo.get $stateParams.container
    )

