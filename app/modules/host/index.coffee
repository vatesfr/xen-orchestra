angular = require 'angular'
forEach = require 'lodash.foreach'
intersection = require 'lodash.intersection'
map = require 'lodash.map'
omit = require 'lodash.omit'
sum = require 'lodash.sum'
throttle = require 'lodash.throttle'

#=====================================================================

module.exports = angular.module 'xoWebApp.host', [
  require 'angular-file-upload'
  require 'angular-ui-router'
  require 'tag'
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
    do (
      hostId = $stateParams.id
      controllers = xoApi.getIndex('vmControllersByContainer')
      poolPatches = xoApi.getIndex('poolPatchesByPool')
      srs = xoApi.getIndex('srsByContainer')
      tasks = xoApi.getIndex('runningTasksByHost')
      vms = xoApi.getIndex('vmsByContainer')
    ) ->
      Object.defineProperties($scope, {
        controller: {
          get: () => controllers[hostId]
        },
        poolPatches: {
          get: () => $scope.host && poolPatches[$scope.host.$poolId]
        },
        sharedSrs: {
          get: () => $scope.host && srs[$scope.host.$poolId]
        },
        srs: {
          get: () => srs[hostId]
        },
        tasks: {
          get: () => tasks[hostId]
        },
        vms: {
          get: () => vms[hostId]
        }
      })

    $window.bytesToSize = bytesToSizeFilter # FIXME dirty workaround to custom a Chart.js tooltip template
    host = null

    $scope.currentPatchPage = 1
    $scope.currentLogPage = 1
    $scope.currentPCIPage = 1
    $scope.currentGPUPage = 1

    $scope.refreshStatControl = refreshStatControl = {
      baseStatInterval: 5000
      baseTimeOut: 10000
      period: null
      running: false
      attempt: 0

      start: () ->
        return if this.running
        this.stop()
        this.running = true
        this._reset()
        $scope.$on('$destroy', () => this.stop())
        return this._trig(Date.now())
      _trig: (t1) ->
        if this.running
          timeoutSecurity = $timeout(
            () => this.stop(),
            this.baseTimeOut
          )
          return $scope.refreshStats($scope.host.id)
          .then () => this._reset()
          .catch (err) =>
            if !this.running || this.attempt >= 2 || $scope.host.power_state isnt 'Running' || $scope.isVMWorking($scope.host)
              return this.stop()
            else
              this.attempt++
          .finally () =>
            $timeout.cancel(timeoutSecurity)
            if this.running
              t2 = Date.now()
              return this.period = $timeout(
                () => this._trig(t2),
                Math.max(this.baseStatInterval - (t2 - t1), 0)
              )
      _reset: () ->
        this.attempt = 0
      stop: () ->
        if this.period
          $timeout.cancel(this.period)
        this.running = false
        return
    }
    $scope.$watch(
      -> xoApi.get $stateParams.id
      (host) ->
        $scope.host = host
        return unless host?

        pool = $scope.pool = xoApi.get host.$poolId

        SRsToPBDs = $scope.SRsToPBDs = Object.create null
        for PBD in host.$PBDs
          PBD = xoApi.get PBD

          # If this PBD is unknown, just skips it.
          continue unless PBD

          SRsToPBDs[PBD.SR] = PBD
        $scope.listMissingPatches($scope.host.id)

        if host.power_state is 'Running'
          refreshStatControl.start()
        else
          refreshStatControl.stop()
    )

    $scope.$watch('vms', (vms) =>
      $scope.vCPUs = sum(vms, (vm) => vm.CPUs.number)
    )

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
        message: 'Are you sure you want to detach this host from its pool? It will be automatically rebooted AND LOCAL STORAGE WILL BE ERASED.'
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
        id: host.id
      }
      if name_label isnt host.name_label
        $data.name_label = name_label
      if name_description isnt host.name_description
        $data.name_description = name_description
      if enabled isnt host.enabled
        if host.enabled
          $scope.disableHost($data.id)
        else
          $scope.enableHost($data.id)
      # enabled is not set via the "set" method, so we remove it before send it
      delete $data.enabled

      xoApi.call 'host.set', $data

    $scope.deleteAllLog = ->
      modal.confirm({
        title: 'Log deletion'
        message: 'Are you sure you want to delete all the logs?'
      }).then ->
        forEach $scope.host.messages, (log) ->
          console.log "Remove log #{log.id}"
          xo.log.delete log.id
          return

    $scope.deleteLog = (id) ->
      console.log "Remove log #{id}"
      xo.log.delete id

    $scope.connectPBD = (id) ->
      console.log "Connect PBD #{id}"

      xoApi.call 'pbd.connect', {id: id}

    $scope.disconnectPBD = (id) ->
      console.log "Disconnect PBD #{id}"

      xoApi.call 'pbd.disconnect', {id: id}

    $scope.removePBD = (id) ->
      console.log "Remove PBD #{id}"

      xoApi.call 'pbd.delete', {id: id}

    $scope.connectPIF = (id) ->
      console.log "Connect PIF #{id}"

      xoApi.call 'pif.connect', {id: id}

    $scope.disconnectPIF = (id) ->
      console.log "Disconnect PIF #{id}"

      xoApi.call 'pif.disconnect', {id: id}

    $scope.removePIF = (id) ->
      console.log "Remove PIF #{id}"

      xoApi.call 'pif.delete', {id: id}

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
        host: $scope.host.id
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
          $scope.updates = omit(result,map($scope.poolPatches,'id'))

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
          forEach result.cpus, (v,k) ->
            result.cpuSeries.push 'CPU ' + k
            return
          result.pifSeries = []
          forEach result.pifs, (v,k) ->
            result.pifSeries.push '#' + Math.floor(k/2) + ' ' + if k % 2 then 'out' else 'in'
            return
          forEach result.date, (v,k) ->
            result.date[k] = new Date(v*1000).toLocaleTimeString()
          forEach result.memoryUsed, (v, k) ->
            result.memoryUsed[k] = v*1024
          forEach result.memory, (v, k) ->
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
