import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'

import Bluebird from 'bluebird'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

const HIGH_LEVEL_OBJECTS = {
  pool: true,
  host: true,
  SR: true,
  network: true
}

export default angular.module('settings.self', [
  uiBootstrap,
  uiRouter,
  uiSelect,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.self', {
      controller: 'SettingsSets as ctrl',
      url: '/self',
      resolve: {
        users (xo) {
          return xo.user.getAll()
        },
        groups (xo) {
          return xo.group.getAll()
        },
        roles (xo) {
          return xo.role.getAll()
        }
      },
      template: view
    })
  })
  .controller('SettingsSets', function ($scope, users, groups, roles, xoApi, xo, selectHighLevelFilter, filterFilter) {
    const refreshSets = () => {
      xo.acl.get().then(acls => {
        forEach(acls, acl => acl.newRole = acl.action)
        this.acls = acls
      })
    }
    refreshSets()

    this.types = Object.keys(HIGH_LEVEL_OBJECTS)
    this.selectedTypes = {}

    this.users = users
    this.roles = roles
    this.groups = groups
    {
      let usersById = this.usersById = Object.create(null)
      for (let user of users) {
        usersById[user.id] = user
      }
      let groupsById = this.groupsById = Object.create(null)
      for (let group of groups) {
        groupsById[group.id] = group
      }
      let rolesById = this.rolesById = Object.create(null)
      for (let role of roles) {
        rolesById[role.id] = role
      }
    }

    this.entities = this.users.concat(this.groups)

    this.objects = xoApi.all

    this.getUser = (id) => {
      for (let user of this.users) {
        if (user.id === id) {
          return user
        }
      }
    }

    this.addSet = () => {
      const promises = []
      forEach(this.selectedObjects, object => promises.push(xo.acl.add(this.subject.id, object.id, this.role.id)))
      this.subject = this.selectedObjects = this.role = null
      Bluebird.all(promises).then(refreshSets)
    }

    this.removeSet = (subject, object, role) => {
      xo.acl.remove(subject, object, role).then(refreshSets)
    }

    this.editSet = (subject, object, role, newRole) => {
      console.log(subject, object, role, newRole)
      xo.acl.remove(subject, object, role)
      .then(xo.acl.add(subject, object, newRole))
      .then(refreshSets)
    }

    this.toggleType = (toggle, type) => {
      const selectedObjects = this.selectedObjects && this.selectedObjects.slice() || []
      if (toggle) {
        const objects = filterFilter(selectHighLevelFilter(this.objects), {type})
        forEach(objects, object => { selectedObjects.indexOf(object) === -1 && selectedObjects.push(object) })
        this.selectedObjects = selectedObjects
      } else {
        const keptObjects = []
        for (let index in this.selectedObjects) {
          const object = this.selectedObjects[index]
          if (object.type !== type) {
            keptObjects.push(object)
          }
        }
        this.selectedObjects = keptObjects
      }
    }
  })
  .filter('selectHighLevel', () => {
    let isHighLevel = (object) => HIGH_LEVEL_OBJECTS[object.type]
    return (objects) => filter(objects, isHighLevel)
  })
  .name
