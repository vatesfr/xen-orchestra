angular = require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.sr', [
  require 'angular-ui-router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'SRs_view',
      url: '/srs/:id'
      controller: 'SrCtrl'
      template: require './view'
  .controller 'SrCtrl', ($scope, $stateParams, xoApi, xo, modal) ->
    $scope.$watch(
      -> xo.revision
      -> $scope.SR = xo.get $stateParams.id
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

    $scope.deleteVDI = (UUID) ->
      console.log "Delete VDI #{UUID}"

      modal.confirm({
        title: 'VDI deletion'
        message: 'Are you sure you want to delete this VDI? This operation is irreversible.'
      }).then ->
        xo.vdi.delete UUID

    $scope.disconnectVBD = (UUID) ->
      console.log "Disconnect VBD #{UUID}"

      xoApi.call 'vbd.disconnect', {id: UUID}

    $scope.connectPBD = (UUID) ->
      console.log "Connect PBD #{UUID}"

      xoApi.call 'pbd.connect', {id: UUID}

    $scope.disconnectPBD = (UUID) ->
      console.log "Disconnect PBD #{UUID}"

      xoApi.call 'pbd.disconnect', {id: UUID}

    $scope.reconnectAllHosts = () ->
      for pbd in $scope.SR.$PBDs
        ref = xo.get pbd
        xoApi.call 'pbd.connect', ref

    $scope.rescanSr = (UUID) ->
      console.log  "Rescan SR #{UUID}"

      xoApi.call 'sr.scan', {id: UUID}

    $scope.saveVDI = ->
      #results = []
      # console.log "save"
      # console.log $scope.VDI
      # for result in results
      #   console.log result
      #   vdi = $scope.vdi
      # {VDI} = $scope
      # {name_label, name_description, size} = $data

      # $data = {
      #   id: VDI.UUID
      # }
      # if size isnt $scope.Size and (size = sizeToBytesFilter size)
      #   $data.size = size
      #   $scope.sizeSize = bytesToSizeFilter size
      # if name_label isnt VDI.name_label
      #   $data.name_label = name_label
      # if name_description isnt VDI.name_description
      #   $data.name_description = name_description

      # xoApi.call 'vdi.set', $data

  # A module exports its name.
  .name
