'use strict'

angular.module('xoWebApp')
  .controller 'SrCtrl', ($scope, $stateParams, xoApi, xoObjects) ->
    $scope.$watch(
      -> xoObjects.revision
      -> $scope.SR = xoObjects.get $stateParams.uuid
    )

    $scope.saveSR = ($data) ->
      {SR} = $scope
      {name_label, name_description} = $data

      $data = {
        id: SR.UUID
      }
      if name_label isnt SR.name_label
        $data.name_label = name_label
      if name_description isnt SR.name_description
        $data.name_description = name_description

      xoApi.call 'sr.set', $data
