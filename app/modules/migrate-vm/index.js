import angular from 'angular'
import forEach from 'lodash.foreach'
import find from 'lodash.find'

import uiBootstrap from 'angular-ui-bootstrap'

import xoServices from 'xo-services'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.migrateVm', [
  uiBootstrap,
  xoServices
])
  .controller('MigrateVmCtrl', function (
    $scope,
    $modalInstance,
    xoApi,
    VDIs,
    srsOnTargetPool,
    srsOnTargetHost,
    VIFs,
    networks,
    defaults,
    intraPoolMigration
  ) {
    $scope.VDIs = VDIs
    $scope.SRs = srsOnTargetPool.concat(srsOnTargetHost)
    $scope.VIFs = VIFs
    $scope.networks = networks
    $scope.intraPoolMigration = intraPoolMigration

    $scope.selected = {}

    $scope.selected.migrationNetwork = defaults.network

    $scope.selected.vdi = {}
    forEach($scope.VDIs, (vdi) => {
      $scope.selected.vdi[vdi.id] = defaults.sr
    })

    if (!intraPoolMigration) {
      $scope.selected.vif = {}
      forEach($scope.VIFs, (vif) => {
        const network = find($scope.networks, (network) => network.name_label === xoApi.get(vif.$network).name_label)
        $scope.selected.vif[vif.id] = network
          // Try to find a target network with the same name
          ? network.id
          // Otherwise the default network
          : defaults.network
      })
    }

    $scope.migrate = function () {
      $modalInstance.close($scope.selected)
    }
  })
  .service('migrateVmModal', function ($modal, xo, xoApi) {
    return function (state, id, hostId, VDIs, srsOnTargetPool, srsOnTargetHost, VIFs, networks, defaults, intraPoolMigration) {
      return $modal.open({
        controller: 'MigrateVmCtrl',
        template: view,
        resolve: {
          VDIs: () => VDIs,
          srsOnTargetPool: () => srsOnTargetPool,
          srsOnTargetHost: () => srsOnTargetHost,
          VIFs: () => VIFs,
          networks: () => networks,
          defaults: () => defaults,
          intraPoolMigration: () => intraPoolMigration
        }
      }).result.then(function (selected) {
        let isAdmin = xoApi.user && (xoApi.user.permission === 'admin')
        state.go(isAdmin ? 'tree' : 'list')
        return xo.vm.migrate(id, hostId, selected.vdi, intraPoolMigration ? undefined : selected.vif, selected.migrationNetwork)
      })
    }
  })
  // A module exports its name.
  .name
