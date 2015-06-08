import angular from 'angular'
import filter from 'lodash.filter'
import find from 'lodash.find'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'
import uiEvent from 'angular-ui-event'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('settings.group', [
  uiRouter,
  uiSelect,
  uiEvent,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.group', {
      controller: 'SettingsGroup as ctrl',
      url: '/group/:groupId',
      resolve: {
        acls (xo) {
          return xo.acl.get()
        },
        groups (xo) {
          return xo.group.getAll()
        },
        roles (xo) {
          return xo.role.getAll()
        },
        users (xo) {
          return xo.user.getAll()
        }
      },
      template: view
    })
  })
  .controller('SettingsGroup', function ($scope, $state, $stateParams, $interval, acls, groups, roles, users, xoApi, xo) {
    this.acls = acls
    this.roles = roles
    this.users = users
    this.userEmails = Object.create(null)
    this.users.forEach(user => {
      this.userEmails[user.id] = user.email
    })
    {
      let rolesById = Object.create(null)
      for (let role of roles) {
        rolesById[role.id] = role
      }
      this.rolesById = rolesById
    }

    this.objects = xoApi.all
    this.removals = Object.create(null)

    const findGroup = groups => {
      this.group = filter(groups, gr => gr.id === $stateParams.groupId).pop()
      if (!this.group) {
        $state.go('settings.groups')
      }
    }
    findGroup(groups)

    const refreshUsers = () => {
      xo.user.getAll().then(users => {
        this.users = users
        this.userEmails = Object.create(null)
        this.users.forEach(user => {
          this.userEmails[user.id] = user.email
        })
      })
    }

    const refreshGroups = () => {
      if (!this.isModified()) {
        xo.group.getAll().then(groups => findGroup(groups))
      }
    }

    const interval = $interval(() => {
      refreshUsers()
      refreshGroups()
    }, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.addUserToGroup = (group, user) => {
      group.users.push(user.id)
      this.addedUser = null
      this.modified = true
    }

    this.saveGroup = (group) => {
      const users = []
      group.users.forEach(user => {
        let remove = this.removals && this.removals[user]
        if (!remove) {
          users.push(user)
        }
      })
      this.removals = Object.create(null)
      xo.group.setUsers(group.id, users)
      .then(() => {
        group.users = users
        this.modified = false
      })
    }

    this.cancelEdition = () => {
      this.modified = false
      this.removals = Object.create(null)
      refreshGroups()
    }

    this.isModified = () => this.modified || Object.keys(this.removals).length
    this.matchesGroup = acl => {
      return acl.subject === this.group.id
    }
  })
  .filter('notInGroup', function () {
    return function (users, group) {
      const filtered = []
      users.forEach(user => {
        if (!group.users || group.users.indexOf(user.id) === -1) {
          filtered.push(user)
        }
      })
      return filtered
    }
  })
  .filter('canAccess', () => {
    return (objects, group, acls) => {
      const accessed = []
      const groupAcls = filter(acls, acl => acl.subject === group.id)
      groupAcls.forEach(acl => {
        const found = find(objects, object => object.id === acl.object)
        found && accessed.push(found)
      })
      return accessed
    }
  })
  .name
