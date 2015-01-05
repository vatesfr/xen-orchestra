angular = require 'angular'
isEmpty = require 'isempty'

#=====================================================================

module.exports = angular.module 'xoWebApp.vm', [
  require 'angular-ui-router'
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
    dateFilter
    notify
  ) ->
    {get} = xo

    merge = do ->
      push = Array::push.apply.bind Array::push
      (args...) ->
        result = []
        for arg in args
          push result, arg if arg?
        result

    $scope.$watch(
      -> xo.revision
      ->
        VM = $scope.VM = get $stateParams.id

        {byTypes} = xo
        $scope.hosts = byTypes.host

        return unless VM?

        # For the edition of this VM.
        $scope.memorySize = bytesToSizeFilter VM.memory.size

        # build VDI list of this VM
        $scope.VDIs = []
        for VBD in VM.$VBDs
          VDI = get (get VBD)?.VDI
          $scope.VDIs.push VDI if VDI?

        container = get VM.$container

        if container.type is 'host'
          host = container
          pool = (get container.poolRef) ? {}
        else
          host = {}
          pool = container

        default_SR = get pool.default_SR
        default_SR = if default_SR
          default_SR.UUID
        else
          ''

        SRs = $scope.SRs = get (merge pool.SRs, host.SRs)
        # compute writable accessible SR from this VM
        $scope.writable_SRs = (SR for SR in SRs when SR.content_type isnt 'iso')
    )

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
        $state.go 'home'
        notify.info {
          title: 'VM deletion'
          message: 'VM is removed'
        }

    $scope.saveSnapshot = (id, $data) ->
      snapshot = get (id)

      result = {
        id: snapshot.UUID
        name_label: $data
      }

      if $data isnt snapshot.name_label
        result.name_label = $data

      xoApi.call 'vm.set', result

    $scope.saveVM = ($data) ->
      {VM} = $scope
      {CPUs, memory, name_label, name_description, high_availability} = $data

      $data = {
        id: VM.UUID
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

      xoApi.call 'vm.set', $data

    #-----------------------------------------------------------------
    # Disks
    #-----------------------------------------------------------------

    # TODO: implement in XO-Server.
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
      angular.forEach data, (value, key) ->
        i = key.indexOf '/'
        (disks[key.slice 0, i] ?= {})[key.slice i + 1] = value
        return

      promises = []

      # Handle SR change.
      angular.forEach disks, (attributes, id) ->
        disk = get id
        if attributes.$SR isnt disk.$SR
          promises.push (migrateDisk id, attributes.$SR)

        return

      angular.forEach disks, (attributes, id) ->
        # Keep only changed attributes.
        disk = get id
        angular.forEach attributes, (value, name) ->
          delete attributes[name] if value is disk[name]
          return

        unless isEmpty attributes
          # Inject id.
          attributes.id = id

          # Ask the server to update the object.
          promises.push xoApi.call 'vdi.set', attributes
        return

      return $q.all promises

    $scope.deleteDisk = (UUID) ->
      modal.confirm({
        title: 'Disk deletion'
        message: 'Are you sure you want to delete this disk? This operation is irreversible'
      }).then ->
        xoApi.call 'vdi.delete', {id: UUID}
        return
      return

    #-----------------------------------------------------------------

    $scope.disconnectVBD = (id) ->
      console.log "Disconnect VBD #{id}"

      xo.vbd.disconnect id

    $scope.connectVBD = (id) ->
      console.log "Connect VBD #{id}"

      xo.vbd.connect id

    $scope.deleteVBD = (id) ->
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

    $scope.deleteAllLog = ->
      modal.confirm({
        title: 'Log deletion'
        message: 'Are you sure you want to delete all the logs?'
      }).then ->
        for log in $scope.VM.messages
          console.log "Remove log #{log}"
          xo.log.delete log

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

    $scope.osType = (osName) ->
      switch osName
        when 'debian','ubuntu','centos','suse','redhat','oracle','gentoo','suse','fedora'
          'linux'
        when 'windows'
          'windows'
        else
          'other'

  # A module exports its name.
  .name
