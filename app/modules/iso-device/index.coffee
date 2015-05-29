angular = require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.isoDevice', []

  .directive 'isoDevice', -> {
    restrict: 'E'
    template: require './view'
    scope: {
      isos: '='
      vm: '='
    }
    controller: 'IsoDevice as isoDevice'
    bindToController: true
  }

  .controller 'IsoDevice', (xo) ->
    this.eject = (VM) ->
      xo.vm.ejectCd VM.id

    this.insert = (VM, disc_id) ->
      xo.vm.insertCd VM.id, disc_id, true

    return

  # A module exports its name.
  .name
