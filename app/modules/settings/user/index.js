import angular from 'angular'
import uiRouter from 'angular-ui-router'

import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('settings.user', [
  uiRouter,

  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.user', {
      controller: 'SettingsUser as ctrl',
      url: '/user',
      data: {
        requireAdmin: false
      },
      resolve: {
      },
      template: view
    })
  })
  .controller('SettingsUser', function (xo, notify) {
    this.changePassword = function (oldPassword, newPassword) {
      this.working = true
      xo.user.changePassword(oldPassword, newPassword)
      .then(() => {
        this.oldPassword = ''
        this.newPassword = ''
        this.confirmPassword = ''
        notify.info({
          title: 'Change password',
          message: 'Password has been successfully change'
        })
      })
      .catch(error => notify.error({
        title: 'Change password',
        message: error.message
      }))
      .finally(() => this.working = false)
    }
  })

  .name
