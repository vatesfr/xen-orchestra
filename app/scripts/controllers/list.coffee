'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.all = xoObjects.all
    )
