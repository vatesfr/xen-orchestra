import angular from 'angular'
import later from 'later'
import scheduler from 'scheduler'
import uiRouter from 'angular-ui-router'

later.date.localTime()

import backup from './backup'
import continuousReplication from './continuous-replication'
import deltaBackup from './delta-backup'
import disasterRecovery from './disaster-recovery'
import management from './management'
import mount from './remote'
import restore from './restore'
import rollingSnapshot from './rolling-snapshot'

import view from './view'

export default angular.module('backup', [
  uiRouter,

  backup,
  continuousReplication,
  deltaBackup,
  disasterRecovery,
  management,
  mount,
  restore,
  rollingSnapshot,
  scheduler
])
  .config(function ($stateProvider) {
    $stateProvider.state('backup', {
      abstract: true,
      data: {
        requireAdmin: true
      },
      template: view,
      url: '/backup'
    })

    // Redirect to default sub-state.
    $stateProvider.state('backup.index', {
      url: '',
      controller: function ($state) {
        $state.go('backup.management')
      }
    })
  })

  .name
