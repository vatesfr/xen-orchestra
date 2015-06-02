angular = require 'angular'
forEach = require 'lodash.foreach'
isEmpty = require 'lodash.isempty'
_difference = require 'lodash.difference'
_sortBy = require 'lodash.sortby'

isoDevice = require('../iso-device')

#=====================================================================

module.exports = angular.module 'xoWebApp.vm', [
  require 'angular-ui-router',
  require 'angular-ui-bootstrap'

  isoDevice
]
  .config ($stateProvider) ->
    $stateProvider.state 'VMs_view',
      url: '/vms/:id'
      controller: 'VmCtrl'
      template: require './view'
  .controller 'VmCtrl', (
    $scope, $state, $stateParams, $location, $q
    xoApi, xo
    sizeToBytesFilter, bytesToSizeFilter
    modal
    $window
    $timeout
    dateFilter
    notify
  ) ->
    $window.bytesToSize = bytesToSizeFilter # FIXME dirty workaround to custom a Chart.js tooltip template
    {get} = xoApi

    merge = do ->
      push = Array::push.apply.bind Array::push
      (args...) ->
        result = []
        for arg in args
          push result, arg if arg?
        result

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
          return $scope.refreshStats($scope.VM.id)
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

    networksByPool = xoApi.getIndex('networksByPool')
    srsByContainer = xoApi.getIndex('srsByContainer')

    $scope.$watch(
      -> get $stateParams.id, 'VM'
      (VM) ->
        $scope.VM = VM

        return unless VM?

        # For the edition of this VM.
        $scope.memorySize = bytesToSizeFilter VM.memory.size

        $scope.bootParams = parseBootParams($scope.VM.boot.order)

        # build VDI list of this VM
        mountedIso = ''
        VDIs = []
        for VBD in VM.$VBDs
          oVbd = get VBD
          continue unless oVbd

          oVdi = get oVbd.VDI
          continue unless oVdi

          VDIs.push oVdi if oVdi and not oVbd.is_cd_drive
          if oVbd.is_cd_drive and oVdi # "Load" the cd drive
            mountedIso = oVdi.id

        $scope.VDIs = _sortBy(VDIs, (value) -> (get resolveVBD(value))?.position);

        container = get VM.$container

        if container.type is 'host'
          host = container
          pool = (get container.$poolId) ? {}
        else
          host = {}
          pool = container

        $scope.networks = networksByPool[pool.id]

        # Computes the list of srs.
        SRs = $scope.SRs = []
        forEach(srsByContainer[host.id], (template) =>
          SRs.push(template)
          return
        )
        forEach(srsByContainer[pool.id], (template) =>
          SRs.push(template)
          return
        )
        # compute writable accessible SR from this VM
        $scope.writable_SRs = (SR for SR in SRs when SR.content_type isnt 'iso')

        prepareDiskData mountedIso

        if VM.power_state is 'Running' && !($scope.isVMWorking($scope.VM))
          refreshStatControl.start()
        else
          refreshStatControl.stop()
    )

    descriptor = (obj) ->
      return obj.name_label + (if obj.name_description.length then ' - ' + obj.name_description else '')

    prepareDiskData = (mounted) ->
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

      # $scope.vdiFreePos = _difference([0..++maxPos], unfreePositions)
      $scope.maxPos = maxPos

      $scope.VDIOpts = []
      ISOOpts = []
      for SR in $scope.SRs
        if 'iso' isnt SR.SR_type
          for rVdi in SR.VDIs
            oVdi = get rVdi

            $scope.VDIOpts.push({
              sr: descriptor(SR),
              label: descriptor(oVdi),
              vdi: oVdi
              })
        else
          for rIso in SR.VDIs
            oIso = get rIso
            ISOOpts.push({
              sr: SR.name_label,
              label: descriptor(oIso),
              iso: oIso
              })

      $scope.isoDeviceData = {
        opts: ISOOpts
        mounted
      }

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
      forEach(bootParams, (boot) -> boot.v && paramString += boot.e)
      return xoApi.call 'vm.bootOrder', {vm: id, order: paramString}
      .finally () ->
        $scope.savingBootOrder = false
        $scope.bootReordering = false

    $scope.refreshStats = (id) ->
      return xo.vm.refreshStats id

        .then (result) ->
          result.cpuSeries = []
          forEach result.cpus, (v,k) ->
            result.cpuSeries.push 'CPU ' + k
            return
          result.vifSeries = []
          forEach result.vifs, (v,k) ->
            result.vifSeries.push '#' + Math.floor(k/2) + ' ' + if k % 2 then 'out' else 'in'
            return
          result.xvdSeries = []
          forEach result.xvds, (v,k) ->
            # 97 is ascii code of 'a'
            result.xvdSeries.push 'xvd' + String.fromCharCode(Math.floor(k/2) + 97, ) + ' ' + if k % 2 then 'write' else 'read'
            return
          forEach result.date, (v,k) ->
            result.date[k] = new Date(v*1000).toLocaleTimeString()
          $scope.stats = result

    $scope.startVM = (id) ->
      xo.vm.start id
      notify.info {
        title: 'VM starting...'
        message: 'Start VM'
      }

    $scope.stopVM = (id) ->
      xo.vm.stop id
      notify.info {
        title: 'VM shutdown...'
        message: 'Gracefully shutdown the VM'
      }

    $scope.force_stopVM = (id) ->
      xo.vm.stop id, true
      notify.info {
        title: 'VM force shutdown...'
        message: 'Force shutdown the VM'
      }

    $scope.rebootVM = (id) ->
      xo.vm.restart id
      notify.info {
        title: 'VM reboot...'
        message: 'Gracefully reboot the VM'
      }

    $scope.force_rebootVM = (id) ->
      xo.vm.restart id, true
      notify.info {
        title: 'VM reboot...'
        message: 'Force reboot the VM'
      }

    $scope.suspendVM = (id) ->
      xo.vm.suspend id, true
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
      (xo.vm.migrate id, hostId).catch (error) ->
        modal.confirm
          title: 'VM migrate'
          message: 'This VM can\'t be migrated with Xen Motion to this host because they don\'t share any storage. Do you want to try a Xen Storage Motion?'

        .then ->
          notify.info {
            title: 'VM migration'
            message: 'The migration process started'
          }

          xo.vm.migratePool {
            id
            target_host_id: hostId
          }

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

      xoApi.call 'vm.set', result

    $scope.saveVM = ($data) ->
      {VM} = $scope
      {CPUs, memory, name_label, name_description, high_availability, auto_poweron} = $data

      $data = {
        id: VM.id
      }
      if memory isnt $scope.memorySize and (memory = sizeToBytesFilter memory)
        $data.memory = memory
        $scope.memorySize = bytesToSizeFilter memory
      if CPUs isnt VM.CPUs.number
        $data.CPUs = +CPUs
      if name_label isnt VM.name_label
        $data.name_label = name_label
      if name_description isnt VM.name_description
        $data.name_description = name_description
      if high_availability isnt VM.high_availability
        $data.high_availability = high_availability
      if auto_poweron isnt VM.auto_poweron
        $data.auto_poweron = auto_poweron

      xoApi.call 'vm.set', $data

    #-----------------------------------------------------------------
    # Disks
    #-----------------------------------------------------------------

    $scope.moveDisk = (index, direction) ->
      {VDIs} = $scope

      newIndex = index + direction
      [VDIs[index], VDIs[newIndex]] = [VDIs[newIndex], VDIs[index]]

      return

    migrateDisk = (id, sr_id) ->
      return modal.confirm({
        title: 'Disk migration'
        message: 'Are you sure you want to migrate (move) this disk to another SR?'
      }).then ->
        notify.info {
          title: 'Disk migration'
          message: 'Disk migration started'
        }
        xo.vdi.migrate id, sr_id
        return

    $scope.saveDisks = (data) ->
      # Group data by disk.
      disks = {}
      forEach data, (value, key) ->
        i = key.indexOf '/'
        (disks[key.slice 0, i] ?= {})[key.slice i + 1] = value
        return

      promises = []

      # Handle SR change.
      forEach disks, (attributes, id) ->
        disk = get id
        if attributes.$SR isnt disk.$SR
          promises.push (migrateDisk id, attributes.$SR)

        return

      forEach disks, (attributes, id) ->
        # Keep only changed attributes.
        disk = get id
        forEach attributes, (value, name) ->
          delete attributes[name] if value is disk[name]
          return

        unless isEmpty attributes
          # Inject id.
          attributes.id = id

          # Ask the server to update the object.
          promises.push xoApi.call 'vdi.set', attributes
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
        rVbd = vbd if (get vbd).VM is $scope.VM.id
      return rVbd || null

    $scope.disconnectVBD = (vdi) ->
      id = resolveVBD(vdi)
      if id?
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
        console.log "Delete VBD #{id}"
        modal.confirm({
          title: 'VBD deletion'
          message: 'Are you sure you want to delete this VM disk attachment (the disk will NOT be destroyed)?'
        }).then ->
          xo.vbd.delete id

    $scope.connectVIF = (id) ->
      console.log "Connect VIF #{id}"

      xo.vif.connect id

    $scope.disconnectVIF = (id) ->
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
        window.open url

    $scope.convertVM = (id) ->
      console.log "Convert VM #{id}"
      modal.confirm({
        title: 'VM to template'
        message: 'Are you sure you want to convert this VM into a template?'
      }).then ->
        xo.vm.convert id

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

    $scope.isFreeForWriting = isFreeForWriting = (vdi) ->
      free = true
      for vbd in vdi.$VBDs
        oVbd = get vbd
        free = free && (!oVbd?.attached || oVbd?.read_only)
      return free

    $scope.createVdi = (name, size, sr, bootable, readonly) ->

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
      $scope.newInterfaceMTU = network.MTU

    $scope.createInterface = (network, mtu, automac, mac) ->

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
        # console.log(id)
        xo.vif.connect id
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

  # A module exports its name.
  .name
