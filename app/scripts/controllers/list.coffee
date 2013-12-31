'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, xoObjects) ->
    $scope.all = xoObjects.all
