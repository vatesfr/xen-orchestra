import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import assign from 'lodash.assign'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import intersection from 'lodash.intersection'

import view from './view'

// ====================================================================

export default angular.module('self.admin', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('self.admin', {
      url: '/admin',
      controller: 'AdminCtrl as ctrl',
      template: view
    })
  })
  .controller('AdminCtrl', function (xoApi, $scope) {
    this.containers = {}
    this.srs = {}
    this.networks = {}
    this.templates = {}
    const hosts = xoApi.getView('host').all
    const pools = xoApi.getView('pool').all
    const srs = xoApi.getView('SR').all
    const networks = xoApi.getView('network').all
    const vmTemplatesByContainer = xoApi.getIndex('vmTemplatesByContainer')
    this._net = networks
    this._hosts = hosts
    const assemble = () => this.containers = assign(hosts, pools)

    $scope.$watchCollection(() => hosts, assemble)
    $scope.$watchCollection(() => pools, assemble)

    this.toggleType = (toggle, type) => {
      const selectedContainers = this.selectedContainers && this.selectedContainers.slice() || []
      if (toggle) {
        const objects = filter(this.containers, {type})
        forEach(objects, object => { selectedContainers.indexOf(object) === -1 && selectedContainers.push(object) })
        this.selectedContainers = selectedContainers
      } else {
        const keptObjects = []
        for (let index in this.selectedContainers) {
          const object = this.selectedContainers[index]
          if (object.type !== type) {
            keptObjects.push(object)
          }
        }
        this.selectedContainers = keptObjects
      }
    }

    $scope.$watchCollection(() => this.selectedContainers, () => {
      this.srs = filter(srs, sr => {
        let found = false
        forEach(this.selectedContainers, container => !(found = (sr.$container === container.id || sr.$poolId === container.id)))
        return found
      })
      this.networks = filter(networks, network => {
        let found = false
        forEach(this.selectedContainers, container => !(found = (network.$poolId === container.id || intersection(network.PIFs, container.PIFs).length > 0)))
        return found
      })
    })
  })

  // A module exports its name.
  .name
