import angular from 'angular';
import uiRouter from 'angular-ui-router';
import Bluebird from 'bluebird';

import xoServices from 'xo-services';
import 'xo-api';

import view from './view';

//====================================================================

export default angular.module('xoWebApp.newSr', [
  uiRouter,

  xoServices,
  'xo-api'
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_new', {
      url: '/srs/new/:container',
      controller: 'NewSrCtrl as newSr',
      template: view,
    });
  })
  .controller('NewSrCtrl', function ($scope, $state, $stateParams, xo, xoApi, notify) {

    $scope.$watch(() => xo.get($stateParams.container), container => {
      this.container = container;
    });

    this.data = {};

    this.populateSettings = function (type, server, auth, user, password) {

      this.data = {};
      this.loading = true;

      if ('NFS' === type || 'NFS_ISO' === type) {

        xoApi.call('sr.probeNfs', {
          host: this.container.UUID,
          server
        })
        .then(response => this.data.paths = response)
        .catch(error => notify.warning({
          title : 'ProbeNfs',
          message : error.message
        }))
        .finally(() => this.loading = false)
        ;

      } else if ('iSCSI' === type) {

        let params = {
          host: this.container.UUID
        };

        if (auth) {
          params.chapUser = user;
          params.chapPassword = password;
        }

        server = this._parseAddress(server);

        params.target = server.host;
        if (server.port) {
          params.port = server.port;
        }

        xoApi.call('sr.probeIscsiIqns', params)
        .then(response => {

          if (response.length > 0) {
            this.data.iqns = response;
          } else {
            notify.warning({
              title : 'probeIscsiIqns',
              message : 'No Iqns found'
            });
          }

        })
        .catch(error => notify.warning({
          title : 'probeIscsiIqns',
          message : error.message
        }))
        .finally(() => this.loading = false)
        ;

      } else {

        this.loading = false;

      }

    };

    this.populateIScsiIds = function (iqn, auth, user, password) {

      delete this.data.iScsiIds;
      this.loading = true;

      let params = {
        host: this.container.UUID,
        target: iqn.ip,
        targetIqn: iqn.iqn
      };

      if (auth) {
        params.chapUser = user;
        params.chapPassword = password;
      }

      xoApi.call('sr.probeIscsiLuns', params)
        .then(response => this.data.iScsiIds = response)
        .catch(error => notify.warning({
          title : 'probeIscsiLuns',
          message : error.message
        }))
        .finally(() => this.loading = false)
        ;

    };

    this._parseAddress = function (address) {
      let index = address.indexOf(':');
      let port = false;
      let host = address;
      if (-1 < index) {
        port = address.substring(index + 1);
        host = address.substring(0, index);
      }
      return {
        host,
        port
      };
    };

    this.createSR = function (data) {

      let server = this._parseAddress(data.srServer || '');

      switch(data.srType) {
        case 'NFS':
          xoApi.call('sr.createNfs', {
            host: this.container.UUID,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            server: server.host,
            serverPath: data.srPath.path
          })
          .then(id => {
            $state.go('SRs_view', {id});
          })
          .catch(error => {
            notify.error({
              title : 'createNfs',
              message : error.message
            });
          })
          ;
          break;
        case 'iSCSI':

          let params = {
            host: this.container.UUID,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            target: data.srIqn.ip,
            targetIqn: data.srIqn.iqn,
            scsiId: data.srIScsiId.scsiId
          };

          if (data.srAuth) {
            params.chapUser = data.srChapUser;
            params.chapPassword = data.srChapPassword;
          }

          if (server.port) {
            params.port = server.port;
          }

          xoApi.call('sr.createIscsi', params)
          .then(id => {
            $state.go('SRs_view', {id});
          })
          .catch(error => {
            notify.error({
              title : 'createIscsi',
              message : error.message
            });
          })
          ;
          break;
        case 'NFS_ISO':
        case 'Local':

          let path = (('NFS_ISO' === data.srType) ?
            server.host + ':' :
            '') + data.srPath.path;

          xoApi.call('sr.createIso', {
            host: this.container.UUID,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            path
          })
          .then(id => {
            $state.go('SRs_view', {id});
          })
          .catch(error => {
            notify.error({
              title : 'createNfs',
              message : error.message
            });
          })
          ;
          break;
        default:
          notify.error({
              title : 'Error',
              message : 'Unhanled SR Type'
            });
          break;
      }

    };

  })

  // A module exports its name.
  .name
;
