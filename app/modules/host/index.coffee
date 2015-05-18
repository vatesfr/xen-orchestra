angular = require 'angular'
throttle = require 'lodash.throttle'
intersection = require 'lodash.intersection'
map = require 'lodash.map'
omit = require 'lodash.omit'

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
    $timeout
    dateFilter
    xoApi, xo, modal, notify, bytesToSizeFilter
  ) ->
    $window.bytesToSize = bytesToSizeFilter # FIXME dirty workaround to custom a Chart.js tooltip template
    host = null
    # Provides a fibonacci behaviour for stats refresh on failure
    $scope.refreshStatControl = refreshStatControl = {
      baseStatInterval: 5000
      timeout: null
      running: false

      start: () ->
        return if this.running
        this.running = true
        this._reset()
        $scope.$on('$destroy', () =>
          this.stop()
        )
        $scope.refreshStats($scope.host.UUID)
        return this._trig(Date.now())
      _trig: (t1) ->
        if this.running
          t2 = Date.now()
          timeLeft = Math.max(this.baseStatInterval * this._factor() - Math.max(t2 - t1 - (this.baseStatInterval * this._factor(true)), 0), 0)
          return this.timeout = $timeout(
            () => $scope.refreshStats($scope.host.UUID),
            timeLeft
          )

          .then () =>
            this._reset()
            return this._trig(t2)

          .catch (err) =>
            if !this.running || $scope.host.power_state isnt 'Running'
              this.stop()
            else
              this._next()
              this._trig(t2)
              if this.running
                throw err
      _reset: () ->
        this.terms = [1,1]
      _next: () ->
        this.terms = [this.terms[1], this.terms[0] + this.terms[1]]
      _factor: (p) ->
        return this.terms[if p then 0 else 1]
      stop: () ->
        if this.timeout
          $timeout.cancel(this.timeout)
        this.running = false
        return
    }
    $scope.$watch(
      -> xoApi.get $stateParams.id
      (host) ->
        $scope.host = host
        return unless host?

        $scope.pool = xoApi.get host.poolRef
        $scope.poolPatches = xoApi.get $scope.pool.patches

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = xoApi.get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
        $scope.listMissingPatches($scope.host.UUID)

        if host.power_state is 'Running'
          refreshStatControl.start()
        else
          refreshStatControl.stop()
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

    $scope.isPoolPatchApplied = (patch) ->
      return true if patch.applied
      hostPatch = intersection(patch.$host_patches, $scope.host.patches)
      return false if not hostPatch.length
      hostPatch = xoApi.get(hostPatch[0])
      return hostPatch.applied

    $scope.listMissingPatches = (id) ->
      return xo.host.listMissingPatches id
        .then (result) ->
          $scope.updates = omit(result,map($scope.poolPatches,'UUID'))

    $scope.installPatch = (id, patchUid) ->
      console.log("Install patch "+patchUid+" on "+id)
      notify.info {
        title: 'Patch host'
        message: "Patching the host, please wait..."
      }
      xo.host.installPatch id, patchUid

    $scope.refreshStats = (id) ->
      return xo.host.refreshStats id

        .then (result) ->
          result.cpuSeries = []
          result.cpus.forEach (v,k) ->
            result.cpuSeries.push 'CPU ' + k
            return
          result.pifSeries = []
          result.pifs.forEach (v,k) ->
            result.pifSeries.push '#' + Math.floor(k/2) + ' ' + if k % 2 then 'out' else 'in'
            return
          result.date.forEach (v,k) ->
            result.date[k] = new Date(v*1000).toLocaleTimeString()
          result.memoryUsed.forEach (v, k) ->
            result.memoryUsed[k] = v*1024
          result.memory.forEach (v, k) ->
            result.memory[k] = v*1024
          $scope.stats = result

    $scope.statView = {
      cpuOnly: false,
      ramOnly: false,
      netOnly: false,
      loadOnly: false
    }
  # A module exports its name.
  .name
