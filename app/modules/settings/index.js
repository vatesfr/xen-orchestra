import angular from 'angular'
import uiRouter from 'angular-ui-router'

import acls from './acls'
import group from './group'
import groups from './groups'
import plugins from './plugins'
import servers from './servers'
import update from './update'
import user from './user'
import users from './users'

import view from './view'

export default angular.module('settings', [
  uiRouter,

  acls,
  group,
  groups,
  plugins,
  servers,
  update,
  user,
  users
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings', {
      abstract: true,
      data: {
        requireAdmin: true
      },
      template: view,
      url: '/settings'
    })

    // Redirect to default sub-state.
    $stateProvider.state('settings.index', {
      url: '',
      controller: function ($state) {
        $state.go('settings.servers')
      }
    })
  })
  .name
