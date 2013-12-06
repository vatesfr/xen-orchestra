'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope, $stateParams, objects) ->
    $scope.pool = objects.byUUIDs[$stateParams.uuid]
