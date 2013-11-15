'use strict'

angular.module('xoWebApp')
  .controller 'PoolCtrl', ($scope) ->
    giga = Math.pow 1024, 3

    $scope.pool = {
      uuid: '843c4b17-7ecf-4102-8696-e0da715e3791'
      type: 'pool'
      name_label: 'Main pool'
      name_description: 'Lorem Ipsum Cloud Dolor'
      default_SR: '81e31c8f-9d84-4fa5-b5ff-174e36cc366f'
      master: 'b52ebcdb-72e0-45f6-8ec8-2c84ca24d0ec'
      HA_enabled: true
      hosts: 4
      running_hosts: 4
      tags: ['Prod', 'Room1']
    }
