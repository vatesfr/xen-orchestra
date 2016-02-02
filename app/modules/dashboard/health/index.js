import angular from 'angular'
import uiRouter from 'angular-ui-router'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'

import xoApi from 'xo-api'
import xoHorizon from'xo-horizon'
import xoServices from 'xo-services'

import xoWeekHeatmap from'xo-week-heatmap'

import view from './view'

export default angular.module('dashboard.health', [
  uiRouter,
  xoApi,
  xoHorizon,
  xoServices,
  xoWeekHeatmap
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.health', {
      controller: 'Health as ctrl',
      data: {
        requireAdmin: true
      },
      url: '/health',
      template: view
    })
  })

  .controller('Health', function (xo, xoApi, $scope, modal) {
    this.currentVdiPage = 1
    this.currentVmPage = 1

    const {get} = xoApi
    const vms = xoApi.getView('VM-snapshot').all
    const vdis = xoApi.getView('VDI').all
    const srs = xoApi.getView('SR').all

    $scope.$watchCollection(() => vdis, () => {
      const orphanVdiSnapshots = filter(vdis, vdi => vdi && vdi.$snapshot_of && get(vdi.$snapshot_of) === undefined)
      this.orphanVdiSnapshots = orphanVdiSnapshots
    })

    $scope.$watchCollection(() => vms, () => {
      const orphanVmSnapshots = filter(vms, vm => vm.$snapshot_of && get(vm.$snapshot_of) === undefined)
      this.orphanVmSnapshots = orphanVmSnapshots
    })

    $scope.$watchCollection(() => srs, () => {
      const warningSrs = filter(srs, sr => (sr.physical_usage / sr.size) >= 0.8 && (sr.physical_usage / sr.size) < 0.9)
      const dangerSrs = filter(srs, sr => (sr.physical_usage / sr.size) >= 0.9)
      this.warningSrs = warningSrs
      this.dangerSrs = dangerSrs
    })

    this.selectedVdiForDelete = {}
    this.selectedVmForDelete = {}

    this.deleteVdiSnapshot = function (id) {
      modal.confirm({
        title: 'VDI Snapshot deletion',
        message: 'Are you sure you want to delete this snapshot?'
      }).then(() => xo.vdi.delete(id))
    }

    this.deleteVmSnapshot = function (id) {
      modal.confirm({
        title: 'VM Snapshot deletion',
        message: 'Are you sure you want to delete this snapshot? (including its disks)'
      }).then(() => xo.vm.delete(id, true))
    }

    this.deleteSelectedVdis = function () {
      return modal.confirm({
        title: 'VDI snapshot deletion',
        message: 'Are you sure you want to delete all selected VDI snapshots? This operation is irreversible.'
      }).then(function () {
        forEach($scope.selectedVdiForDelete, (selected, id) => selected && xo.vdi.delete(id))
        $scope.selectedVdiForDelete = {}
      })
    }

    this.deleteSelectedVms = function () {
      return modal.confirm({
        title: 'VM snapshot deletion',
        message: 'Are you sure you want to delete all selected VM snapshots? This operation is irreversible.'
      }).then(function () {
        forEach($scope.selectedVmForDelete, (selected, id) => selected && xo.vm.delete(id, true))
        $scope.selectedVmForDelete = {}
      })
    }
  })

  .name
