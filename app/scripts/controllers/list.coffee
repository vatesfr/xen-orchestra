'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, xo) ->
    $scope.byTypes = xo.byTypes
