'use strict'

angular.module('xoWebApp')
  .controller 'ListCtrl', ($scope, objects, $stateParams) ->
    $scope.objects = objects.all
    $scope.byUUIDs = objects.byUUIDs
