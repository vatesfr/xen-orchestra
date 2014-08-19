'use strict';

//====================================================================

/* global angular:false */
require('angular');

require('angular-bootstrap');

//====================================================================

module.exports = angular.module('xoWebApp.genericModal', [
  'ui.bootstrap',
])
  .controller('GenericModalCtrl', function ($scope, $modalInstance, options) {
    $scope.title = options.title;
    $scope.message = options.message;

    $scope.yesButtonLabel = options.yesButtonLabel || 'Ok';
    $scope.noButtonLabel = options.noButtonLabel;
  })
  .service('modal', function ($modal) {
    return {
      confirm: function (opts) {
        var modal = $modal.open({
          controller: 'GenericModalCtrl',
          template: require('./view'),
          resolve: {
            options: function () {
              return {
                title: opts.title,
                message: opts.message,
                noButtonLabel: 'Cancel',
              };
            },
          },
        });

        return modal.result;
      }
    };
  })
;
