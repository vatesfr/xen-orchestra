import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import slice from 'lodash.slice'
import forEach from 'lodash.foreach'
import find from 'lodash.find'

import view from './view'

// ====================================================================

export default angular.module('self.dashboard', [
  uiRouter,
  uiBootstrap
])
  .config(function ($stateProvider) {
    $stateProvider.state('self.dashboard', {
      url: '/dashboard',
      resolve: {
        users (xo) {
          return xo.user.getAll()
        },
        groups (xo) {
          return xo.group.getAll()
        }
      },
      controller: 'DashboardCtrl as ctrl',
      template: view
    })
  })
  .controller('DashboardCtrl', function (xo, xoApi, $scope, $window, users, groups, bytesToSizeFilter) {
    this.resourceSetsPerPage = 5
    $window.bytesToSize = bytesToSizeFilter //  FIXME dirty workaround to custom a Chart.js tooltip template

    this.get = xoApi.get
    this.pageIndex = 0
    this.numberOfPages = 0
    this.resourceSetsToShow = []

    const loadSets = () => {
      xo.resourceSet.getAll()
      .then(sets => {
        this.resourceSets = sets
        this.resourceSet = this.resourceSets[0]
        this.numberOfPages = Math.ceil(sets.length / this.resourceSetsPerPage)
        this.updateResourceSetsToShow()
      })
    }
    loadSets()

    this.updateResourceSetsToShow = () => {
      this.resourceSetsToShow = slice(this.resourceSets, this.resourceSetsPerPage * this.pageIndex, this.resourceSetsPerPage * (this.pageIndex + 1))
    }

    const getList = (ids, list) => {
      const collection = []
      forEach(ids, id => {
        const item = find(list, item => item.id === id)
        if (item) {
          collection.push(item)
        }
      })
      return collection
    }
    this.getUsers = (ids) => getList(ids, users)
    this.getGroups = (ids) => getList(ids, groups)

    this.getObjectsByType = (arr) => {
      const objects = {}
      forEach(arr, id => {
        const obj = this.get(id)
        if (!objects[obj.type]) {
          objects[obj.type] = []
        }
        objects[obj.type].push(obj)
      })
      return objects
    }

    $scope.$watch('ctrl.resourceSet', (resourceSet) => {
      if (!resourceSet) {
        return
      }
      this.cpusStats = [0, 0]
      this.memoryStats = [0, 0]
      this.diskStats = [0, 0]
      if (resourceSet.limits.cpus) {
        this.cpusStats = [resourceSet.limits.cpus.total - resourceSet.limits.cpus.available, resourceSet.limits.cpus.available]
      }
      if (resourceSet.limits.memory) {
        this.memoryStats = [resourceSet.limits.memory.total - resourceSet.limits.memory.available, resourceSet.limits.memory.available]
      }
      if (resourceSet.limits.disk) {
        this.diskStats = [resourceSet.limits.disk.total - resourceSet.limits.disk.available, resourceSet.limits.disk.available]
      }
    })
  })

  // A module exports its name.
  .name
