import angular from 'angular'
import Bluebird from 'bluebird'
import forEach from 'lodash.foreach'
import uiRouter from 'angular-ui-router'

import view from './view'
import _indexOf from 'lodash.indexof'

// ===================================================================

export default angular.module('xoWebApp.newSr', [
  uiRouter
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_new', {
      url: '/srs/new/:container',
      controller: 'NewSrCtrl as newSr',
      template: view
    })
  })
  .controller('NewSrCtrl', function ($scope, $state, $stateParams, xo, xoApi, notify, modal, bytesToSizeFilter) {
    this.reset = function (data = {}) {
      this.data = {}
      delete this.lockCreation
      this.lock = !(
        (data.srType === 'Local') &&
        (data.srPath && data.srPath.path) ||
        data.srType === 'SMB'
      )
    }

    this.resetLists = function () {
      delete this.data.nfsList
      delete this.data.scsiList
      delete this.lockCreation
      this.lock = true

      this.resetErrors()
    }

    this.resetErrors = function () {
      delete this.data.error
    }

    /*
     * Loads NFS paths and iScsi iqn`s
     */
    this.populateSettings = function (type, server, auth, user, password) {
      this.reset()
      this.loading = true

      server = this._parseAddress(server)

      if (type === 'NFS' || type === 'NFS_ISO') {
        xoApi.call('sr.probeNfs', {
          host: this.container.id,
          server: server.host
        })
        .then(response => this.data.paths = response)
        .catch(error => notify.warning({
          title: 'NFS Detection',
          message: error.message
        }))
        .finally(() => this.loading = false)
      } else if (type === 'iSCSI') {
        let params = {
          host: this.container.id
        }

        if (auth) {
          params.chapUser = user
          params.chapPassword = password
        }

        params.target = server.host
        if (server.port) {
          params.port = server.port
        }

        xoApi.call('sr.probeIscsiIqns', params)
        .then(response => {
          if (response.length > 0) {
            this.data.iqns = response
          } else {
            notify.warning({
              title: 'iSCSI Detection',
              message: 'No IQNs found'
            })
          }
        })
        .catch(error => notify.warning({
          title: 'iSCSI Detection',
          message: error.message
        }))
        .finally(() => this.loading = false)
      } else {
        this.loading = false
      }
    }

    /*
     * Loads iScsi LUNs
     */
    this.populateIScsiIds = function (iqn, auth, user, password) {
      delete this.data.iScsiIds
      this.loading = true

      let params = {
        host: this.container.id,
        target: iqn.ip,
        targetIqn: iqn.iqn
      }

      if (auth) {
        params.chapUser = user
        params.chapPassword = password
      }

      xoApi.call('sr.probeIscsiLuns', params)
        .then(response => {
          forEach(response, item => {
            item.display = 'LUN ' + item.id + ': ' +
            item.serial + ' ' + bytesToSizeFilter(item.size) +
            ' (' + item.vendor + ')'
          })

          this.data.iScsiIds = response
        })
        .catch(error => notify.warning({
          title: 'LUNs Detection',
          message: error.message
        }))
        .finally(() => this.loading = false)
    }

    this._parseAddress = function (address) {
      let index = address.indexOf(':')
      let port = false
      let host = address
      if (index > -1) {
        port = address.substring(index + 1)
        host = address.substring(0, index)
      }
      return {
        host,
        port
      }
    }

    this._prepareNfsParams = function (data) {
      let server = this._parseAddress(data.srServer)

      let params = {
        host: this.container.id,
        nameLabel: data.srName,
        nameDescription: data.srDesc,
        server: server.host,
        serverPath: data.srPath.path
      }

      return params
    }

    this._prepareScsiParams = function (data) {
      let params = {
        host: this.container.id,
        nameLabel: data.srName,
        nameDescription: data.srDesc,
        target: data.srIqn.ip,
        targetIqn: data.srIqn.iqn,
        scsiId: data.srIScsiId.scsiId
      }

      let server = this._parseAddress(data.srServer)
      if (server.port) {
        params.port = server.port
      }
      if (data.srAuth) {
        params.chapUser = data.srChapUser
        params.chapPassword = data.srChapPassword
      }

      return params
    }

    this.createSR = function (data) {
      this.lock = true
      this.creating = true

      let operationToPromise

      switch (data.srType) {
        case 'NFS':
          let nfsParams = this._prepareNfsParams(data)
          operationToPromise = this._checkNfsExistence(nfsParams)
            .then(() => xoApi.call('sr.createNfs', nfsParams))
          break

        case 'iSCSI':
          let scsiParams = this._prepareScsiParams(data)
          operationToPromise = this._checkScsiExistence(scsiParams)
            .then(() => xoApi.call('sr.createIscsi', scsiParams))
          break

        case 'lvm':
          let device = data.srDevice.device

          operationToPromise = xoApi.call('sr.createLvm', {
            host: this.container.id,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            device
          })
          break

        case 'Local':
          operationToPromise = xoApi.call('sr.createIso', {
            host: this.container.id,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            type: 'local',
            path: data.srPath.path
          })
          break

        case 'NFS_ISO':
          let server = this._parseAddress(data.srServer || '')

          const path = (
            data.srType === 'NFS_ISO'
              ? server.host + ':'
              : ''
          ) + data.srPath.path

          operationToPromise = xoApi.call('sr.createIso', {
            host: this.container.id,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            type: 'nfs',
            path
          })
          break

        case 'SMB':
          operationToPromise = xoApi.call('sr.createIso', {
            host: this.container.id,
            nameLabel: data.srName,
            nameDescription: data.srDesc,
            type: 'smb',
            path: data.srServer,
            user: data.user,
            password: data.password
          })
          break

        default:
          operationToPromise = Bluebird.reject({message: 'Unhanled SR Type'})
          break
      }

      operationToPromise
      .then(id => {
        $state.go('SRs_view', {id})
      })
      .catch(error => {
        notify.error({
          title: 'Storage Creation Error',
          message: error.message
        })
      })
      .finally(() => {
        this.lock = false
        this.creating = false
      })
    }

    this._checkScsiExistence = function (params) {
      this.resetLists()

      return xoApi.call('sr.probeIscsiExists', params)
      .then(response => {
        if (response.length > 0) {
          this.data.scsiList = response
          return modal.confirm({
            title: 'Previous LUN Usage',
            message: 'This LUN has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation. Are you sure?'
          })
        }

        return true
      })
    }

    this._checkNfsExistence = function (params) {
      this.resetLists()

      return xoApi.call('sr.probeNfsExists', params)
      .then(response => {
        if (response.length > 0) {
          this.data.nfsList = response
          return modal.confirm({
            title: 'Previous Path Usage',
            message: 'This path has been previously used as a Storage by a XenServer host. All data will be lost if you choose to continue the SR creation. Are you sure?'
          })
        }

        return true
      })
    }

    const hostsByPool = xoApi.getIndex('hostsByPool')
    const srsByContainer = xoApi.getIndex('srsByContainer')
    this._gatherConnectedUuids = function () {
      const srIds = []

      // Shared SRs.
      forEach(srsByContainer[this.container.$poolId], sr => {
        srIds.push(sr.id)
      })

      // Local SRs.
      forEach(hostsByPool[this.container.$poolId], host => {
        forEach(srsByContainer[host.id], sr => {
          srIds.push(sr.id)
        })
      })

      return srIds
    }

    this._processSRList = function (list) {
      let inUse = false
      let SRs = this._gatherConnectedUuids()

      forEach(list, item => {
        inUse = (item.used = _indexOf(SRs, item.uuid) > -1) || inUse
      })

      this.lockCreation = inUse

      return list
    }

    this.loadScsiList = function (data) {
      this.resetLists()
      this.loading = true

      let params = this._prepareScsiParams(data)

      xoApi.call('sr.probeIscsiExists', params)
      .then(response => {
        if (response.length > 0) {
          this.data.scsiList = this._processSRList(response)
        }

        this.lock = !Boolean(data.srIScsiId)
      })
      .catch(error => {
        notify.error({
          title: 'iSCSI Error',
          message: error.message
        })
      })
      .finally(() => this.loading = false)
    }

    this.loadNfsList = function (data) {
      this.resetLists()

      let server = this._parseAddress(data.srServer)

      xoApi.call('sr.probeNfsExists', {
        host: this.container.id,
        server: server.host,
        serverPath: data.srPath.path
      })
      .then(response => {
        if (response.length > 0) {
          this.data.nfsList = this._processSRList(response)
        }

        this.lock = !Boolean(data.srPath.path)
      })
      .catch(error => {
        notify.error({
          title: 'NFS error',
          message: error.message
        })
      })
    }

    this.reattachNfs = function (uuid, {name, nameError}, {desc, descError}, iso) {
      this._reattach(uuid, 'nfs', {name, nameError}, {desc, descError}, iso)
    }

    this.reattachIScsi = function (uuid, {name, nameError}, {desc, descError}) {
      this._reattach(uuid, 'iscsi', {name, nameError}, {desc, descError})
    }

    this._reattach = function (uuid, type, {name, nameError}, {desc, descError}, iso = false) {
      this.resetErrors()
      let method = 'sr.reattach' + (iso ? 'Iso' : '')

      if (nameError || descError) {
        this.data.error = {
          name: nameError,
          desc: descError
        }
        notify.warning({
          title: 'Missing parameters',
          message: 'Complete the General section information, please'
        })
      } else {
        this.lock = true
        this.attaching = true
        xoApi.call(method, {
          host: this.container.id,
          uuid,
          nameLabel: name,
          nameDescription: desc,
          type
        })
        .then(id => {
          $state.go('SRs_view', {id})
        })
        .catch(error => notify.error({
          title: 'reattach',
          message: error.message
        }))
        .finally(() => {
          this.lock = false
          this.attaching = false
        })
      }
    }

    this.reset()

    $scope.$watch(() => xoApi.get($stateParams.container), container => {
      this.container = container
    })
  })

  // A module exports its name.
  .name
