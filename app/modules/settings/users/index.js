import angular from 'angular'
import uiRouter from 'angular-ui-router'
import uiSelect from 'angular-ui-select'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('settings.users', [
  uiRouter,
  uiSelect,

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
        }
      },
      template: view
    })
  })
  .controller('SettingsUsers', function ($scope, $interval, users, xoApi, xo) {
    this.users = users
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
    const newUsers = this.newUsers = []

    const refreshUsers = () => {
      xo.user.getAll().then(users => {
        this.users = users
      })
    }

    const interval = $interval(refreshUsers, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.addUser = () => {
      newUsers.push({
        // Fake (unique) id needed by Angular.JS
        id: Math.random(),
        permission: 'none'
      })
    }

    this.addUser()
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
  })
  .name
