import angular from 'angular';
import isEmpty from 'isempty';
import uiRouter from 'angular-ui-router';

import Bluebird from 'bluebird';

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
  .controller('SrCtrl', function ($scope, $stateParams, $state, $q, notify, xoApi, xo, modal) {
    let {get} = xo;
    $scope.$watch(() => xo.get($stateParams.id), function (SR) {
      $scope.SR = SR;
    });

    $scope.saveSR = function ($data) {
      let {SR} = $scope;
      let {name_label, name_description} = $data;

      $data = {
        id: SR.UUID,
      };
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
      });
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

        xoApi.call('pbd.connect', {id: pbd.ref});
      }
    };

    $scope.disconnectAllHosts = function () {
      return modal.confirm({
        title: 'Disconnect hosts',
        message: 'Are you sure you want to disconnect all hosts to this SR?',
      }).then(function () {
        for (let id of $scope.SR.$PBDs) {
          let pbd = xo.get(id);

          xoApi.call('pbd.disconnect', {id: pbd.ref});
          console.log(pbd.ref)
        }
      });
    };

    $scope.rescanSr = function (UUID) {
      console.log('Rescan SR', UUID);

      return xoApi.call('sr.scan', {id: UUID});
    };

    $scope.removeSR = function (UUID) {
      console.log('Remove SR', UUID);

      return modal.confirm({
        title: 'SR deletion',
        message: 'Are you sure you want to delete this SR? This operation is irreversible.',
      }).then(function () {
        return Bluebird.map($scope.SR.$PBDs, pbdId => {
          let pbd = xo.get(pbdId);

          return xoApi.call('pbd.disconnect', { id: pbd.id });
        });
      }).then(function () {
        return xoApi.call('sr.destroy', {id: UUID});
      }).then(function () {
        $state.go('index');
        notify.info({
          title: 'SR remove',
          message: 'SR is removed',
        });
      });
    };

    $scope.forgetSR = function (UUID) {
      console.log('Forget SR', UUID);

      return modal.confirm({
        title: 'SR forget',
        message: 'Are you sure you want to forget this SR? No VDI on this SR will be removed.',
      }).then(function () {
        return Bluebird.map($scope.SR.$PBDs, pbdId => {
          let pbd = xo.get(pbdId);

          return xoApi.call('pbd.disconnect', { id: pbd.id });
        });
      }).then(function () {
        return xoApi.call('sr.forget', {id: UUID});
      }).then(function () {
        $state.go('index');
        notify.info({
          title: 'SR forget',
          message: 'SR is forgotten',
        });
      });
    };

    $scope.saveDisks = function (data) {
      // Group data by disk.
      let disks = {};
      angular.forEach(data, function (value, key) {
        let i = key.indexOf('/');

        let id = key.slice(0, i);
        let prop = key.slice(i + 1);

        (disks[id] || (disks[id] = {}))[prop] = value;
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
