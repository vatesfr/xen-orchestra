'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, xoObjects) ->
    $scope.byTypes = xoObjects.byTypes
