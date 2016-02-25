angular = require 'angular'
forEach = require('lodash.foreach')
includes = require('lodash.includes')
Clipboard = require('clipboard')

isoDevice = require('iso-device').default

#=====================================================================

module.exports = angular.module 'xoWebApp.console', [
  require 'angular-ui-router'
  require('angular-no-vnc').default

  isoDevice
]
  .config ($stateProvider) ->
    $stateProvider.state 'consoles_view',
      url: '/consoles/:id'
      controller: 'ConsoleCtrl'
      template: require './view'
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoApi, xo, xoHideUnauthorizedFilter, modal) ->
    {id} = $stateParams
    {get} = xoApi

    pool = null
    host = null
    do (
      srsByContainer = xoApi.getIndex('srsByContainer')
      poolSrs = null
      hostSrs = null
    ) ->
      updateSrs = () =>
        srs = []
        poolSrs and forEach(poolSrs, (sr) => srs.push(sr))
        hostSrs and forEach(hostSrs, (sr) => srs.push(sr))
        $scope.SRs = xoHideUnauthorizedFilter(srs)
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

    $scope.$watch(
      -> xoApi.get id
      (VM) ->
        $scope.consoleUrl = null

        unless xoApi.user
          $scope.VDIs = []
          return

        $scope.VM = VM
        return unless (
          VM? and
          VM.power_state is 'Running' and
          not includes(VM.current_operations, 'clean_reboot')
        )

        pool = get VM.$poolId
        return unless pool

        $scope.consoleUrl = "./api/consoles/#{id}"

        host = get VM.$container # host because the VM is running.
    )

    $scope.startVM = xo.vm.start
    $scope.stopVM = (id) ->
      modal.confirm
        title: 'VM shutdown'
        message: 'Are you sure you want to shutdown this VM ?'
      .then ->
        xo.vm.stop id
    $scope.rebootVM = (id) ->
      modal.confirm
        title: 'VM reboot'
        message: 'Are you sure you want to reboot this VM ?'
      .then ->
        xo.vm.restart id

    $scope.eject = ->
      xo.vm.ejectCd id
    $scope.insert = (disc_id) ->
      xo.vm.insertCd id, disc_id, true

    $scope.vmClipboard = ''
    $scope.setClipboard = (text) ->
      $scope.vmClipboard = text
      $scope.$applyAsync()

    $scope.shutdownHost = (id) ->
      modal.confirm({
        title: 'Shutdown host'
        message: 'Are you sure you want to shutdown this host?'
      }).then ->
        xo.host.stop id

    $scope.rebootHost = (id) ->
      modal.confirm({
        title: 'Reboot host'
        message: 'Are you sure you want to reboot this host? It will be disabled then rebooted'
      }).then ->
        xo.host.restart id

    $scope.startHost = (id) ->
      xo.host.start id

    clipboard = new Clipboard('.copy')
    clipboard.on('error', (e) -> console.log('Clipboard', e))

  # A module exports its name.
  .name
