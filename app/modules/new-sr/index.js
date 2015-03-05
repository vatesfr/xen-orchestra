import angular from 'angular';
import uiRouter from 'angular-ui-router';
import Bluebird from 'bluebird';

import view from './view';
import _indexOf from 'lodash.indexof';

//====================================================================

export default angular.module('xoWebApp.newSr', [
  uiRouter
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_new', {
      url: '/srs/new/:container',
      controller: 'NewSrCtrl as newSr',
      template: view,
    });
  })
  .controller('NewSrCtrl', function ($scope, $state, $stateParams, xo, xoApi, notify, modal, bytesToSizeFilter) {

    this.reset = function () {

      this.data = {};
      delete this.lockCreation;

    };

    this.resetLists = function() {

      delete this.data.nfsList;
      delete this.data.scsiList;
      delete this.lockCreation;

      this.resetErrors();

    };

    this.resetErrors = function () {

      delete this.data.error;

    };

    /*
     * Loads NFS paths and iScsi iqn`s
     */
    this.populateSettings = function (type, server, auth, user, password) {

      this.reset();
      this.loading = true;

      server = this._parseAddress(server);

      if ('NFS' === type || 'NFS_ISO' === type) {

        xoApi.call('sr.probeNfs', {
          host: this.container.UUID,
          server: server.host
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

    /*
     * Loads iScsi LUNs
     */
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
        .then(response => {

          response.forEach(item => {
            item.display = 'LUN ' + item.id + ': ' +
            item.serial + ' ' + bytesToSizeFilter(item.size) +
            ' (' + item.vendor +  ')';
          });

          this.data.iScsiIds = response;
        })
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

    this._prepareNfsParams = function (data) {

      let server = this._parseAddress(data.srServer);

      let params = {
        host: this.container.UUID,
        nameLabel: data.srName,
        nameDescription: data.srDesc,
        server: server.host,
        serverPath: data.srPath.path
      };

      return params;

    };

    this._prepareScsiParams = function(data) {

      let params = {
        host: this.container.UUID,
        nameLabel: data.srName,
        nameDescription: data.srDesc,
        target: data.srIqn.ip,
        targetIqn: data.srIqn.iqn,
        scsiId: data.srIScsiId.scsiId,
      };

      let server = this._parseAddress(data.srServer);
      if (server.port) {
        params.port = server.port;
      }
      if (data.srAuth) {
        params.chapUser = data.srChapUser;
        params.chapPassword = data.srChapPassword;
      }

      return params;

    };

    this.createSR = function (data) {

      this.lock = true;
      this.creating = true;

      let operationToPromise;

      switch(data.srType) {
        case 'NFS':

          let nfsParams = this._prepareNfsParams(data);
          operationToPromise = this._checkNfsExistence(nfsParams)
          .then(() => xoApi.call('sr.createNfs', nfsParams))
          ;
          break;

        case 'iSCSI':

          let scsiParams = this._prepareScsiParams(data);
          operationToPromise =  this._checkScsiExistence(scsiParams)
          .then(() => xoApi.call('sr.createIscsi', scsiParams))
          ;
          break;

        case 'NFS_ISO':
        case 'Local':

          let server = this._parseAddress(data.srServer || '');

          let path = (('NFS_ISO' === data.srType) ?
            server.host + ':' :
            '') + data.srPath.path;

          operationToPromise = xoApi.call('sr.createIso', {
            host: this.container.UUID,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            path
          });
          break;
        default:

          operationToPromise = Bluebird.reject({message: 'Unhanled SR Type'});
          break;
      }

      operationToPromise
      .then(id => {
        $state.go('SRs_view', {id});
      })
      .catch(error => {
        notify.error({
          title : 'Storage creation Error',
          message : error.message
        });
      })
      .finally(() => {
        this.lock = false;
        this.creating = false;
      })
      ;

    };

    this._checkScsiExistence = function (params) {

      this.resetLists();

      return xoApi.call('sr.probeIscsiExists', params)
      .then(response => {
        if (response.length > 0) {
          this.data.scsiList = response;
          return modal.confirm({
            title: 'Previous LUN Usage',
            message: 'This LUN has been previously used as a Storage by a Xen Server. All data will be lost if used for a new SR creation.'
          });
        } else {
          return Bluebird.resolve(true);
        }
      })
      ;

    };

    this._checkNfsExistence = function (params) {

      this.resetLists();

      return xoApi.call('sr.probeNfsExists', params)
      .then(response => {
        if (response.length > 0) {
          this.data.nfsList = response;
          return modal.confirm({
            title: 'Previous Path Usage',
            message: 'This path has been previously used as a Storage by a Xen Server. All data will be lost if used for a new SR creation.'
          });
        } else {
          return Bluebird.resolve(true);
        }
      })
      ;

    };

    this._gatherConnectedUuids = function() {

      let SRs = [];

      let pool = xo.get(this.container.poolRef);
      pool.SRs.forEach(ref => SRs.push(xo.get(ref).UUID));
      let hosts = [];
      pool.hosts.forEach(ref => hosts.push(xo.get(ref)));
      hosts.forEach(h => h.SRs.forEach(ref => SRs.push(xo.get(ref).UUID)));

      return SRs;

    };

    this._processSRList = function (list) {

      let inUse = false;
      let SRs = this._gatherConnectedUuids();

      list.forEach(item => {
        inUse = (item.used = _indexOf(SRs, item.uuid) > -1) || inUse;
      });

      this.lockCreation = inUse;

      return list;

    };

    this.loadScsiList = function(data) {

      this.resetLists();

      let params = this._prepareScsiParams(data);

      xoApi.call('sr.probeIscsiExists', params)
      .then(response => {

        if (response.length > 0) {
          this.data.scsiList = this._processSRList(response);
        }

      })
      .catch(error => {
        notify.error({
          title : 'probeIscsiExists',
          message : error.message
        });
      })
      ;

    };

    this.loadNfsList = function (data) {

      this.resetLists();

      let server = this._parseAddress(data.srServer);

      xoApi.call('sr.probeNfsExists', {
        host: this.container.UUID,
        server: server.host,
        serverPath: data.srPath.path
      })
      .then(response => {

        if (response.length > 0) {
          this.data.scsiList = this._processSRList(response);
        }

      })
      .catch(error => {
        notify.error({
          title : 'probeNfsExists',
          message : error.message
        });
      })
      ;
    };

    this.reattachNfs = function (uuid, {name, nameError}, {desc, descError}, iso) {

      this._reattach(uuid, 'nfs', {name, nameError}, {desc, descError}, iso);

    };

    this.reattachIScsi = function (uuid, {name, nameError}, {desc, descError}) {

      this._reattach(uuid, 'iscsi', {name, nameError}, {desc, descError});

    };

    this._reattach = function(uuid, type, {name, nameError}, {desc, descError}, iso = false) {

      this.resetErrors();
      let method = 'sr.reattach' + (iso ? 'Iso' : '');

      if (nameError || descError) {
        this.data.error = {
          name: nameError,
          desc: descError
        };
        notify.warning({
          title: 'Missing parameters',
          message: 'Complete the General section information, please'
        });
      } else {
        this.lock = true;
        this.attaching = true;
        xoApi.call(method, {
          host: this.container.UUID,
          uuid,
          nameLabel: name,
          nameDescription: desc,
          type
        })
        .then(id => {
            $state.go('SRs_view', {id});
        })
        .catch(error => notify.error({
            title : 'reattach',
            message : error.message
          })
        )
        .finally(() => {
          this.lock = false;
          this.attaching = false;
        })
        ;
      }

    };

    this.reset();

    $scope.$watch(() => xo.get($stateParams.container), container => {
      this.container = container;
    });

  })

  // A module exports its name.
  .name
;
