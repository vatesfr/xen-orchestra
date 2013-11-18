'use strict'

angular.module('xoWebApp')
  .controller 'SrCtrl', ($scope, $location, $routeParams, objects) ->

    $scope.goToHost = (uuid) ->
      $location.path "/hosts/#{uuid}"

    $scope.SR = objects.byUUIDs[$routeParams.uuid]

    # uuid: '5e0e5191-2ab8-41a0-9699-d3ca26d990ae'
    # name_label: 'DataCore'
    # name_description: 'Data iSCSI SAN'
    # content_type: 'lvmoiscsi'
    # shared: 'true'
    # tags: ['iSCSI', 'SAN', 'HA']
    # vdi: ['5e0e5191-ffff-41a0-ff99-d3ca26d990af','ff0e5191-cccc-41a0-ff99-d3ca26d990af']
    # size: 100 # in bytes
    # virtual_allocation: 60 # in bytes
    # physical_utilisation: 20 # in bytes
