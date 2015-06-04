angular = require 'angular'
forEach = require('lodash.foreach')
includes = require('lodash.includes')

isoDevice = require('../iso-device')

#=====================================================================

module.exports = angular.module 'xoWebApp.console', [
  require 'angular-ui-router'
  require 'angular-no-vnc'

  isoDevice
]
  .config ($stateProvider) ->
    $stateProvider.state 'consoles_view',
      url: '/consoles/:id'
      controller: 'ConsoleCtrl'
      template: require './view'
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoApi, xo, xoHideUnauthorizedFilter) ->
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
    $scope.stopVM = xo.vm.stop
    $scope.rebootVM = xo.vm.restart

    $scope.eject = ->
      xo.vm.ejectCd id
    $scope.insert = (disc_id) ->
      xo.vm.insertCd id, disc_id, true

  # A module exports its name.
  .name
