'use strict'

angular.module('xoWebApp')
  .controller 'MainCtrl', ($scope, $location, stats, objects) ->
    $scope.stats = stats.stats

    $scope.byUUIDs = objects.byUUIDs
    $scope.hosts = objects.byTypes.host ? {}
    $scope.pools = objects.byTypes.pool ? {}
    $scope.SRs = objects.byTypes.SR ? {}

    # Sets up the view.
    do ->
      $actionBar = $('.action-bar')
      $actionBar.hide()

      nbChecked = 0;
      $('body').on 'change', '.checkbox-vm',  ->
        if @checked
          $actionBar.fadeIn 'fast'
          ++nbChecked
        else
          --nbChecked
          $actionBar.fadeOut 'fast' unless nbChecked

    $scope.goToSR = (uuid) ->
      $location.path "/srs/#{uuid}"

    $scope.goToVM = (uuid) ->
      $location.path "/vms/#{uuid}"

    $scope.checked_VMs = {}
    $scope.selectVMs = ->
      $scope.checked_VMs['1b876103-323d-498b-b5c7-c38f0e4e057b'] = true
