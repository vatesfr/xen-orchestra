angular = require 'angular'
cloneDeep = require 'lodash.clonedeep'
filter = require 'lodash.filter'
forEach = require 'lodash.foreach'
trim = require 'lodash.trim'

#=====================================================================

module.exports = angular.module 'xoWebApp.newVm', [
  require 'angular-ui-router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'VMs_new',
      url: '/vms/new/:container'
      controller: 'NewVmsCtrl as ctrl'
      template: require './view'
  .controller 'NewVmsCtrl', (
    $scope, $stateParams, $state
    xoApi, xo
    bytesToSizeFilter, sizeToBytesFilter
    notify
  ) ->
    $scope.multipleVmsActive = false
    $scope.vmsNames = ['VM1', 'VM2']
    $scope.numberOfVms = 2
    $scope.newNumberOfVms = 2

    $scope.checkNumberOfVms = ->
      if $scope.newNumberOfVms && Number.isInteger($scope.newNumberOfVms)
        $scope.newNumberOfVms = $scope.numberOfVms = Math.min(100,Math.max(2,$scope.newNumberOfVms))
      else
        $scope.newNumberOfVms = $scope.numberOfVms = 2

    $scope.refreshNames = ->
      $scope.defaultName = 'VM'
      $scope.defaultName = $scope.name_label if $scope.name_label
      forEach($scope.vmsNames, (name, index) ->
        $scope.vmsNames[index] = $scope.defaultName + (index+1)
      )

    $scope.toggleBootAfterCreate = ->
      $scope.bootAfterCreate = false if $scope.multipleVmsActive

    $scope.configDriveActive = false
    existingDisks = {}
    $scope.saveChange = (position, propertyName, value) ->
      if not existingDisks[position]?
        existingDisks[position] = {}
      existingDisks[position][propertyName] = value
    $scope.updateVdiSize = (position) ->
      $scope.saveChange(position, 'size', bytesToSizeFilter(sizeToBytesFilter($scope.existingDiskSizeValues[position] + ' ' + $scope.existingDiskSizeUnits[position])))
    $scope.initExistingValues = (template) ->
      $scope.name_label = template.name_label
      sizes = {}
      $scope.existingDiskSizeValues = {}
      $scope.existingDiskSizeUnits = {}
      forEach xoApi.get(template.$VBDs), (VBD) ->
        sizes[VBD.position] = bytesToSizeFilter xoApi.get(VBD.VDI).size
        $scope.existingDiskSizeValues[VBD.position] = parseInt(sizes[VBD.position].split(' ')[0], 10)
        $scope.existingDiskSizeUnits[VBD.position] = sizes[VBD.position].split(' ')[1]
      $scope.VIFs.length = 0
      if template.VIFs.length
        forEach xoApi.get(template.VIFs), (VIF) ->
          network = xoApi.get(VIF.$network)
          $scope.addVIF(network)
          return
      else $scope.addVIF()

    {get} = xoApi
    removeItems = do ->
      splice = Array::splice.call.bind Array::splice
      (array, index, n) -> splice array, index, n ? 1

    merge = do ->
      push = Array::push.apply.bind Array::push
      (args...) ->
        result = []
        for arg in args
          push result, arg if arg?
        result

    pool = default_SR = null
    host = null
    do (
      networks = xoApi.getIndex('networksByPool')
      srsByContainer = xoApi.getIndex('srsByContainer')
      vmTemplatesByContainer = xoApi.getIndex('vmTemplatesByContainer')
      poolSrs = null
      hostSrs = null
      poolTemplates = null
      hostTemplates = null
    ) ->
      Object.defineProperties($scope, {
        networks: {
          get: () => pool && networks[pool.id]
        }
      })
      updateSrs = () =>
        srs = []
        poolSrs and forEach(poolSrs, (sr) => srs.push(sr))
        hostSrs and forEach(hostSrs, (sr) => srs.push(sr))
        $scope.writable_SRs = filter(srs, (sr) => sr.content_type isnt 'iso')
        $scope.ISO_SRs = filter(srs, (sr) => sr.content_type is 'iso')
      updateTemplates = () =>
        templates = []
        poolTemplates and forEach(poolTemplates, (template) => templates.push(template))
        hostTemplates and forEach(hostTemplates, (template) => templates.push(template))
        $scope.templates = templates
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
        () => pool and vmTemplatesByContainer[pool.id],
        (templates) =>
          poolTemplates = templates
          updateTemplates()
      )
      $scope.$watchCollection(
        () => host and vmTemplatesByContainer[host.id],
        (templates) =>
          hostTemplates = templates
          updateTemplates()
      )

    $scope.$watch(
      -> get $stateParams.container
      (container) ->
        $scope.container = container

        # If the container was not found, no need to continue.
        return unless container?

        if container.type is 'host'
          host = container
          pool = (get container.$poolId) ? {}
        else
          host = {}
          pool = container

        default_SR = get pool.default_SR
        default_SR = if default_SR then default_SR.id else ''
    )
    $scope.availableMethods = {}
    $scope.CPUs = ''
    $scope.pv_args = ''
    $scope.installation_cdrom = ''
    $scope.installation_method = ''
    $scope.installation_network = ''
    $scope.memoryValue = null
    $scope.units = ['MiB', 'GiB', 'TiB']
    $scope.memoryUnit = $scope.units[0]
    $scope.name_description = 'Created by XO'
    $scope.name_label = ''
    $scope.template = ''
    $scope.firstSR = ''
    $scope.VDIs = []
    $scope.VIFs = []
    $scope.isDiskTemplate = false
    $scope.cloudConfigSshKey = ''
    $scope.bootAfterCreate = true

    $scope.updateMemoryUnit = (memoryUnit) ->
      $scope.memoryUnit = memoryUnit

    $scope.addVIF = do ->
      id = 0
      (network = '') ->
        $scope.VIFs.push {
          id: id++
          network
        }

    $scope.removeVIF = (index) -> removeItems $scope.VIFs, index

    $scope.moveVDI = (index, direction) ->
      {VDIs} = $scope

      newIndex = index + direction
      [VDIs[index], VDIs[newIndex]] = [VDIs[newIndex], VDIs[index]]

    $scope.removeVDI = (index) -> removeItems $scope.VDIs, index

    VDI_id = 0
    $scope.addVDI = ->
      $scope.VDIs.push {
        id: VDI_id++
        bootable: false
        size: ''
        sizeValue: null
        sizeUnit: $scope.units[0]
        SR: default_SR
        type: 'system'
      }

    # When the selected template changes, updates other variables.
    $scope.$watch 'template', (template) ->
      return unless template
      # After each template change, initialize coreOsCloudConfig to empty
      $scope.coreOsCloudConfig = ''

      # Fetch the PV args
      $scope.pv_args = template.PV_args
      {install_methods} = template.template_info
      availableMethods = $scope.availableMethods = Object.create null
      for method in install_methods
        availableMethods[method] = true
      if install_methods.length is 1 # FIXME: does not work with network.
        $scope.installation_method = install_methods[0]
      else
        delete $scope.installation_method

      delete $scope.installation_method
      delete $scope.installation_network
      # if the template already have a configured install repository
      installRepository = template.template_info.install_repository
      if installRepository
        if installRepository is 'cdrom'
          $scope.installation_method = 'cdrom'
        else
          $scope.installation_network = template.template_info.install_repository
          $scope.installation_method = 'network'

      VDIs = $scope.VDIs = cloneDeep template.template_info.disks
      # if the template has no config disk
      # nor it's Other install media (specific case)
      if VDIs.length is 0 and template.name_label isnt 'Other install media'
        $scope.isDiskTemplate = true
      else $scope.isDiskTemplate = false
      for VDI in VDIs
        VDI.id = VDI_id++
        VDI.SR or= default_SR
        VDI.size = bytesToSizeFilter VDI.size
        VDI.sizeValue = if VDI.size then parseInt(VDI.size.split(' ')[0], 10) else null
        VDI.sizeUnit = VDI.size.split(' ')[1]
      # if the template is labeled CoreOS
      # we'll use config drive setup
      if template.name_label == 'CoreOS'
        return xo.vm.getCloudInitConfig template.id
          .then (result) ->
            $scope.coreOsCloudConfig = result

    $scope.createVMs = ->
      if !$scope.multipleVmsActive
        $scope.createVM($scope.name_label)
        return
      forEach($scope.vmsNames, (name) ->
        $scope.createVM(name)
      )
      # Send the client on the tree view
      $state.go 'tree'

    xenDefaultWeight = 256
    $scope.weightMap = {
      'Quarter (1/4)': xenDefaultWeight / 4,
      'Half (1/2)': xenDefaultWeight / 2,
      'Normal': xenDefaultWeight,
      'Double (x2)': xenDefaultWeight * 2
    }

    $scope.createVM = (name_label) ->
      {
        CPUs
        cpuWeight
        pv_args
        installation_cdrom
        installation_method
        installation_network
        memoryValue
        memoryUnit
        name_description
        template
        VDIs
        VIFs
      } = $scope
      forEach VDIs, (vdi) ->
        vdi.size = bytesToSizeFilter(sizeToBytesFilter(vdi.sizeValue + ' ' + vdi.sizeUnit))
      # Does not edit the displayed data directly.
      VDIs = cloneDeep VDIs
      for VDI, index in VDIs
        # store the first VDI's SR for later use (e.g: coreOsCloudConfig)
        if VDI.id == 0
          $scope.firstSR = VDI.SR or default_SR

        # Removes the dummy identifier used for AngularJS.
        delete VDI.id

        # Adds the device number based on the index.
        VDI.device = "#{index}"

        # TODO: handles invalid values.

      # Does not edit the displayed data directly.
      VIFs = cloneDeep VIFs
      for VIF in VIFs
        # Removes the dummy identifier used for AngularJS.
        delete VIF.id

        # xo-server expects a network id, not the whole object
        VIF.network = VIF.network.id

        # Removes the mac address if empty.
        if 'mac' of VIF
          VIF.mac = trim(VIF.mac)
          delete VIF.mac unless VIF.mac


      if installation_method is 'cdrom'
        installation = {
          method: 'cdrom'
          repository: installation_cdrom
        }
      else if installation_network
        matches = /^(http|ftp|nfs)/i.exec installation_network
        throw new Error 'invalid network URL' unless matches
        installation = {
          method: matches[1].toLowerCase()
          repository: installation_network
        }
      else if installation_method is 'pxe'
        installation = {
          method: 'network'
          repository: 'pxe'
        }
      else
        installation = undefined
      data = {
        installation
        pv_args
        name_label
        template: template.id
        VDIs
        VIFs
        existingDisks
      }
      # TODO:
      # - disable the form during creation
      # - indicate the progress of the operation
      notify.info {
        title: 'VM creation'
        message: 'VM creation started'
      }
      $scope.creatingVM = true
      id = null
      xoApi.call('vm.create', data)
      .then (id_) ->
        id = id_

        # If nothing to sets, just stops.
        return unless CPUs or name_description or memoryValue

        data = {
          id
        }
        data.CPUs = +CPUs if CPUs

        if cpuWeight
          data.cpuWeight = cpuWeight

        if name_description
          data.name_description = name_description

        if pv_args
          data.pv_args = pv_args

        if memoryValue
          # FIXME: handles invalid entries.
          data.memoryValue = memoryValue + ' ' + memoryUnit
        return xoApi.call('vm.set', data)
      .then () ->
        # If a CloudConfig drive needs to be created
        if $scope.coreOsCloudConfig
          # Use the CoreOS specific Cloud Config creation
          return xo.vm.createCloudInitConfigDrive(id, $scope.firstSR, $scope.coreOsCloudConfig, true).then ->
            return xo.docker.register(id)
        if $scope.configDriveActive
          # User creation is less universal...
          # $scope.cloudContent = '#cloud-config\nhostname: ' + name_label + '\nusers:\n  - name: olivier\n    sudo: ALL=(ALL) NOPASSWD:ALL\n    groups: sudo\n    shell: /bin/bash\n    ssh_authorized_keys:\n      - ' + $scope.cloudConfigSshKey + '\n'
          # So keep it basic for now: hostname and ssh key
          hostname = name_label
            # Remove leading and trailing spaces.
            .replace(/^\s+|\s+$/g, '')
            # Replace spaces with '-'.
            .replace(/\s+/g, '-')
          $scope.cloudContent = '#cloud-config\nhostname: ' + hostname + '\nssh_authorized_keys:\n  - ' + $scope.cloudConfigSshKey + '\n'
          # The first SR for a template with an existing disk
          $scope.firstSR = (get (get template.$VBDs[0]).VDI).$SR
          # Use the generic CloudConfig creation
          return xo.vm.createCloudInitConfigDrive(id, $scope.firstSR, $scope.cloudContent).then ->
            # Boot directly on disk
            return xo.vm.setBootOrder({vm: id, order: 'c'})
      .then () ->
        if $scope.bootAfterCreate
          xo.vm.start id
        if !$scope.multipleVmsActive
          # Send the client on the VM view
          $state.go 'VMs_view', { id }
      .catch (error) ->
        notify.error {
          title: 'VM creation'
          message: 'The creation failed'
        }
        $scope.creatingVM = false

        console.log error

  # A module exports its name.
  .name
