angular = require 'angular'

contains = require('lodash.contains')

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
      xo.vm.ejectCd VM.UUID

    this.insert = (VM, disc_id) ->
      xo.vm.insertCd VM.UUID, disc_id, true

  # A module exports its name.
  .name
