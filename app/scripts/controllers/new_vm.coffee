'use strict'

angular.module('xoWebApp')
  .controller 'NewVmCtrl', (
    $scope, $stateParams, $state
    xoApi, xo
    bytesToSizeFilter, sizeToBytesFilter
    notify
  ) ->
    {get} = xo

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
    $scope.$watch(
      -> xo.revision
      ->
        container = $scope.container = get $stateParams.container

        # If the container was not found, no need to continue.
        return unless container?

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

        # Computes the list of templates.
        $scope.templates = get (merge pool.templates, host.templates)

        # FIXME: We should filter on connected SRs (PBDs)!
        # Computes the list of SRs.
        SRs = get (merge pool.SRs, host.SRs)

        # Computes the list of ISO SRs.
        $scope.ISO_SRs = (SR for SR in SRs when SR.content_type is 'iso')

        # Computes the list of writable SRs.
        $scope.writable_SRs = (SR for SR in SRs when SR.content_type isnt 'iso')

        # Computes the list of networks.
        $scope.networks = get pool.networks
    )

    $scope.availableMethods = {}
    $scope.CPUs = ''
    $scope.installation_cdrom = ''
    $scope.installation_method = ''
    $scope.installation_network = ''
    $scope.memory = ''
    $scope.name_description = ''
    $scope.name_label = ''
    $scope.template = ''
    $scope.VDIs = []
    $scope.VIFs = []

    $scope.addVIF = do ->
      id = 0
      ->
        $scope.VIFs.push {
          id: id++
          network: ''
        }
    $scope.addVIF()

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

      {install_methods} = template.template_info
      availableMethods = $scope.availableMethods = Object.create null
      for method in install_methods
        availableMethods[method] = true
      if install_methods.length is 1 # FIXME: does not work with network.
        $scope.installation_method = install_methods[0]
      else
        delete $scope.installation_method


      VDIs = $scope.VDIs = angular.copy template.template_info.disks
      for VDI in VDIs
        VDI.id = VDI_id++
        VDI.size = bytesToSizeFilter VDI.size
        VDI.SR or= default_SR

    $scope.createVM = ->
      {
        CPUs
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
      VDIs = angular.copy VDIs
      for VDI, index in VDIs
        # Removes the dummy identifier used for AngularJS.
        delete VDI.id

        # Adds the device number based on the index.
        VDI.device = "#{index}"

        # Transforms the size from human readable format to bytes.
        VDI.size = sizeToBytesFilter VDI.size
        # TODO: handles invalid values.

      # Does not edit the displayed data directly.
      VIFs = angular.copy VIFs
      for VIF in VIFs
        # Removes the dummy identifier used for AngularJS.
        delete VIF.id

        # Removes the MAC address if empty.
        if 'MAC' of VIF
          VIF.MAC = VIF.MAC.trim()
          delete VIF.MAC unless VIF.MAC


      if installation_method is 'cdrom'
        installation = {
          method: 'cdrom'
          repository: installation_cdrom
        }
      else installation_network
        matches = /^(http|ftp|nfs)/i.exec installation_network
        throw new Error'invalid installation method' unless matches
        installation = {
          method: matches[1].toLowerCase()
          repository: installation_network
        }
      else
        installation = null

      data = {
        installation
        name_label
        template: template.UUID
        VDIs
        VIFs
      }

      # TODO:
      # - disable the form during creation
      # - indicate the progress of the operation
      xoApi.call('vm.create', data).then (id) ->
        # If nothing to sets, just stops.
        return id unless CPUs or name_description or memory

        data = {
          id
        }
        data.CPUs = +CPUs if CPUs

        if name_description
          data.name_description = name_description

        if memory
          memory = sizeToBytesFilter memory
          # FIXME: handles invalid entries.
          data.memory = memory

        xoApi.call('vm.set', data).then -> id
      .then (id) ->
        $state.go 'VMs_view', { id }
      .catch (error) ->
        notify.error {
          title: 'VM creation'
          message: 'The creation failed'
        }

        console.log error
