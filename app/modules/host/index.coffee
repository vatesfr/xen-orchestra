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
    $scope, $stateParams, $http
    $upload
    $window
    xoApi, xo, modal, notify, bytesToSizeFilter
  ) ->
    $window.bytesToSize = bytesToSizeFilter # FIXME dirty workaround to custom a Chart.js tooltip template
    host = null
    $scope.$watch(
      -> xoApi.get $stateParams.id
      (host) ->
        $scope.host = host
        return unless host?

        $scope.pool = xoApi.get host.poolRef

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = xoApi.get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
    )

    $scope.removeMessage = xo.message.delete

    $scope.cancelTask = (id) ->
      modal.confirm({
        title: 'Cancel task'
        message: 'Are you sure you want to cancel this task?'
      }).then ->
        xo.task.cancel id

    $scope.destroyTask = (id) ->
      modal.confirm({
        title: 'Destroy task'
        message: 'Are you sure you want to destroy this task?'
      }).then ->
        xo.task.destroy id

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

    $scope.importVm = ($files, id) ->
      file = $files[0]
      notify.info {
        title: 'VM import started'
        message: "Starting the VM import"
      }

      xo.vm.import id
      .then ({ $sendTo: url }) ->
        return $upload.http {
          method: 'POST'
          url
          data: file
        }
      .then (result) ->
        throw result.status if result.status isnt 200
        notify.info
          title: 'VM import'
          message: 'Success'

    $scope.createNetwork = (name, description, pif, mtu, vlan) ->

      $scope.createNetworkWaiting = true # disables form fields
      notify.info {
        title: 'Network creation...'
        message: 'Creating the network'
      }

      params = {
        host: $scope.host.UUID
        name,
      }

      if mtu then params.mtu = mtu
      if pif then params.pif = pif
      if vlan then params.vlan = vlan
      if description then params.description = description

      xoApi.call 'host.createNetwork', params
      .then ->
        $scope.creatingNetwork = false
        $scope.createNetworkWaiting = false


    $scope.checkUpdate = (id) ->
      console.log "Patch check for #{id}"
      notify.info {
        title: 'Update check'
        message: "Searching for udpates..."
      }
      return xo.host.patchCheck id
        .then (result) ->
          $scope.host.updates = result

    $scope.patchHost = (url, id) ->
      console.log "Patch download and apply for #{id}"
      notify.info {
        title: 'Patch host'
        message: "Patching the host..."
      }
      $http.get(url).success data ->
        file = data

      xo.pool.patch $scope.host.poolRef, id, url
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
              title: 'Upload patch'
              message: "#{percentage}%"
          6e3
        )
      .then (result) ->
        throw result.status if result.status isnt 200
        notify.info
          title: 'Upload patch'
          message: 'Success'
  # A module exports its name.
  .name
