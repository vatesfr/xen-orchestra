angular = require 'angular'
assign = require 'lodash.assign'
filter = require 'lodash.filter'
find = require 'lodash.find'
forEach = require 'lodash.foreach'
includes = require 'lodash.includes'
isEmpty = require 'lodash.isempty'
sortBy = require 'lodash.sortby'

#=====================================================================

module.exports = angular.module 'xoWebApp.vm', [
  require 'angular-ui-router',
  require 'angular-ui-bootstrap'
  require('iso-device').default
  require('tag').default
]
  .config ($stateProvider) ->
    $stateProvider.state 'VMs_view',
      url: '/vms/:id'
      controller: 'VmCtrl'
      template: require './view'
  .controller 'VmCtrl', (
    $scope, $state, $stateParams, $location, $q
    xoApi, xo
    bytesToSizeFilter, sizeToBytesFilter, xoHideUnauthorizedFilter, bytesConvertFilter
    modal
    migrateVmModal
    $window
    $timeout
    dateFilter
    notify
  ) ->
    $window.bytesToSize = bytesToSizeFilter # FIXME dirty workaround to custom a Chart.js tooltip template
    {get} = xoApi

    $scope.canSetCpuWeight = () =>
      return xoApi.user && xoApi.user.permission is 'admin' || !$scope.VM.other['xo:resource_set']

    checkMainObject = ->
      if !$scope.VM
        $state.go('index')
        return false
      else
        return true

    pool = null
    host = null
    vm = null
    $scope.srsByContainer = xoApi.getIndex('srsByContainer')
    $scope.networksByPool = xoApi.getIndex('networksByPool')
    $scope.pools = xoApi.getView('pools')
    $scope.PIFs = xoApi.getView('PIFs')
    $scope.VIFs = xoApi.getView('VIFs')
    do (
      networksByPool = xoApi.getIndex('networksByPool')
      srsByContainer = xoApi.getIndex('srsByContainer')
      hostsByPool = xoApi.getIndex('hostsByPool')
      poolSrs = null
      hostSrs = null
    ) ->
      Object.defineProperties($scope, {
        networks: {
          get: () => pool && networksByPool[pool.id]
        }
      })
      updateSrs = () =>
        srs = []
        poolSrs and forEach(poolSrs, (sr) => srs.push(sr))
        hostSrs and forEach(hostSrs, (sr) => srs.push(sr))
        if (($scope.VM?.power_state is 'Halted') || ($scope.VM?.power_state is 'Suspended')) && pool.id
          forEach hostsByPool[pool.id], (host) ->
            forEach srsByContainer[host.id], (sr) -> srs.push(sr)

        srs = xoHideUnauthorizedFilter(srs)
        $scope.writable_SRs = filter(srs, (sr) => sr.content_type isnt 'iso')
        $scope.SRs = srs
        vm and prepareDiskData()
      $scope.$watchCollection(
        () => pool and srsByContainer[pool.id],
        (srs) =>
          poolSrs = srs
          updateSrs()
      )
      $scope.$watchCollection(
        () => host and srsByContainer[host.id],
        (srs) =>
          hostSrs = srs
          updateSrs()
      )
      $scope.$watchCollection(
        () => vm and vm.$VBDs,
        (vbds) =>
          return unless vbds?
          prepareDiskData()
      )

    $scope.objects = xoApi.all

    $scope.currentLogPage = 1
    $scope.currentSnapPage = 1
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
          promise = if $scope.VM?.id then $scope.refreshStats($scope.VM.id) else $q.reject()
          return promise
          .then () => this._reset()
          .catch (err) =>
            if !this.running || this.attempt >= 2 || $scope.VM.power_state isnt 'Running' || $scope.isVMWorking($scope.VM)
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

    $scope.hosts = xoApi.getView('hosts')
    $scope.hostsByPool = xoApi.getIndex('hostsByPool')

    $scope.$watch(
      -> get $stateParams.id, 'VM'
      (VM) ->
        $scope.VM = vm = VM
        return unless VM?

        $scope.cpuWeight = VM.cpuWeight || 0

        # For the edition of this VM.
        $scope.bytes = VM.memory.size
        memory = bytesToSizeFilter($scope.bytes).split(' ')
        $scope.memoryValue = memory[0]
        $scope.memoryUnit = memory[1]

        $scope.bootParams = parseBootParams($scope.VM.boot.order)

        $scope.prepareVDIs()

        container = get VM.$container

        if container.type is 'host'
          host = $scope.host = container
          pool = $scope.pool = (get container.$poolId) ? {}
        else
          host = $scope.host = {}
          pool = $scope.pool = container

        if VM.power_state is 'Running' && !($scope.isVMWorking($scope.VM))
          refreshStatControl.start()
        else
          refreshStatControl.stop()
    )

    $scope.prepareVDIs = () ->
      return unless $scope.VM
      # build VDI list of this VM
      VDIs = []
      for VBD in $scope.VM.$VBDs
        oVbd = get VBD
        continue unless oVbd
        oVdi = get oVbd.VDI
        continue unless oVdi

        if not oVbd.is_cd_drive
          size = bytesToSizeFilter(oVdi.size)
          oVdi = assign({}, oVdi, {
            size,
            sizeValue: size.split(' ')[0],
            sizeUnit: size.split(' ')[1],
            position: oVbd.position
          })
          oVdi.xoBootable = $scope.isBootable oVdi
          VDIs.push oVdi

      $scope.VDIs = sortBy(VDIs, 'position');

    descriptor = (obj) ->
      if !obj
        return ''
      return obj.name_label + (if obj.name_description.length then ' - ' + obj.name_description else '')

    prepareDiskData = () ->
      # For populating adding position choice
      unfreePositions = [];
      maxPos = 0;
      # build VDI list of this VM
      for VBD in $scope.VM.$VBDs
        oVbd = get VBD
        oVdi = get oVbd?.VDI
        if oVdi?
          unfreePositions.push parseInt oVbd.position
          maxPos = if (oVbd.position > maxPos) then parseInt oVbd.position else maxPos

      $scope.maxPos = maxPos

      VDIOpts = []
      authSRs = xoHideUnauthorizedFilter($scope.SRs)
      for SR in authSRs
        if 'iso' isnt SR.SR_type
          for rVdi in SR.VDIs
            oVdi = get rVdi
            if oVdi
              VDIOpts.push({
                sr: descriptor(SR),
                label: descriptor(oVdi),
                vdi: oVdi
                })
      $scope.VDIOpts = VDIOpts

    parseBootParams = (params) ->
      texts = {
        c: 'Hard-Drive',
        d: 'DVD-Drive',
        n: 'Network'
      }
      bootParams = []
      i = 0
      if params
        while (i < params.length)
          char = params.charAt(i++)
          bootParams.push({
            e: char,
            t: texts[char],
            v: true
          })
          delete texts[char]
      for key, text of texts
        bootParams.push({
          e: key,
          t: text,
          v: false
        })
      return bootParams

    $scope.bootMove = (index, move) ->
      tmp = $scope.bootParams[index + move]
      $scope.bootParams[index + move] = $scope.bootParams[index]
      $scope.bootParams[index] = tmp

    $scope.saveBootParams = (id, bootParams) ->
      if $scope.savingBootOrder
        return
      $scope.savingBootOrder = true
      paramString = ''
      forEach(bootParams, (boot) ->
        boot.v && paramString += boot.e
        return
      )
      return xo.vm.setBootOrder {vm: id, order: paramString}
      .finally () ->
        $scope.savingBootOrder = false
        $scope.bootReordering = false

    $scope.refreshStats = (id) ->
      return xo.vm.refreshStats id
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

          result.stats.vifSeries = []
          vifsArray = []
          forEach result.stats.vifs.rx, (v,k) ->
            return unless v
            result.stats.vifSeries.push '#' + k + ' in'
            result.stats.vifSeries.push '#' + k + ' out'
            vifsArray.push (v || [])
            vifsArray.push (result.stats.vifs.tx[k] || [])
            return
          result.stats.vifs = vifsArray

          result.stats.xvdSeries = []
          xvdsArray = []
          forEach result.stats.xvds.r, (v,k) ->
            return unless v
            result.stats.xvdSeries.push 'xvd' + k + ' read'
            result.stats.xvdSeries.push 'xvd' + k + ' write'
            xvdsArray.push (v || [])
            xvdsArray.push (result.stats.xvds.w[k] || [])
            return
          result.stats.xvds = xvdsArray

          result.stats.date = []
          timestamp = result.endTimestamp
          for i in [result.stats.memory.length-1..0] by -1
            result.stats.date.unshift new Date(timestamp*1000).toLocaleTimeString()
            timestamp -= 5
          $scope.stats = result.stats

    $scope.startVM = (id) ->
      xo.vm.start id
      notify.info {
        title: 'VM starting...'
        message: 'Start VM'
      }

    $scope.recoveryStartVM = (id) ->
      xo.vm.recoveryStart id
      notify.info {
        title: 'VM starting...'
        message: 'Start VM in recovery mode'
      }

    $scope.stopVM = (id) ->
      modal.confirm
        title: 'VM shutdown'
        message: 'Are you sure you want to shutdown this VM ?'
      .then ->
        xo.vm.stop id
        notify.info {
          title: 'VM shutdown...'
          message: 'Gracefully shutdown the VM'
        }

    $scope.force_stopVM = (id) ->
      modal.confirm
        title: 'VM force shutdown'
        message: 'Are you sure you want to force shutdown for this VM ?'
      .then ->
        xo.vm.stop id, true
        notify.info {
          title: 'VM force shutdown...'
          message: 'Force shutdown the VM'
        }

    $scope.rebootVM = (id) ->
      modal.confirm
        title: 'VM reboot'
        message: 'Are you sure you want to reboot this VM ?'
      .then ->
        xo.vm.restart id
        notify.info {
          title: 'VM reboot...'
          message: 'Gracefully reboot the VM'
        }

    $scope.force_rebootVM = (id) ->
      modal.confirm
        title: 'VM reboot'
        message: 'Are you sure you want to force reboot for this VM ?'
      .then ->
        xo.vm.restart id, true
        notify.info {
          title: 'VM reboot...'
          message: 'Force reboot the VM'
        }

    $scope.suspendVM = (id) ->
      modal.confirm
        title: 'VM suspend'
        message: 'Are you sure you want to suspend this VM ?'
      .then ->
        xo.vm.suspend id
        notify.info {
          title: 'VM suspend...'
          message: 'Suspend the VM'
        }

    $scope.resumeVM = (id) ->
      xo.vm.resume id, true
      notify.info {
        title: 'VM resume...'
        message: 'Resume the VM'
      }

    $scope.migrateVM = (id, hostId) ->
      targetHost = $scope.hosts.all[hostId]
      targetPoolId = $scope.hosts.all[hostId].$poolId
      targetPool = $scope.pools.all[targetPoolId]
      {VDIs} = $scope

      vmSrsOnTargetPool = true
      forEach(VDIs, (vdi) ->
        vmSrsOnTargetPool = vmSrsOnTargetPool && $scope.srsByContainer[targetPoolId].hasOwnProperty(vdi.$SR)
      )

      if vmSrsOnTargetPool
        modal.confirm
          title: 'VM migrate'
          message: 'Are you sure you want to migrate this VM?'
        .then ->
          xo.vm.migrate id, hostId
        return

      defaults = {}
      VIFs = []
      networks = []
      srsOnTargetPool = []
      srsOnTargetHost = []

      # Possible SRs for each VDI
      forEach($scope.srsByContainer[targetPoolId], (sr) ->
        srsOnTargetPool.push(sr) if sr.content_type != 'iso'
      )
      forEach($scope.srsByContainer[targetHost.id], (sr) ->
        srsOnTargetHost.push(sr) if sr.content_type != 'iso'
      )
      defaults.sr = targetPool.default_SR


      # Possible networks for each VIF
      forEach($scope.VM.VIFs, (vifId) ->
        VIFs.push($scope.VIFs.all[vifId])
      )

      poolNetworks = $scope.networksByPool[targetPoolId]
      forEach(targetHost.PIFs, (pifId) ->
        networkId = $scope.PIFs.all[pifId].$network
        networks.push(poolNetworks[networkId])
      )
      defaultPIF = find($scope.PIFs.all, (pif) -> pif.management && includes(targetHost.PIFs, pif.id))
      defaults.network = defaultPIF.$network

      {pool} = $scope
      intraPoolMigration = (pool.id == targetPoolId)

      migrateVmModal($state, id, hostId, $scope.VDIs, srsOnTargetPool, srsOnTargetHost, VIFs, networks, defaults, intraPoolMigration)

    $scope.destroyVM = (id) ->
      modal.confirm
        title: 'VM deletion'
        message: 'Are you sure you want to delete this VM? (including its disks)'
      .then ->
        # FIXME: provides a way to not delete its disks.
        xo.vm.delete id, true
      .then ->
        $state.go 'index'
        notify.info {
          title: 'VM deletion'
          message: 'VM is removed'
        }

    $scope.saveSnapshot = (id, $data) ->
      snapshot = get (id)

      result = {
        id: snapshot.id
        name_label: $data
      }

      if $data isnt snapshot.name_label
        result.name_label = $data

      xo.vm.set(result)

    $scope.xenDefaultWeight = xenDefaultWeight = 256
    $scope.weightMap = {0: 'Default'}
    $scope.weightMap[xenDefaultWeight / 4] = 'Quarter (1/4)'
    $scope.weightMap[xenDefaultWeight / 2] = 'Half (1/2)'
    $scope.weightMap[xenDefaultWeight] = 'Normal'
    $scope.weightMap[xenDefaultWeight * 2] = 'Double (x2)'

    $scope.units = ['MiB', 'GiB', 'TiB']

    $scope.saveVM = ($data) ->
      {VM} = $scope
      {CPUs, cpuWeight, memoryValue, memoryUnit, name_label, name_description, high_availability, auto_poweron, PV_args} = $data

      cpuWeight = cpuWeight || 0 # 0 will let XenServer use it's default value

      newBytes = sizeToBytesFilter(memoryValue + ' ' + memoryUnit)

      $data = {
        id: VM.id
      }
      if $scope.bytes isnt newBytes
        $data.memory = bytesToSizeFilter(newBytes)
      if CPUs isnt VM.CPUs.number
        $data.CPUs = +CPUs
      if cpuWeight isnt (VM.cpuWeight || 0)
        $data.cpuWeight = +cpuWeight
      if name_label isnt VM.name_label
        $data.name_label = name_label
      if name_description isnt VM.name_description
        $data.name_description = name_description
      if high_availability isnt VM.high_availability
        $data.high_availability = high_availability
      if auto_poweron isnt VM.auto_poweron
        $data.auto_poweron = auto_poweron
      if PV_args isnt VM.PV_args
        $data.PV_args = PV_args

      xo.vm.set($data)

    #-----------------------------------------------------------------
    # Disks
    #-----------------------------------------------------------------

    $scope.moveDisk = (index, direction) ->
      {VDIs} = $scope

      newIndex = index + direction
      [VDIs[index], VDIs[newIndex]] = [VDIs[newIndex], VDIs[index]]

      return

    migrateDisk = (id, sr_id) ->
      notify.info {
        title: 'Disk migration'
        message: 'Disk migration started'
      }
      xo.vdi.migrate id, sr_id
      return

    $scope.saveDisks = (data, vdis) ->
      # Group data by disk.
      disks = {}
      sizeChanges = false
      srChanges = false
      forEach data, (value, key) ->
        i = key.indexOf '/'
        (disks[key.slice 0, i] ?= {})[key.slice i + 1] = value
        return

      # Setting correctly formatted disk size properties
      forEach disks, (disk) ->
        disk.size = bytesToSizeFilter(sizeToBytesFilter(disk.sizeValue + ' ' + disk.sizeUnit))
        disk.sizeValue = disk.size.split(' ')[0]
        disk.sizeUnit = disk.size.split(' ')[1]

      promises = []

      # Set bootable status
      forEach vdis, (vdi) ->
        bootable = vdi.xoBootable
        if $scope.isBootable(vdi) != bootable
          id = (get resolveVBD(vdi)).id
          promises.push (xo.vbd.setBootable id, bootable)
        return

      # Disk resize
      forEach disks, (attributes, id) ->
        disk = get id
        if attributes.$SR isnt disk.$SR
          srChanges = true
        if attributes.size isnt bytesToSizeFilter(disk.size) # /!\ attributes are provided by a modified copy of disk
          sizeChanges = true
          return false

      message = ''
      if sizeChanges
        message += 'Growing the size of a disk is not reversible. '
      if srChanges
        message += 'You are about to migrate (move) some disk(s) to another SR. '
      message += 'Are you sure you want to perform those changes?'
      preCheck = if sizeChanges or srChanges then modal.confirm({title: 'Disk modifications', message: message}) else $q.resolve()

      return preCheck
      .then ->
        # Handle SR change.
        forEach disks, (attributes, id) ->
          disk = get id
          if attributes.$SR isnt disk.$SR
            promises.push(migrateDisk(id, attributes.$SR))

          if attributes.size isnt bytesToSizeFilter(disk.size) # /!\ attributes are provided by a modified copy of disk
            promises.push(xo.disk.resize(id, attributes.size))
          delete attributes.size

          # Keep only changed attributes.
          forEach attributes, (value, name) ->
            delete attributes[name] if value is disk[name]
            return

          unless isEmpty attributes
            # Inject id.
            attributes.id = id

            # Ask the server to update the object.
            promises.push(xoApi.call('vdi.set', attributes))

          return

        # Handle Position changes
        vbds = xoApi.get($scope.VM.$VBDs)
        notFreePositions = Object.create(null)
        forEach vbds, (vbd) ->
          if vbd.is_cd_drive
            notFreePositions[vbd.position] = null

        position = 0
        forEach $scope.VDIs, (vdi) ->
          oVbd = get(resolveVBD(vdi))
          unless oVbd
            return

          while position of notFreePositions
            ++position

          if +oVbd.position isnt position
            promises.push(
              xoApi.call('vbd.set', {
                id: oVbd.id,
                position: String(position)
              })
            )

          ++position

        return $q.all promises
        .catch (err) ->
          console.log(err);
          notify.error {
            title: 'saveDisks'
            message: err
          }

    $scope.deleteDisk = (id) ->
      modal.confirm({
        title: 'Disk deletion'
        message: 'Are you sure you want to delete this disk? This operation is irreversible'
      }).then ->
        xoApi.call 'vdi.delete', {id: id}
        return
      return

    #-----------------------------------------------------------------

    # returns the id of the VBD that links the VDI to the VM
    $scope.resolveVBD = resolveVBD = (vdi) ->
      if not vdi?
        return
      for vbd in vdi.$VBDs
        rVbd = vbd if (get vbd)?.VM is $scope.VM?.id
      return rVbd || null

    $scope.disconnectVBD = (vdi) ->
      id = resolveVBD(vdi)
      if id?
        modal.confirm({
          title: 'VBD disconnection'
          message: 'Are you sure you want to detach this VM disk ?'
        }).then ->
          console.log "Disconnect VBD #{id}"
          xo.vbd.disconnect id

    $scope.connectVBD = (vdi) ->
      id = resolveVBD(vdi)
      if id?
        console.log "Connect VBD #{id}"
        xo.vbd.connect id

    $scope.deleteVBD = (vdi) ->
      id = resolveVBD(vdi)
      if id?
        modal.confirm({
          title: 'VBD deletion'
          message: 'Are you sure you want to delete this VM disk attachment (the disk will NOT be destroyed)?'
        }).then ->
          console.log "Delete VBD #{id}"
          xo.vbd.delete id

    $scope.connectVIF = (id) ->
      console.log "Connect VIF #{id}"

      xo.vif.connect id

    $scope.disconnectVIF = (id) ->
      modal.confirm
        title: 'Disconnect VIF'
        message: 'Are you sure you want to disconnect this interface ?'
      .then ->
        console.log "Disconnect VIF #{id}"

        xo.vif.disconnect id

    $scope.deleteVIF = (id) ->
      console.log "Delete VIF #{id}"
      modal.confirm({
        title: 'VIF deletion'
        message: 'Are you sure you want to delete this Virtual Interface (VIF)?'
      }).then ->
        xo.vif.delete id

    $scope.cloneVM = (id, vm_name, full_copy) ->
      clone_name = "#{vm_name}_clone"
      console.log "Copy VM #{id} #{clone_name} with full copy at #{full_copy}"
      notify.info {
          title: 'Clone creation'
          message: 'Clone creation started'
      }
      xo.vm.clone id, clone_name, full_copy

    $scope.snapshotVM = (id, vm_name) ->
      date = dateFilter Date.now(), 'yyyy-MM-ddTHH:mmZ'
      snapshot_name = "#{vm_name}_#{date}"
      console.log "Snapshot #{snapshot_name} from VM #{id}"
      notify.info {
          title: 'Snapshot creation'
          message: 'Snapshot creation started'
      }
      xo.vm.createSnapshot id, snapshot_name

    $scope.exportVM = (id) ->
      console.log "Export VM #{id}"
      notify.info {
          title: 'VM export'
          message: 'VM export started'
      }
      xo.vm.export id
      .then ({$getFrom: url}) ->
        window.open '.' + url

    $scope.copyVM = (id, srId) ->
      console.log "Copy VM #{id} tp SR #{srId}"
      notify.info {
          title: 'VM copy'
          message: 'VM copy started'
      }
      xo.vm.copy id, srId, $scope.VM.name_label + '_COPY'

    $scope.exportOnlyMetadataVM = (id) ->
      console.log "Export Metadata only for VM #{id}"
      notify.info {
          title: 'VM export'
          message: 'VM export started'
      }
      xo.vm.export id, true, true
      .then ({$getFrom: url}) ->
        window.open '.' + url

    $scope.convertVM = (id) ->
      console.log "Convert VM #{id}"
      modal.confirm({
        title: 'VM to template'
        message: 'Are you sure you want to convert this VM into a template?'
      })
      .then ->
        xo.vm.convert id
      .then ->
        $state.go 'index'
        notify.info {
          title: 'VM conversion'
          message: 'VM is converted to template'
        }

    $scope.deleteSnapshot = (id) ->
      console.log "Delete snapshot #{id}"
      modal.confirm({
        title: 'Snapshot deletion'
        message: 'Are you sure you want to delete this snapshot? (including its disks)'
      }).then ->
        # FIXME: provides a way to not delete its disks.
        xo.vm.delete id, true

    $scope.connectPci = (id, pciId) ->
        console.log "Connect PCI device "+pciId+" on VM "+id
        xo.vm.connectPci id, pciId

    $scope.disconnectPci = (id) ->
        xo.vm.disconnectPci id

    $scope.deleteAllLog = ->
      modal.confirm({
        title: 'Log deletion'
        message: 'Are you sure you want to delete all the logs?'
      }).then ->
        forEach($scope.VM.messages, (log) =>
          console.log "Remove log #{log.id}"
          xo.log.delete log.id
          return
        )

    $scope.deleteLog = (id) ->
      console.log "Remove log #{id}"
      xo.log.delete id

    $scope.revertSnapshot = (id) ->
      console.log "Revert snapshot to #{id}"
      modal.confirm({
        title: 'Revert to snapshot'
        message: 'Are you sure you want to revert your VM to this snapshot? The VM will be halted and this operation is irreversible'
      }).then ->
        notify.info {
          title: 'Reverting to snapshot'
          message: 'VM revert started'
        }
        xo.vm.revert id

    $scope.isVMWorking = (VM) ->
      return false unless VM
      return true for _ of VM.current_operations
      false

    $scope.startContainer = (VM,container) ->
      console.log "Start from VM "+VM+" to container "+container
      xo.docker.start VM, container

    $scope.stopContainer = (VM,container) ->
      console.log "Stop from VM "+VM+" to container "+container
      xo.docker.stop VM, container

    $scope.restartContainer = (VM,container) ->
      console.log "Restart from VM "+VM+" to container "+container
      xo.docker.restart VM, container

    $scope.pauseContainer = (VM,container) ->
      console.log "Pause from VM "+VM+" to container "+container
      xo.docker.pause VM, container

    $scope.resumeContainer = (VM,container) ->
      console.log "Unpause from VM "+VM+" to container "+container
      xo.docker.unpause VM, container

    $scope.addVdi = (vdi, readonly, bootable) ->
      return unless checkMainObject()

      $scope.addWaiting = true # disables form fields
      position = $scope.maxPos + 1
      mode = if (readonly || !isFreeForWriting(vdi)) then 'RO' else 'RW'
      return xo.vm.attachDisk $scope.VM.id, vdi.id, bootable, mode, String(position)

      .then -> $scope.adding = false # Closes form block

      .catch (err) ->
        console.log(err);
        notify.error {
          title: 'vm.attachDisk'
          message: err
        }

      .finally ->
        $scope.addWaiting = false

    $scope.isConnected = isConnected = (vdi) -> (get resolveVBD(vdi))?.attached
    $scope.isBootable = isBootable = (vdi) -> (get resolveVBD(vdi))?.bootable

    $scope.isFreeForWriting = isFreeForWriting = (vdi) ->
      free = true
      for vbd in vdi.$VBDs
        oVbd = get vbd
        free = free && (!oVbd?.attached || oVbd?.read_only)
      return free

    $scope.createVdi = (name, size, sr, bootable, readonly) ->
      return unless checkMainObject

      $scope.createVdiWaiting = true # disables form fields
      position = $scope.maxPos + 1

      return xo.disk.create name, String(size), sr

      .then (diskUuid) ->
        mode = if readonly then 'RO' else 'RW'
        return xo.vm.attachDisk $scope.VM.id, diskUuid, bootable, mode, String(position)

        .then -> $scope.creatingVdi = false # Closes form block

        .catch (err) ->
        console.log(err);
        notify.error {
          title: 'Attach Disk'
          message: err
        }

      .catch (err) ->
        console.log(err);
        notify.error {
          title: 'Create Disk'
          message: err
        }

      .finally ->
        $scope.createVdiWaiting = false

    $scope.updateMTU = (network) ->
      $scope.newInterfaceMTU = network && network.MTU

    $scope.createInterface = (network, mtu, automac, mac) ->
      return unless checkMainObject()

      $scope.createVifWaiting = true # disables form fields

      position = 0
      forEach $scope.VM.VIFs, (vf) ->
        int = get vf
        position = if int?.device > position then (get vf)?.device else position

      position++

      mtu = String(mtu || network.mtu)
      mac = if automac then undefined else mac
      return xo.vm.createInterface $scope.VM.id, network.id, String(position), mtu, mac
      .then (id) ->
        $scope.creatingVif = false
      .catch (err) ->
        console.log(err);
        notify.error {
          title: 'Create Interface'
          message: err
        }
      .finally ->
        $scope.createVifWaiting = false

    $scope.statView = {
      cpuOnly: false,
      ramOnly: false,
      netOnly: false,
      diskOnly: false
    }

    $scope.canAdmin = (id = undefined) ->
      if id == undefined
        id = $scope.VM?.id

      return id && xoApi.canInteract(id, 'administrate') || false

    $scope.canOperate = (id = undefined) ->
      if id == undefined
        id = $scope.VM?.id

      return id && xoApi.canInteract(id, 'operate') || false

    $scope.canHostOperate = (id) ->

      return id && xoApi.canInteract(id, 'operate') || false

    $scope.canView = (id = undefined) ->
      if id == undefined
        id = $scope.VM?.id

      return id && xoApi.canInteract(id, 'view') || false

  # A module exports its name.
  .name
