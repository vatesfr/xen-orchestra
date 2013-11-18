'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $routeParams, objects) ->
    $scope.pool = objects.byUUIDs[$routeParams.uuid]
