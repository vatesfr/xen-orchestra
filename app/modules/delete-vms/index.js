// TODO: should be integrated xo.deleteVms()

import angular from 'angular'
import forEach from 'lodash.foreach'
import uiBootstrap from 'angular-ui-bootstrap'

import xoServices from 'xo-services'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.deleteVms', [
  uiBootstrap,

  xoServices
])
  .controller('DeleteVmsCtrl', function (
    $scope,
    $modalInstance,
    xoApi,
    VMsIds
  ) {
    $scope.$watchCollection(() => xoApi.get(VMsIds), function (VMs) {
      $scope.VMs = VMs
    })

    // Do disks have to be deleted for a given VM.
    let disks = $scope.disks = {}
    forEach(VMsIds, id => {
      disks[id] = true
    })

    $scope.delete = function () {
      let value = []
      forEach(VMsIds, id => {
        value.push([id, disks[id]])
      })

      $modalInstance.close(value)
    }
  })
  .service('deleteVmsModal', function ($modal, xo) {
    return function (ids) {
      return $modal.open({
        controller: 'DeleteVmsCtrl',
        template: view,
        resolve: {
          VMsIds: () => ids
        }
      }).result.then(function (toDelete) {
        let promises = []

        forEach(toDelete, ([id, deleteDisks]) => {
          promises.push(xo.vm.delete(id, deleteDisks))
        })

        return promises
      })
    }
  })
  // A module exports its name.
  .name
