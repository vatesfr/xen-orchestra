import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'

import assign from 'lodash.assign'
import differenceBy from 'lodash.differenceby'
import filter from 'lodash.filter'
import find from 'lodash.find'
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
  .controller('AdminCtrl', function (xo, xoApi, $scope, users, groups, sizeToBytesFilter, bytesToSizeFilter) {
    users.push(...groups)
    this.sizeUnits = ['MiB', 'GiB', 'TiB']

    let validHosts

    this.resourceSets = {}
    const loadSets = () => {
      xo.resourceSet.getAll()
      .then(sets => this.resourceSets = sets)
    }

    const reset = () => {
      this.srs = []
      this.networks = []
      this.templates = []
      this.eligibleHosts = []
      validHosts = []

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
      this.memoryUnit = this.sizeUnits[1]
      this.diskUnit = this.sizeUnits[1]
    }
    this.reset = reset

    reset()
    loadSets()

    this.pools = xoApi.getView('pool').all
    const hosts = xoApi.getView('host').all
    const srs = xoApi.getView('SR').all
    const networks = xoApi.getView('network').all
    const vmTemplatesByContainer = xoApi.getIndex('vmTemplatesByContainer')

    this.subjects = users

    const collectById = function (array) {
      const collection = {}
      forEach(array, item => collection[item.id] = item)
      return collection
    }

    this.listSubjects = collectById(users)

    // When a pool selection happens
    const filterSrs = () => filter(srs, sr => {
      let found = false
      forEach(this.selectedPools, pool => !(found = sr.$poolId === pool.id))
      return found
    })
    const gatherTemplates = () => {
      const vmTemplates = {}
      forEach(this.selectedPools, pool => {
        assign(vmTemplates, vmTemplatesByContainer[pool.id])
      })
      return vmTemplates
    }
    $scope.$watchCollection(() => this.selectedPools, () => {
      validHosts = filter(hosts, host => {
        let found = false
        forEach(this.selectedPools, pool => !(found = host.$poolId === pool.id))
        return found
      })
      this.srs = filterSrs()
      this.selectedSrs = intersection(this.selectedSrs, this.srs)
      this.vmTemplates = gatherTemplates()
      // TODO : Why isn't this working fine? (`intersection` uses SameValueZero as comparison: http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
      // this.selectedTemplates = intersection(this.selectedTemplates, this.vmTemplates)
      this.selectedTemplates = filter(this.selectedTemplates, (template) => this.vmTemplates.hasOwnProperty(template.id))
      this.networks = filterNetworks()
      this.selectedNetworks = intersection(this.selectedNetworks, this.networks)
      this.eligibleHosts = resolveHosts()
    })

    const filterNetworks = () => {
      const selectableHosts = filter(validHosts, host => {
        let keptBySr
        forEach(this.selectedSrs, sr => !(keptBySr = intersection(sr.$PBDs, host.$PBDs).length > 0))
        return keptBySr
      })
      return filter(networks, network => {
        let kept = false
        forEach(selectableHosts, host => !(kept = intersection(network.PIFs, host.PIFs).length > 0))
        return kept
      })
    }
    // When a SR selection happens
    const constraintNetworks = () => {
      this.networks = filterNetworks()
      this.selectedNetworks = intersection(this.selectedNetworks, this.networks)
      resolveHosts()
    }

    const resolveHosts = () => {
      const keptHosts = filter(validHosts, host => {
        let keptBySr = false
        forEach(this.selectedSrs, sr => !(keptBySr = intersection(sr.$PBDs, host.$PBDs).length > 0))
        let keptByNetwork
        forEach(this.selectedNetworks, network => !(keptByNetwork = intersection(network.PIFs, host.PIFs).length > 0))
        return keptBySr && keptByNetwork
      })
      this.eligibleHosts = keptHosts
      this.excludedHosts = differenceBy(map(hosts), keptHosts, item => item && item.id)
    }

    $scope.$watchCollection(() => this.selectedSrs, constraintNetworks)
    $scope.$watchCollection(() => this.selectedNetworks, resolveHosts)

    this.save = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id) {
      return save(name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id)
      .then(reset)
      .then(loadSets)
    }

    this.create = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit) {
      return xo.resourceSet.create(name)
      .then(set => {
        save(name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, set.id)
      })
      .then(reset)
      .then(loadSets)
    }

    const save = function (name, subjects, pools, templates, srs, networks, cpuMax, memoryMax, memoryUnit, diskMax, diskUnit, id) {
      const limits = {}
      if (cpuMax) {
        limits.cpus = cpuMax
      }
      if (memoryMax) {
        limits.memory = sizeToBytesFilter(`${memoryMax} ${memoryUnit}`)
      }
      if (diskMax) {
        limits.disk = sizeToBytesFilter(`${diskMax} ${diskUnit}`)
      }

      const getIds = arr => map(arr, item => item.id)

      subjects = getIds(subjects)
      pools = getIds(pools)
      templates = getIds(templates)
      srs = getIds(srs)
      networks = getIds(networks)

      const objects = Array.of(...templates, ...srs, ...networks)

      return xo.resourceSet.set(id, name, subjects, objects, limits)
    }

    this.edit = id => {
      window.scroll(0, 0)
      const set = find(this.resourceSets, rs => rs.id === id)
      if (set) {
        this.editing = id

        this.name = set.name

        const getObjects = arr => map(arr, id => xoApi.get(id))
        const objects = getObjects(set.objects)

        const selectedPools = {}
        forEach(objects, object => {
          const poolId = object.poolId || object.$poolId
          if (poolId) { selectedPools[poolId] = true }
        })
        this.selectedPools = getObjects(Object.keys(selectedPools))

        this.selectedSrs = filter(objects, object => object.type === 'SR')
        this.selectedNetworks = filter(objects, object => object.type === 'network')
        this.selectedTemplates = filter(objects, object => object.type === 'VM-template')

        this.selectedSubjects = filter(users, user => includes(set.subjects, user.id))

        this.cpuMax = set.limits.cpus && set.limits.cpus.total
        if (set.limits.memory) {
          const memory = bytesToSizeFilter(set.limits.memory.total).split(' ')
          this.memoryMax = +memory[0]
          this.memoryUnit = memory[1]
        } else {
          delete this.memoryMax
          this.memoryUnit = this.sizeUnits[1]
        }
        if (set.limits.disk) {
          const disk = bytesToSizeFilter(set.limits.disk.total).split(' ')
          this.diskMax = +disk[0]
          this.diskUnit = disk[1]
        } else {
          delete this.diskMax
          this.diskUnit = this.sizeUnits[1]
        }
      }
    }

    this.delete = id => {
      xo.resourceSet.delete(id).then(() => {
        if (id === this.editing) {
          reset()
        }
        loadSets()
      })
    }
  })

  // A module exports its name.
  .name
