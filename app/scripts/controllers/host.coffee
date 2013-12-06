'use strict'

angular.module('xoWebApp')
  .controller 'HostCtrl', ($scope, $stateParams, objects) ->
    $scope.host = objects.byUUIDs[$stateParams.uuid]
