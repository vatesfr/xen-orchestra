'use strict'

angular.module('xoWebApp')
  .controller 'SrCtrl', ($scope, $stateParams, objects) ->
    $scope.SR = objects.byUUIDs[$stateParams.uuid]
