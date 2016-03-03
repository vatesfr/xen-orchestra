angular = require 'angular'
cloneDeep = require 'lodash.clonedeep'
filter = require 'lodash.filter'
forEach = require 'lodash.foreach'
trim = require 'lodash.trim'
includes = require 'lodash.includes'
forEach = require 'lodash.foreach'

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
    $scope.min = Math.min

    user = xoApi.user
    $scope.isAdmin = user.permission == 'admin'

    userGroups = user.groups

    if !$scope.isAdmin
      $scope.resourceSets = []
      $scope.userResourceSets = []
      $scope.resourceSet = ''
      xo.resourceSet.getAll()
      .then (sets) ->
        $scope.resourceSets = sets
        $scope.resourceSet = $scope.resourceSets[0]
        $scope.updateResourceSet($scope.resourceSet)

    $scope.updateResourceSet = (resourceSet) ->
      $scope.resourceSet = resourceSet
      $scope.template = ''
      $scope.templates = []
      $scope.writable_SRs = []
      $scope.ISO_SRs = []
      srs = []
      $scope.resourceSetNetworks = []
      $scope.pools = []
      forEach $scope.resourceSet.objects, (id) ->
        obj = xoApi.get id
        if obj.type is 'VM-template'
          $scope.templates.push(obj)
        else if obj.type is 'SR'
          srs.push(obj)
        else if obj.type is 'network'
          $scope.resourceSetNetworks.push(obj)
      $scope.writable_SRs = filter(srs, (sr) => sr.content_type isnt 'iso')
      $scope.ISO_SRs = filter(srs, (sr) => sr.content_type is 'iso')

    $scope.multipleVmsActive = false
    $scope.vmsNames = ['VM1', 'VM2']
    $scope.numberOfVms = 1
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
      $scope.updateTotalDiskBytes()
    $scope.initExistingValues = (template) ->
      $scope.name_label = template.name_label
      sizes = {}
      $scope.templateVBDs = []
      $scope.existingDiskSizeValues = {}
      $scope.existingDiskSizeUnits = {}
      forEach xoApi.get(template.$VBDs), (VBD) ->
        if VBD.is_cd_drive or not VBD.VDI? or not (VDI = xoApi.get(VBD.VDI))?
          return
        $scope.templateVBDs.push(VBD)

        sizes[VBD.position] = bytesToSizeFilter VDI.size
        $scope.existingDiskSizeValues[VBD.position] = +sizes[VBD.position].split(' ')[0]
        $scope.existingDiskSizeUnits[VBD.position] = sizes[VBD.position].split(' ')[1]
      $scope.VIFs.length = 0
      if template.VIFs.length
        forEach xoApi.get(template.VIFs), (VIF) ->
          network = xoApi.get(VIF.$network)
          $scope.addVIF(network)
          return
      else $scope.addVIF()
      $scope.memory = template.memory.size

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
    poolHosts = null
    hostsSrs = null
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

      $scope.updateSrs = () =>
        srs = []
        $scope.selectedLocalSrs = {}
        Object.defineProperty($scope.selectedLocalSrs, "size", {
          value: 0,
          writable: true,
          enumerable: false
        })
        $scope.forcedHost = undefined
        poolSrs and forEach(poolSrs, (sr) => srs.push(sr))
        hostSrs and forEach(hostSrs, (sr) => srs.push(sr))
        poolHosts and forEach(poolHosts, (host) =>
          forEach(hostsSrs[host.id], (sr) ->
            srs.push(sr))
        )
        if pool or $scope.resourceSet
          selectedSrs = []
          forEach($scope.templateVBDs, (vbd) ->
            selectedSrs.push(xoApi.get(vbd.VDI).$SR)
          )
          forEach($scope.VDIs, (vdi) ->
            selectedSrs.push(vdi.SR)
          )
          if $scope.resourceSet
            forEach(selectedSrs, (sr) ->
              sr = xoApi.get sr
              container = xoApi.get sr.$container
              if container.type is 'host'
                if not $scope.selectedLocalSrs[sr.$container]
                  $scope.selectedLocalSrs[sr.$container] = []
                  $scope.selectedLocalSrs.size++
                  $scope.forcedHost = sr.$container
                if not includes($scope.selectedLocalSrs[sr.$container], sr.id)
                  $scope.selectedLocalSrs[sr.$container].push(sr.id)
            )
          else
            forEach(poolHosts, (host) ->
              forEach(hostsSrs[host.id], (sr) ->
                if includes(selectedSrs, sr.id)
                  if not $scope.selectedLocalSrs[host.id]
                    $scope.selectedLocalSrs[host.id] = []
                    $scope.selectedLocalSrs.size++
                    $scope.forcedHost = host.id
                  if not includes($scope.selectedLocalSrs[host.id], sr.id)
                    $scope.selectedLocalSrs[host.id].push(sr.id)
              )
            )
        if not $scope.resourceSet
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
          $scope.updateSrs()
      )
      $scope.$watchCollection(
        () => host and srsByContainer[host.id],
        (srs) =>
          hostSrs = srs
          $scope.updateSrs()
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
          poolHosts = []
          hostsSrs = {}
        else
          host = {}
          pool = container
          objects = filter(xoApi.all, (obj) -> obj.type is 'host' or obj.type is 'SR')
          poolHosts = filter(objects, (obj) -> obj.type is 'host' and obj.$poolId is pool.id)
          hostsSrs = {}
          forEach(poolHosts, (host) ->
            hostsSrs[host.id] = filter(objects, (obj) -> obj.type is 'SR' and obj.$container is host.id)
          )

        default_SR = get pool.default_SR
        default_SR = if default_SR then default_SR.id else ''
    )
    $scope.availableMethods = {}
    $scope.CPUs = ''
    $scope.pv_args = ''
    $scope.installation_cdrom = ''
    $scope.installation_method = ''
    $scope.installation_network = ''
    $scope.memory = null
    $scope.memoryValue = null
    $scope.units = ['MiB', 'GiB', 'TiB']
    $scope.memoryUnit = $scope.units[1]
    $scope.name_description = 'Created by XO'
    $scope.name_label = ''
    $scope.template = ''
    $scope.totalDiskBytes = 0
    $scope.firstSR = ''
    $scope.VDIs = []
    $scope.VIFs = []
    $scope.isDiskTemplate = false
    $scope.cloudConfigSshKey = ''
    $scope.cloudConfigCustom = '#cloud-config\n#hostname: myhostname\n#ssh_authorized_keys:\n#  - ssh-rsa <myKey>\n#packages:\n#  - htop\n'
    $scope.cloudConfigLoading = false
    $scope.cloudConfigError = false
    $scope.bootAfterCreate = true

    $scope.updateMemory = ->
      if $scope.memoryValue
        $scope.memory = sizeToBytesFilter $scope.memoryValue + ' ' + $scope.memoryUnit
      else
        $scope.memory = $scope.template.memory.size
    $scope.updateMemoryUnit = (memoryUnit) ->
      $scope.memoryUnit = memoryUnit
      $scope.updateMemory()

    $scope.updateTotalDiskBytes = ->
      $scope.totalDiskBytes = 0
      forEach $scope.existingDiskSizeValues, (value, key) ->
        $scope.totalDiskBytes += sizeToBytesFilter value + ' ' + $scope.existingDiskSizeUnits[key]
      forEach $scope.VDIs, (VDI) ->
        $scope.totalDiskBytes += (sizeToBytesFilter VDI.sizeValue + ' ' + VDI.sizeUnit) || 0

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

    $scope.removeVDI = (index) ->
      removeItems $scope.VDIs, index
      $scope.updateTotalDiskBytes()

    VDI_id = 0
    $scope.addVDI = ->
      $scope.VDIs.push {
        id: VDI_id++
        bootable: false
        name_label: $scope.name_label + '_disk' + (VDI_id - 1)
        name_description: 'Created by XO'
        size: ''
        sizeValue: ''
        sizeUnit: $scope.units[1]
        SR: default_SR || $scope.writable_SRs[0] && $scope.writable_SRs[0].id
        type: 'system'
      }
      $scope.updateSrs()

    $scope.$watch('name_label', (newName, oldName) ->
      forEach $scope.VDIs, (vdi, index) ->
        if vdi.name_label is oldName + '_disk' + index
          vdi.name_label = newName + '_disk' + index
    )

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
      forEach VDIs, (vdi, index) ->
        vdi.name_label = $scope.name_label + '_disk' + index
        vdi.name_description = 'Created by XO'

      # if the template has no config disk
      # nor it's Other install media (specific case)
      if VDIs.length is 0 and template.name_label isnt 'Other install media'
        $scope.isDiskTemplate = true
      else $scope.isDiskTemplate = false
      for VDI in VDIs
        VDI.id = VDI_id++
        VDI.SR or= default_SR || $scope.writable_SRs[0] && $scope.writable_SRs[0].id
        VDI.size = bytesToSizeFilter VDI.size
        VDI.sizeValue = if VDI.size then +VDI.size.split(' ')[0] else null
        VDI.sizeUnit = VDI.size.split(' ')[1]
      # if the template is labeled CoreOS
      # we'll use config drive setup
      if template.name_label == 'CoreOS'
        return xo.vm.getCloudInitConfig template.id
          .then (result) ->
            $scope.coreOsCloudConfig = result
      $scope.updateTotalDiskBytes()
      $scope.updateSrs()

    $scope.uploadCloudConfig = (file) ->
      $scope.cloudConfigError = false
      return unless file
      reader = new FileReader()
      reader.onerror = () ->
        $scope.cloudConfigError = true
      reader.onload = (event) ->
        $scope.cloudConfigCustom = event.target.result
      reader.onloadend = (event) ->
        $scope.cloudConfigLoading = false
      if file.size > 2e6
        reader.onerror()
        return
      $scope.cloudConfigLoading = true
      reader.readAsText(file)

    $scope.createVMs = ->
      if !$scope.multipleVmsActive
        $scope.createVM($scope.name_label)
        return
      forEach($scope.vmsNames, (name) ->
        $scope.createVM(name)
      )
      # Send the client on the tree view
      $state.go 'index'

    xenDefaultWeight = 256
    $scope.weightMap = {
      'Quarter (1/4)': xenDefaultWeight / 4,
      'Half (1/2)': xenDefaultWeight / 2,
      'Normal': xenDefaultWeight,
      'Double (x2)': xenDefaultWeight * 2
    }

    $scope.createVM = (name_label) ->
      {
        resourceSet
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

        # Default VDI name and description
        VDI.name_label = VDI.name_label || name_label + '_disk' + index
        VDI.name_description = VDI.name_description || 'Created by XO'

        # TODO: handles invalid values.

      forEach existingDisks, (disk, index) ->
        if disk.name_label is ''
          delete disk.name_label
        if disk.name_description is ''
          delete disk.name_description

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
        resourceSet: resourceSet && resourceSet.id
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
          data.memory = memoryValue + ' ' + memoryUnit
        return xo.vm.set(data)
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
          if $scope.configDriveMethod == 'standard'
            $scope.cloudContent = '#cloud-config\nhostname: ' + hostname + '\nssh_authorized_keys:\n  - ' + $scope.cloudConfigSshKey + '\n'
          else
            $scope.cloudContent = $scope.cloudConfigCustom
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
          if resourceSet
            # FIXME When using self service, ACL permissions are not updated fast enough to access VM view right after creation
            $state.go 'index'
          else
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
