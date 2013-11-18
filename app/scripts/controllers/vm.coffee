'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $routeParams, objects) ->
    $scope.VM = objects.byUUIDs[$routeParams.uuid]
