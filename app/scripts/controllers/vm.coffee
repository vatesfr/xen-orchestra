'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $stateParams, objects) ->
    $scope.VM = objects.byUUIDs[$stateParams.uuid]
    $scope.list_of_string = $scope.VM.tags
    $scope.select2Options =
      'multiple': true
      'simple_tags': true
      'tags': []
