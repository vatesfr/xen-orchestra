import angular from 'angular'
import uiRouter from 'angular-ui-router'

import ansiUp from 'ansi_up'
import updater from '../../updater'
import {AuthenticationFailed} from '../../updater'
import xoApi from 'xo-api'
import xoServices from 'xo-services'

import view from './view'

export default angular.module('dashboard.health', [
  uiRouter,

  updater,
  xoApi,
  xoServices
])
  .config(function ($stateProvider) {
    $stateProvider.state('dashboard.health', {
      controller: 'Health as ctrl',
      url: '/update',
      onExit: updater => {
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
  .controller('SettingsUpdate', function (xoApi, xo, updater, notify) {
    this.updater = updater

    this.updater.isRegistered()
    .then(() => this.updater.on('end', () => {
      if (this.updater.state === 'registerNeeded' && this.updater.registerState !== 'unregistered' && this.updater.registerState !== 'error') {
        this.updater.isRegistered()
      }
    }))
    .catch(err => console.error(err))

    this.registerXoa = (email, password) => {
      this.regPwd = ''
      this.updater.register(email, password)
      .then(() => this.updater.update())
      .catch(AuthenticationFailed, () => {})
    }

    this.update = () => {
      this.updater.log('info', 'Start updating...')
      this.updater.update()
      .catch(error => notify.error({
        title: 'XOA Updater',
        message: error.message
      }))
    }

    this.upgrade = () => {
      this.updater.log('info', 'Start upgrading...')
      this.updater.upgrade()
      .catch(error => notify.error({
        title: 'XOA Updater',
        message: error.message
      }))
    }

    this.trial = () => {
      this.updater.requestTrial()
      .then(() => this.update())
      .catch(error => notify.error({
        title: 'Trial request',
        message: error.message
      }))
    }

    this.valid = trial => {
      return trial && trial.end && Date.now() < trial.end
    }
  })
  .name
