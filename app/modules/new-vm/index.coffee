angular = require 'angular'
cloneDeep = require 'lodash.clonedeep'
filter = require 'lodash.filter'
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
    bytesToSizeFilter
    notify
  ) ->
    $scope.configDriveActive = false
    existingDisks = {}
    $scope.saveChange = (position, propertyName, value) ->
      if not existingDisks[position]?
        existingDisks[position] = {}
      existingDisks[position][propertyName] = value
    $scope.initExistingValues = (template) ->
      sizes = {}
      forEach xoApi.get(template.$VBDs), (VBD) ->
        sizes[VBD.position] = bytesToSizeFilter xoApi.get(VBD.VDI).size
      $scope.existingDiskSizes = sizes
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
    $scope.memory = ''
    $scope.name_description = ''
    $scope.name_label = ''
    $scope.template = ''
    $scope.firstSR = ''
    $scope.VDIs = []
    $scope.VIFs = []
    $scope.isDiskTemplate = false
    $scope.cloudConfigSshKey = ''

    $scope.addVIF = do ->
      id = 0
      (network = '') ->
        console.log 'Adding network: '
        console.log network
        console.log 'to VIF' + id
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
      $scope.install_repository = template.template_info.install_repository
      availableMethods = $scope.availableMethods = Object.create null
      for method in install_methods
        availableMethods[method] = true
      if install_methods.length is 1 # FIXME: does not work with network.
        $scope.installation_method = install_methods[0]
      else
        delete $scope.installation_method


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
      # if the template is labeled CoreOS
      # we'll use config drive setup
      if template.name_label == 'CoreOS'
        return xo.vm.getCloudInitConfig template.id
          .then (result) ->
            $scope.coreOsCloudConfig = result

    $scope.createVM = ->
      {
        CPUs
        pv_args
        install_repository
        installation_cdrom
        installation_method
        installation_network
        memory
        name_description
        name_label
        template
        VDIs
        VIFs
      } = $scope
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

        # Removes the MAC address if empty.
        if 'MAC' of VIF
          VIF.MAC = VIF.MAC.trim()
          delete VIF.MAC unless VIF.MAC


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
      else if install_repository
        matches = /^(http|ftp|nfs)/i.exec install_repository
        throw new Error 'invalid network URL' unless matches
        installation = {
          method: matches[1].toLowerCase()
          repository: install_repository
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
      xoApi.call('vm.create', data).then (id) ->
        # If nothing to sets, just stops.
        return id unless CPUs or name_description or memory

        data = {
          id
        }
        data.CPUs = +CPUs if CPUs

        if name_description
          data.name_description = name_description

        if pv_args
          data.pv_args = pv_args

        if memory
          # FIXME: handles invalid entries.
          data.memory = memory
        return xoApi.call('vm.set', data).then -> id
      .then (id) ->
        # If a CloudConfig drive needs to be created
        if $scope.coreOsCloudConfig
          # Use the CoreOS specific Cloud Config creation
          xo.vm.createCloudInitConfigDrive(id, $scope.firstSR, $scope.coreOsCloudConfig, true).then ->
            xo.docker.register id
        if $scope.configDriveActive
          # User creation is less universal...
          # $scope.cloudContent = '#cloud-config\nhostname: ' + name_label + '\nusers:\n  - name: olivier\n    sudo: ALL=(ALL) NOPASSWD:ALL\n    groups: sudo\n    shell: /bin/bash\n    ssh_authorized_keys:\n      - ' + $scope.cloudConfigSshKey + '\n'
          # So keep it basic for now: hostname and ssh key
          $scope.cloudContent = '#cloud-config\nhostname: ' + name_label + '\nssh_authorized_keys:\n  - ' + $scope.cloudConfigSshKey + '\n'
          # The first SR for a template with an existing disk
          $scope.firstSR = (get (get template.$VBDs[0]).VDI).$SR
          # Use the generic CloudConfig creation
          xo.vm.createCloudInitConfigDrive(id, $scope.firstSR, $scope.cloudContent)

        # Send the client on the VM view
        $state.go 'VMs_view', { id }
      .catch (error) ->
        notify.error {
          title: 'VM creation'
          message: 'The creation failed'
        }

        console.log error

  # A module exports its name.
  .name
