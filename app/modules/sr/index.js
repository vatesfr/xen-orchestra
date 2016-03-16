import angular from 'angular'
import escapeRegExp from 'lodash.escaperegexp'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import isEmpty from 'lodash.isempty'
import trim from 'lodash.trim'
import uiRouter from 'angular-ui-router'

import Bluebird from 'bluebird'

import xoTag from 'tag'

import view from './view'

// ===================================================================

export default angular.module('xoWebApp.sr', [
  uiRouter,
  xoTag
])
  .config(function ($stateProvider) {
    $stateProvider.state('SRs_view', {
      url: '/srs/:id',
      controller: 'SrCtrl',
      template: view
    })
  })
  .filter('vdiFilter', (xoApi, filterFilter) => {
    return (input, search) => {
      search && (search = trim(search).toLowerCase())
      return filter(input, vdi => {
        let vbd, vm
        let vmName = vdi.$VBDs && vdi.$VBDs[0] && (vbd = xoApi.get(vdi.$VBDs[0])) && (vm = xoApi.get(vbd.VM)) && vm.name_label
        vmName && (vmName = vmName.toLowerCase())
        return !search || (vmName && (vmName.search(escapeRegExp(search)) !== -1) || filterFilter([vdi], search).length)
      })
    }
  })
  .controller('SrCtrl', function ($scope, $stateParams, $state, $q, notify, xoApi, xo, modal, $window, bytesToSizeFilter, sizeToBytesFilter) {
    $window.bytesToSize = bytesToSizeFilter //  FIXME dirty workaround to custom a Chart.js tooltip template

    $scope.units = ['MiB', 'GiB', 'TiB']

    $scope.currentLogPage = 1
    $scope.currentVDIPage = 1

    let {get} = xoApi
    $scope.$watch(() => xoApi.get($stateParams.id), function (SR) {
      const VDIs = []
      if (SR) {
        forEach(SR.VDIs, vdi => {
          vdi = xoApi.get(vdi)
          if (vdi) {
            const size = bytesToSizeFilter(vdi.size)
            VDIs.push({...vdi, size, sizeValue: size.split(' ')[0], sizeUnit: size.split(' ')[1]})
          }
        })
      }
      $scope.SR = SR
      $scope.VDIs = VDIs
    })

    $scope.selectedForDelete = {}
    $scope.deleteSelectedVdis = function () {
      return modal.confirm({
        title: 'VDI deletion',
        message: 'Are you sure you want to delete all selected VDIs? This operation is irreversible.'
      }).then(function () {
        forEach($scope.selectedForDelete, (selected, id) => selected && xo.vdi.delete(id))
        $scope.selectedForDelete = {}
      })
    }

    $scope.saveSR = function ($data) {
      let {SR} = $scope
      let {name_label, name_description} = $data

      $data = {
        id: SR.id
      }
      if (name_label !== SR.name_label) {
        $data.name_label = name_label
      }
      if (name_description !== SR.name_description) {
        $data.name_description = name_description
      }

      return xoApi.call('sr.set', $data)
    }

    $scope.deleteVDI = function (id) {
      console.log('Delete VDI', id)

      return modal.confirm({
        title: 'VDI deletion',
        message: 'Are you sure you want to delete this VDI? This operation is irreversible.'
      }).then(function () {
        return xo.vdi.delete(id)
      })
    }

    $scope.disconnectVBD = function (id) {
      console.log('Disconnect VBD', id)

      return modal.confirm({
        title: 'VDI disconnection',
        message: 'Are you sure you want to disconnect this VDI?'
      }).then(function () {
        return xoApi.call('vbd.disconnect', {id: id})
      })
    }

    $scope.connectPBD = function (id) {
      console.log('Connect PBD', id)

      return xo.pbd.connect(id)
    }

    $scope.disconnectPBD = function (id) {
      console.log('Disconnect PBD', id)

      return xo.pbd.disconnect(id)
    }

    $scope.reconnectAllHosts = function () {
      // TODO: return a Bluebird.all(promises).
      for (let id of $scope.SR.$PBDs) {
        let pbd = xoApi.get(id)

        xoApi.call('pbd.connect', {id: pbd.id})
      }
    }

    $scope.disconnectAllHosts = function () {
      return modal.confirm({
        title: 'Disconnect hosts',
        message: 'Are you sure you want to disconnect all hosts to this SR?'
      }).then(function () {
        for (let id of $scope.SR.$PBDs) {
          let pbd = xoApi.get(id)

          xoApi.call('pbd.disconnect', {id: pbd.id})
          console.log(pbd.id)
        }
      })
    }

    $scope.rescanSr = function (id) {
      console.log('Rescan SR', id)

      return xoApi.call('sr.scan', {id: id})
    }

    $scope.removeSR = function (id) {
      console.log('Remove SR', id)

      return modal.confirm({
        title: 'SR deletion',
        message: 'Are you sure you want to delete this SR? This operation is irreversible.'
      }).then(function () {
        return Bluebird.map($scope.SR.$PBDs, pbdId => {
          let pbd = xoApi.get(pbdId)

          return xoApi.call('pbd.disconnect', { id: pbd.id })
        })
      }).then(function () {
        return xoApi.call('sr.destroy', {id: id})
      }).then(function () {
        $state.go('index')
        notify.info({
          title: 'SR remove',
          message: 'SR is removed'
        })
      })
    }

    $scope.forgetSR = function (id) {
      console.log('Forget SR', id)

      return modal.confirm({
        title: 'SR forget',
        message: 'Are you sure you want to forget this SR? No VDI on this SR will be removed.'
      }).then(function () {
        return Bluebird.map($scope.SR.$PBDs, pbdId => {
          let pbd = xoApi.get(pbdId)

          return xoApi.call('pbd.disconnect', { id: pbd.id })
        })
      }).then(function () {
        return xoApi.call('sr.forget', {id: id})
      }).then(function () {
        $state.go('index')
        notify.info({
          title: 'SR forget',
          message: 'SR is forgotten'
        })
      })
    }

    $scope.saveDisks = function (data) {
      // Group data by disk.
      let disks = {}
      let sizeChanges = false
      forEach(data, function (value, key) {
        let i = key.indexOf('/')

        let id = key.slice(0, i)
        let prop = key.slice(i + 1)

        ;(disks[id] || (disks[id] = {}))[prop] = value
      })

      forEach(disks, function (attributes, id) {
        let disk = get(id)
        attributes.size = bytesToSizeFilter(sizeToBytesFilter(attributes.sizeValue + ' ' + attributes.sizeUnit))
        if (attributes.size !== bytesToSizeFilter(disk.size)) { // /!\ attributes are provided by a modified copy of disk
          sizeChanges = true
          return false
        }
      })

      let promises = []

      const preCheck = sizeChanges ? modal.confirm({
        title: 'Disk resizing',
        message: 'Growing the size of a disk is not reversible'
      }) : $q.resolve()

      return preCheck
      .then(() => {
        forEach(disks, function (attributes, id) {
          let disk = get(id)

          // Resize disks
          attributes.size = bytesToSizeFilter(sizeToBytesFilter(attributes.sizeValue + ' ' + attributes.sizeUnit))
          if (attributes.size !== bytesToSizeFilter(disk.size)) { // /!\ attributes are provided by a modified copy of disk
            promises.push(xo.disk.resize(id, attributes.size))
          }
          delete attributes.size

          // Keep only changed attributes.
          forEach(attributes, function (value, name) {
            if (value === disk[name]) {
              delete attributes[name]
            }
          })

          if (!isEmpty(attributes)) {
            // Inject id.
            attributes.id = id

            // Ask the server to update the object.
            promises.push(xoApi.call('vdi.set', attributes))
          }
        })

        return $q.all(promises)
      })
    }
  })

  // A module exports its name.
  .name
