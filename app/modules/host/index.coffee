angular = require 'angular'
forEach = require 'lodash.foreach'
intersection = require 'lodash.intersection'
map = require 'lodash.map'
omit = require 'lodash.omit'
sum = require 'lodash.sum'
throttle = require 'lodash.throttle'
find = require 'lodash.find'
filter = require 'lodash.filter'

#=====================================================================

module.exports = angular.module 'xoWebApp.host', [
  require 'angular-ui-router'
  require('ng-file-upload')
  require('tag').default
]
  .config ($stateProvider) ->
    $stateProvider.state 'hosts_view',
      url: '/hosts/:id'
      controller: 'HostCtrl'
      template: require './view'
  .controller 'HostCtrl', (
    $scope, $stateParams, $http
    $timeout
    $window
    dateFilter
    Upload
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
    $scope.currentLicensePage = 1

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

        $scope.hostParams = Object.getOwnPropertyNames(host.license_params)

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
      $scope.vCPUs = sum(map(vms, (vm) => +vm.CPUs.number))
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

    $scope.pools = xoApi.getView('pools')
    $scope.hostsByPool = xoApi.getIndex('hostsByPool')
    $scope.pool_moveHost = (target) ->
      modal.confirm({
        title: 'Move host to another pool'
        message: 'Are you sure you want to move this host?'
      }).then ->
        xo.pool.mergeInto({ source: $scope.pool.id, target: target.id })

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


    $scope.emergencyShutdownHost = (hostId) ->
      modal.confirm({
        title: 'Shutdown host'
        message: 'Are you sure you want to suspend all the VMs on this host and shut the host down?'
      }).then ->
        xo.host.emergencyShutdownHost hostId

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
        return Upload.http {
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
        pool: $scope.host.$pool
        name,
      }

      if mtu then params.mtu = mtu
      if pif then params.pif = pif
      if vlan then params.vlan = vlan
      if description then params.description = description

      xoApi.call 'network.create', params
      .then ->
        $scope.creatingNetwork = false
        $scope.createNetworkWaiting = false

    $scope.addIp = (pif, ip, netmask, dns, gateway, ipMethod) ->
      notify.info {
        title: 'IP configuration...'
        message: 'Configuring new IP mode'
      }
      xoApi.call('pif.reconfigureIp', {
        id: pif.id,
        mode: ipMethod,
        ip,
        netmask,
        dns,
        gateway
      })

    $scope.physicalPifs = () ->
      physicalPifs = []
      forEach $scope.host.$PIFs, (pif) ->
        pif = xoApi.get(pif)
        if pif.physical
          physicalPifs.push pif.id
      return physicalPifs

    $scope.isPoolPatch = (patch) ->
      return false if $scope.poolPatches is undefined
      return $scope.poolPatches.hasOwnProperty(patch.uuid)


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

    $scope.installAllPatches = (id) ->
      modal.confirm({
        title: 'Install all the missing patches'
        message: 'Are you sure you want to install all the missing patches on this host? This could take a while...'
      }).then ->
        console.log('Installing all patches on host ' + id)
        xo.host.installAllPatches id

    $scope.refreshStats = (id) ->
      return xo.host.refreshStats id
        .then (result) ->
          result.stats.cpuSeries = []

          if result.stats.cpus.length >= 12
            nValues = result.stats.cpus[0].length
            nCpus = result.stats.cpus.length
            cpuAVG = (0 for [1..nValues])

            forEach result.stats.cpus, (cpu) ->
              forEach cpu, (stat, index) ->
                cpuAVG[index] += stat
                return
              return

            forEach cpuAVG, (cpu, index) ->
              cpuAVG[index] /= nCpus
              return

            result.stats.cpus = [cpuAVG]
            result.stats.cpuSeries.push 'CPU AVG'
          else
            forEach result.stats.cpus, (v,k) ->
              result.stats.cpuSeries.push 'CPU ' + k
              return

          result.stats.pifSeries = []
          pifsArray = []
          forEach result.stats.pifs.rx, (v,k) ->
            return unless v
            result.stats.pifSeries.push '#' + k + ' in'
            result.stats.pifSeries.push '#' + k + ' out'
            pifsArray.push (v || [])
            pifsArray.push (result.stats.pifs.tx[k] || [])
            return
          result.stats.pifs = pifsArray

          forEach result.stats.memoryUsed, (v, k) ->
            result.stats.memoryUsed[k] = v*1024
          forEach result.stats.memory, (v, k) ->
            result.stats.memory[k] = v*1024

          result.stats.date = []
          timestamp = result.endTimestamp
          for i in [result.stats.memory.length-1..0] by -1
            result.stats.date.unshift new Date(timestamp*1000).toLocaleTimeString()
            timestamp -= 5
          $scope.stats = result.stats

    $scope.statView = {
      cpuOnly: false,
      ramOnly: false,
      netOnly: false,
      loadOnly: false
    }

    $scope.canAdmin = (id = undefined) ->
      if id == undefined
        id = $scope.host && $scope.host.id

      return id && xoApi.canInteract(id, 'administrate') || false

    $scope.canOperate = (id = undefined) ->
      if id == undefined
        id = $scope.host && $scope.host.id

      return id && xoApi.canInteract(id, 'operate') || false

    $scope.canView = (id = undefined) ->
      if id == undefined
        id = $scope.host && $scope.host.id

      return id && xoApi.canInteract(id, 'view') || false
  # A module exports its name.
  .name
