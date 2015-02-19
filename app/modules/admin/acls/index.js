import angular from 'angular';
import uiRouter from 'angular-ui-router';
import uiSelect from 'angular-ui-select';

import filter from 'lodash.filter';

import xoApi from 'xo-api';
import xoServices from 'xo-services';

import view from './view';

export default angular.module('admin.users', [
  uiRouter,
  uiSelect,

  xoApi,
])
  .config(function ($stateProvider) {
    $stateProvider.state('admin.users', {
      controller: 'AdminUsers as ctrl',
      url: '/users',
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
  .controller('AdminUsers', function ($scope, acls, users, xoApi, xo) {
    this.acls = acls;
    this.users = users;

    Object.defineProperty(this, 'objects', {
      get() {
        return xoApi.all;
      },
    });

    this.addAcl = () => {
      xo.acl.add(this.subject.id, this.object.id).then(() => {
        xo.acl.get().then(acls => {
          this.acls = acls;
        });
      });
    }
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
