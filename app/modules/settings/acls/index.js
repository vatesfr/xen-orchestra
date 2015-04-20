import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('settings.acls', [
  uiRouter,
  uiSelect,

  xoApi,
  xoServices,
])
  .config(function ($stateProvider) {
    $stateProvider.state('settings.acls', {
      controller: 'SettingsAcls as ctrl',
      url: '/acls',
      resolve: {
        acls(xo) {
          return xo.acl.get();
        },
        users(xo) {
          return xo.user.getAll();
        },
      },
      template: view,
    });
  })
  .controller('SettingsAcls', function ($scope, acls, users, xoApi, xo) {
    this.acls = acls;

    this.users = users;
    {
      let usersById = this.usersById = Object.create(null);
      for (let user of users) {
        usersById[user.id] = user;
      }
    }

    this.objects = xoApi.all;

    let refreshAcls = () => {
      xo.acl.get().then(acls => {
        this.acls = acls;
      });
    };

    this.getUser = (id) => {
      for (let user of this.users) {
        if (user.id === id) {
          return user;
        }
      }
    };

    this.addAcl = () => {
      xo.acl.add(this.subject.id, this.object.id).then(refreshAcls);
    };
    this.removeAcl = (subject, object) => {
      xo.acl.remove(subject, object).then(refreshAcls);
    };
  })
  .filter('selectHighLevel', () => {
    const HIGH_LEVEL_OBJECTS = {
      pool: true,
      host: true,
      VM: true,
      SR: true,
    };
    let isHighLevel = (object) => HIGH_LEVEL_OBJECTS[object.type];

    return (objects) => filter(objects, isHighLevel);
  })
  .name
;
