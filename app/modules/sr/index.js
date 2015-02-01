import angular from 'angular';
import isEmpty from 'isempty';
import uiRouter from 'angular-ui-router';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.sr', [
  uiRouter,
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_view', {
      url: '/srs/:id',
      controller: 'SrCtrl',
      template: view,
    });
  })
  .controller('SrCtrl', function ($scope, $stateParams, $q, xoApi, xo, modal) {
    let {get} = xo;
    $scope.$watch(() => xo.revision, function () {
      $scope.SR = xo.get($stateParams.id);
    });

    $scope.saveSR = function ($data) {
      let {SR} = $scope;
      let {name_label, name_description} = $data;

      $data = {
        id: SR.UUID,
      }
      if (name_label !== SR.name_label) {
        $data.name_label = name_label;
      }
      if (name_description !== SR.name_description) {
        $data.name_description = name_description;
      }

      return xoApi.call('sr.set', $data);
    };

    $scope.deleteVDI = function (UUID) {
      console.log('Delete VDI', UUID);

      return modal.confirm({
        title: 'VDI deletion',
        message: 'Are you sure you want to delete this VDI? This operation is irreversible.',
      }).then(function () {
        return xo.vdi.delete(UUID);
      })
    };

    $scope.disconnectVBD = function (UUID) {
      console.log('Disconnect VBD', UUID);

      return xoApi.call('vbd.disconnect', {id: UUID});
    };

    $scope.connectPBD = function (UUID) {
      console.log('Connect PBD', UUID);

      return xoApi.call('pbd.connect', {id: UUID});
    };

    $scope.disconnectPBD = function (UUID) {
      console.log('Disconnect PBD', UUID);

      return xoApi.call('pbd.disconnect', {id: UUID});
    };

    $scope.reconnectAllHosts = function () {
      // TODO: return a Bluebird.all(promises).
      for (let id of $scope.SR.$PBDs) {
        let pbd = xo.get(id);
      }

      return xoApi.call('pbd.connect', pbd.ref);
    };

    $scope.rescanSr = function (UUID) {
      console.log('Rescan SR', UUID);

      return xoApi.call('sr.scan', {id: UUID});
    };

    $scope.saveDisks = function (data) {
      // Group data by disk.
      let disks = {};
      angular.forEach(data, function (value, key) {
        let i = key.indexOf('/');
        (disks[key.slice 0, i] ?= {})[key.slice i + 1] = value
        return;
      });

      let promises = [];
      angular.forEach(disks, function (attributes, id) {
        // Keep only changed attributes.
        let disk = get(id);

        angular.forEach(attributes, function (value, name) {
          if (value === disk[name]) {
            delete attributes[name];
          }
        });

        if (!isEmpty(attributes)) {
          // Inject id.
          attributes.id = id;

          // Ask the server to update the object.
          promises.push(xoApi.call('vdi.set', attributes));
        }
      });

      return $q.all(promises);
    };
  })

  // A module exports its name.
  .name
;
