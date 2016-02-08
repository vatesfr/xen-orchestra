import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import assign from 'lodash.assign'
import differenceBy from 'lodash.differenceby'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import intersection from 'lodash.intersection'
import map from 'lodash.map'

import view from './view'

// ====================================================================

export default angular.module('self.admin', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('self.admin', {
      url: '/admin',
      resolve: {
        users (xo) {
          return xo.user.getAll()
        },
        groups (xo) {
          return xo.group.getAll()
        }
      },
      controller: 'AdminCtrl as ctrl',
      template: view
    })
  })
  .controller('AdminCtrl', function (xoApi, $scope, users, groups) {
    this.sizeUnits = ['MiB', 'GiB', 'TiB']
    this.memoryUnit = this.sizeUnits[0]
    this.diskUnit = this.sizeUnits[1]

    this.srs = {}
    this.networks = {}
    this.templates = {}
    this.eligibleHosts = {}
    let eligibleHosts = {}

    this.pools = xoApi.getView('pool').all
    const hosts = xoApi.getView('host').all
    const srs = xoApi.getView('SR').all
    const networks = xoApi.getView('network').all
    const vmTemplatesByContainer = xoApi.getIndex('vmTemplatesByContainer')

    users.push(...groups)
    this.subjects = users

    const filterSrs = () => filter(srs, sr => {
      let found = false
      forEach(this.selectedPools, pool => !(found = sr.$poolId === pool.id))
      return found
    })

    const filterNetworks = () => filter(networks, network => {
      let found = false
      forEach(this.selectedPools, pool => !(found = network.$poolId === pool.id))
      return found
    })

    $scope.$watchCollection(() => this.selectedPools, () => {
      this.srs = filterSrs()
      this.networks = filterNetworks()
      eligibleHosts = filter(hosts, host => {
        let found = false
        forEach(this.selectedPools, pool => !(found = host.$poolId === pool.id))
        return found
      })
      const vmTemplates = {}
      forEach(this.selectedPools, pool => assign(vmTemplates, vmTemplatesByContainer[pool.id]))
      this.vmTemplates = vmTemplates
    })

    $scope.$watchCollection(() => this.selectedSrs, () => {
      const keptHosts = filter(eligibleHosts, host => {
        let kept = false
        forEach(this.selectedSrs, sr => !(kept = intersection(sr.$PBDs, host.$PBDs).length > 0))
        return kept
      })
      this.eligibleHosts = keptHosts
      this.excludedHosts = differenceBy(map(hosts), keptHosts, item => item && item.id)
      if (!this.selectedSrs || !this.selectedSrs.length) {
        this.networks = filterNetworks()
      } else {
        const keptNetworks = filter(networks, network => {
          let kept = false
          forEach(this.eligibleHosts, host => {
            return !(kept = intersection(network.PIFs, host.PIFs).length > 0)
          })
          return kept
        })
        this.networks = keptNetworks
      }
    })

    $scope.$watchCollection(() => this.selectedNetworks, () => {
      const keptHosts = filter(eligibleHosts, host => {
        let kept = false
        forEach(this.selectedNetworks, network => !(kept = intersection(network.PIFs, host.PIFs).length > 0))
        return kept
      })
      this.eligibleHosts = keptHosts
      this.excludedHosts = differenceBy(map(hosts), keptHosts, item => item && item.id)
      if (!this.selectedNetworks || !this.selectedNetworks.length) {
        this.srs = filterSrs()
      } else {
        const keptSrs = filter(srs, sr => {
          let kept = false
          forEach(this.eligibleHosts, host => !(kept = intersection(sr.$PBDs, host.$PBDs).length > 0))
          return kept
        })
        this.srs = keptSrs
      }
    })
  })

  // A module exports its name.
  .name
