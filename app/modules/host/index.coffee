angular = require 'angular'
throttle = require 'lodash.throttle'

#=====================================================================

module.exports = angular.module 'xoWebApp.host', [
  require 'angular-file-upload'
  require 'angular-ui-router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'hosts_view',
      url: '/hosts/:id'
      controller: 'HostCtrl'
      template: require './view'
  .controller 'HostCtrl', (
    $scope, $stateParams
    $upload
    xoApi, xo, modal, notify
  ) ->
    host = null
    $scope.$watch(
      -> xo.revision
      ->
        host = $scope.host = xo.get $stateParams.id
        return unless host?

        $scope.pool = xo.get host.poolRef

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = xo.get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
    )

    $scope.removeMessage = xo.message.delete

    $scope.removeTask = xo.task.delete

    $scope.disconnectPBD = xo.pbd.disconnect
    $scope.removePBD = xo.pbd.delete

    $scope.new_sr = xo.pool.new_sr

    $scope.pool_addHost = (id) ->
      xo.host.attach id

    $scope.pool_removeHost = (id) ->
      modal.confirm({
        title: 'Remove host from pool'
        message: 'Are you sure you want to detach this host from its pool? It will be automatically rebooted'
      }).then ->
        xo.host.detach id
    $scope.rebootHost = (id) ->
      modal.confirm({
        title: 'Reboot host'
        message: 'Are you sure you want to reboot this host? It will be disabled then rebooted'
      }).then ->
        xo.host.restart id

    $scope.enableHost = (id) ->
      xo.host.enable id
      notify.info {
        title: 'Host action'
        message: 'Host is enabled'
      }

    $scope.disableHost = (id) ->
      modal.confirm({
        title: 'Disable host'
        message: 'Are you sure you want to disable this host? In disabled state, no new VMs can be started and currently active VMs on the host continue to execute.'
      }).then ->
        xo.host.disable id
      .then ->
        notify.info {
          title: 'Host action'
          message: 'Host is disabled'
        }

    $scope.restartToolStack = (id) ->
      modal.confirm({
        title: 'Restart XAPI'
        message: 'Are you sure you want to restart the XAPI toolstack?'
      }).then ->
        xo.host.restartToolStack id

    $scope.shutdownHost = (id) ->
      modal.confirm({
        title: 'Shutdown host'
        message: 'Are you sure you want to shutdown this host?'
      }).then ->
        xo.host.stop id

    $scope.saveHost = ($data) ->
      {host} = $scope
      {name_label, name_description, enabled} = $data

      $data = {
        id: host.UUID
      }
      if name_label isnt host.name_label
        $data.name_label = name_label
      if name_description isnt host.name_description
        $data.name_description = name_description
      if enabled isnt host.enabled
        $data.enabled = host.enabled

      xoApi.call 'host.set', $data

    $scope.deleteAllLog = ->
      modal.confirm({
        title: 'Log deletion'
        message: 'Are you sure you want to delete all the logs?'
      }).then ->
        for log in $scope.host.messages
          console.log "Remove log #{log}"
          xo.log.delete log

    $scope.deleteLog = (id) ->
      console.log "Remove log #{id}"
      xo.log.delete id

    $scope.connectPBD = (UUID) ->
      console.log "Connect PBD #{UUID}"

      xoApi.call 'pbd.connect', {id: UUID}

    $scope.disconnectPBD = (UUID) ->
      console.log "Disconnect PBD #{UUID}"

      xoApi.call 'pbd.disconnect', {id: UUID}

    $scope.removePBD = (UUID) ->
      console.log "Remove PBD #{UUID}"

      xoApi.call 'pbd.delete', {id: UUID}

    $scope.connectPIF = (UUID) ->
      console.log "Connect PIF #{UUID}"

      xoApi.call 'pif.connect', {id: UUID}

    $scope.disconnectPIF = (UUID) ->
      console.log "Disconnect PIF #{UUID}"

      xoApi.call 'pif.disconnect', {id: UUID}

    $scope.removePIF = (UUID) ->
      console.log "Remove PIF #{UUID}"

      xoApi.call 'pif.delete', {id: UUID}

    $scope.importVm = ($files) ->
      file = $files[0]

      xo.vm.import host.UUID
      .then ({ $sendTo: url }) ->
        return $upload.http {
          method: 'POST'
          url
          data: file
        }
        .progress throttle(
          (event) ->
            percentage = (100 * event.loaded / event.total)|0

            notify.info
              title: 'VM import'
              message: "#{percentage}%"
          6e3
        )
      .then (result) ->
        throw result.status if result.status isnt 200
        notify.info
          title: 'VM import'
          message: 'Success'

  # A module exports its name.
  .name
