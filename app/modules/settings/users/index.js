import angular from 'angular'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'
import uiEvent from 'angular-ui-event'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('settings.users', [
  uiRouter,
  uiSelect,
  uiEvent,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.users', {
      controller: 'SettingsUsers as ctrl',
      url: '/users',
      resolve: {
        users (xo) {
          return xo.user.getAll()
        },
        groups (xo) {
          return xo.group.getAll()
        }
      },
      template: view
    })
  })
  .controller('SettingsUsers', function ($scope, $interval, users, groups, xoApi, xo) {
    this.uiCollapse = Object.create(null)
    this.addedUsers = []

    this.users = users
    this.userEmails = {}
    users.forEach(user => {
      this.userEmails[user.id] = user.email
    })
    this.groups = groups
    this.permissions = [
      {
        label: 'User',
        value: 'none'
      },
      {
        label: 'Admin',
        value: 'admin'
      }
    ]

    const selected = this.selectedUsers = {}
    const selectedGroups = this.selectedGroups = {}
    this.newUsers = []
    this.newGroups = []

    const refreshUsers = () => {
      if (!this._editingUser) {
        xo.user.getAll().then(users => {
          this.users = users
        })
      }
    }

    const refreshGroups = () => {
      let editing = this._editingGroup
      for (let groupId in this.uiCollapse) {
        editing = editing || this.uiCollapse[groupId]
      }
      if (!editing) {
        xo.group.getAll().then(groups => this.groups = groups)
      }
    }

    const interval = $interval(() => {
      refreshUsers()
      refreshGroups()
    }, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.addUser = () => {
      this.newUsers.push({
        // Fake (unique) id needed by Angular.JS
        id: Math.random(),
        permission: 'none'
      })
    }

    this.addGroup = () => {
      this.newGroups.push({
        // Fake (unique) id needed by Angular.JS
        id: Math.random()
      })
    }

    this.addUser()
    this.addGroup()

    this.saveUsers = () => {
      const newUsers = this.newUsers
      const users = this.users
      const updateUsers = []

      for (let i = 0, len = users.length; i < len; i++) {
        const user = users[i]
        const {id} = user
        if (selected[id]) {
          delete selected[id]
          xo.user.delete(id)
        } else {
          if (!user.password) {
            delete user.password
          }
          xo.user.set(user)
          delete user.password
          updateUsers.push(user)
        }
      }
      for (let i = 0, len = newUsers.length; i < len; i++) {
        const user = newUsers[i]
        const {email, permission, password} = user
        if (!email) {
          continue
        }
        xo.user.create({
          email,
          permission,
          password
        }).then(function (id) {
          user.id = id
        })
        delete user.password
        updateUsers.push(user)
      }
      this.users = updateUsers
      this.newUsers.length = 0
      this.addUser()
    }

    this.saveGroups = () => {
      const newGroups = this.newGroups
      const groups = this.groups
      const updateGroups = []

      for (let i = 0, len = groups.length; i < len; i++) {
        const group = groups[i]
        const {id} = group
        if (selectedGroups[id]) {
          delete selectedGroups[id]
          xo.group.delete(id)
        } else {
          xo.group.set(group)
          updateGroups.push(group)
        }
      }
      for (let i = 0, len = newGroups.length; i < len; i++) {
        const group = newGroups[i]
        const {name} = group
        if (!name) {
          continue
        }
        xo.group.create({name})
        .then(function (id) {
          group.id = id
        })
        updateGroups.push(group)
      }

      this.groups = updateGroups
      this.newGroups.length = 0
      this.addGroup()
    }

    this.addUserToGroup = (group, index) => {
      // TODO
      group.users.push(this.addedUsers[index].id)
      delete this.addedUsers[index]
    }

    this.flagUserRemoval = (group, index, remove) => {
      // TODO
      group.removals || (group.removals = {})
      group.removals[group.users[index]] = remove
    }

    this.saveGroup = (group) => {
      // TODO
      const users = []
      group.users.forEach(user => {
        let remove = group.removals && group.removals[user]
        if (!remove) {
          users.push(user)
        }
      })
      group.removals && delete group.removals
      xo.group.setUsers(group.id, users)
      .then(() => {
        group.users = users
        this.uiCollapse[group.id] = false
      })
    }

    this.editingUser = editing => {
      this._editingUser = editing
    }

    this.editingGroup = editing => {
      this._editingGroup = editing
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
  .name
