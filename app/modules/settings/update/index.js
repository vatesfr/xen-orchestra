import angular from 'angular'
import uiRouter from 'angular-ui-router'

import ansiUp from 'ansi_up'
import updater from '../../updater'
import {AuthenticationFailed} from '../../updater'
import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('settings.update', [
  uiRouter,

  updater,
  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.update', {
      controller: 'SettingsUpdate as ctrl',
      url: '/update',
      onExit: (register, updater) => {
        updater.removeAllListeners('end')
      },
      template: view
    })
  })
  .filter('ansitohtml', function ($sce) {
    return function (input) {
      return $sce.trustAsHtml(ansiUp.ansi_to_html(input))
    }
  })
  .controller('SettingsUpdate', function (xoApi, xo, updater, register) {
    this.updater = updater
    this.register = register

    this.register.isRegistered()
    .then(() => this.updater.on('end', () => {
      if (this.updater.state === 'registerNeeded' && this.register.state !== 'unregistered' && this.register.state !== 'error') {
        this.register.isRegistered()
      }
    }))

    this.registerXoa = (email, password) => {
      this.regPwd = ''
      this.register.register(email, password)
      .then(() => this.updater.update())
      .catch(AuthenticationFailed, () => {})
    }

    this.update = () => {
      this.updater.update()
    }

    this.upgrade = () => {
      this.updater.upgrade()
    }
  })
  .name
