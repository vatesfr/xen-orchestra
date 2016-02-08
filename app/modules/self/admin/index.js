import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import assign from 'lodash.assign'
import differenceBy from 'lodash.differenceby'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import includes from 'lodash.includes'
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
    users.push(...groups)
    this.sizeUnits = ['MiB', 'GiB', 'TiB']

    let eligibleHosts

    this.reset = () => {
      this.srs = {}
      this.networks = {}
      this.templates = {}
      this.eligibleHosts = {}
      eligibleHosts = {}

      delete this.editing

      delete this.selectedNetworks
      delete this.selectedSrs
      delete this.selectedTemplates
      delete this.selectedPools
      delete this.selectedSubjects
      delete this.name
      delete this.cpuMax
      delete this.memoryMax
      delete this.diskMax
      this.memoryUnit = this.sizeUnits[0]
      this.diskUnit = this.sizeUnits[1]
    }
    this.reset()

    this.pools = xoApi.getView('pool').all
    const hosts = xoApi.getView('host').all
    const srs = xoApi.getView('SR').all
    const networks = xoApi.getView('network').all
    const vmTemplatesByContainer = xoApi.getIndex('vmTemplatesByContainer')

    this.subjects = users

    const collectById = arr => {
      const col = {}
      forEach(arr, item => col[item.id] = item)
      return col
    }

    this.listSubjects = collectById(users)

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

    // MOCK
    this.saved = {}
    let increment = 0

    this.create = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit) {
      memoryMax = `${memoryMax} ${memoryUnit}`
      diskMax = `${diskMax} ${diskUnit}`

      const getIds = arr => map(arr, item => item.id)

      subjects = getIds(subjects)
      pools = getIds(pools)
      templates = getIds(templates)
      srs = getIds(srs)
      networks = getIds(networks)

      const id = ++increment
      this.saved[id] = {
        id,
        name,
        subjects,
        pools,
        templates,
        srs,
        networks,
        cpuMax,
        memoryMax,
        diskMax
      }

      this.reset()
    }

    this.save = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id) {
      return save(name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id)
    }

    this.create = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit) {
      const id = ++increment
      return save(name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id)
    }

    const save = (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id) => {
      memoryMax = `${memoryMax} ${memoryUnit}`
      diskMax = `${diskMax} ${diskUnit}`

      const getIds = arr => map(arr, item => item.id)

      subjects = getIds(subjects)
      pools = getIds(pools)
      templates = getIds(templates)
      srs = getIds(srs)
      networks = getIds(networks)

      this.saved[id] = {
        id,
        name,
        subjects,
        pools,
        templates,
        srs,
        networks,
        cpuMax,
        memoryMax,
        diskMax
      }

      this.reset()
    }

    this.edit = id => {
      const set = this.saved[id]
      if (set) {
        this.editing = id

        this.name = set.name

        const getObjects = arr => map(arr, id => xoApi.get(id))
        this.selectedPools = getObjects(set.pools)
        this.selectedSrs = getObjects(set.srs)
        this.selectedNetworks = getObjects(set.networks)
        this.selectedTemplates = getObjects(set.templates)

        this.selectedSubjects = filter(users, user => includes(set.subjects, user.id))

        this.cpuMax = set.cpuMax
        const memory = set.memoryMax.split(' ')
        this.memoryMax = +memory[0]
        this.memoryUnit = memory[1]
        const disk = set.diskMax.split(' ')
        this.diskMax = +disk[0]
        this.diskUnit = disk[1]
      }
    }
    this.delete = id => delete this.saved[id]
  })

  // A module exports its name.
  .name
