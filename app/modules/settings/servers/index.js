import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('settings.servers', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.servers', {
      controller: 'SettingsServers as ctrl',
      url: '/servers',
      resolve: {
        servers(xo) {
          return xo.server.getAll();
        },
      },
      template: view,
    });
  })
  .controller('SettingsServers', function ($scope, $interval, servers, xoApi, xo, notify) {
    this.servers = servers;
    const selected = this.selectedServers = {};
    const newServers = this.newServers = [];

    const refreshServers = () => {
      xo.server.getAll().then(servers => {
        this.servers = servers;
      });
    };

    const interval = $interval(refreshServers, 5e3)
    $scope.$on('$destroy', () => {
      $interval.cancel(interval)
    })

    this.connectServer = (id) => {
      xo.server.connect(id).catch(error => {
        notify.error({
          title: 'Server connection error',
          message: error.message
        });
      });
    };

    this.disconnectServer = (id) => {
      xo.server.disconnect(id);
    };

    this.addServer = () => {
      newServers.push({
        // Fake (unique) id needed by Angular.JS
        id: Math.random(),
        status: 'connecting'
      });
    };

    this.addServer();
    this.saveServers = () => {
      const newServers = this.newServers;
      const servers = this.servers;
      const updateServers = [];

      for (let i = 0, len = servers.length; i < len; i++) {
        const server = servers[i];
        const {id} = server;
        if (selected[id]) {
          delete selected[id];
          xo.server.remove(id);
        }
        else {
          if (!server.password) {
            delete server.password;
          }
          xo.server.set(server);
          delete server.password;
          updateServers.push(server);
        }
      }
      for (let i = 0, len = newServers.length; i < len; i++) {
        const server = newServers[i];
        const {host, username, password} = server;
        if (!host) {
          continue;
        }
        xo.server.add({
          host,
          username,
          password,
          autoConnect: false,
        }).then(function(id) {
          server.id = id;
          xo.server.connect(id).catch(error => {
            notify.error({
              title: 'Server connection error',
              message: error.message
            });
          });
        });
        delete server.password;
        updateServers.push(server);
      }
      this.servers = updateServers;
      this.newServers.length = 0;
      this.addServer();
    };
  })
  .name
;
