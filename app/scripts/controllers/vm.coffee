'use strict'

angular.module('xoWebApp')
  .controller 'VmCtrl', ($scope, $routeParams, objects) ->
    $scope.VM = objects.byUUIDs[$routeParams.uuid]
    $scope.list_of_string = $scope.VM.tags
    $scope.select2Options =
      'multiple': true
      'simple_tags': true
      'tags': []

