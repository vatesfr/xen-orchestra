'use strict';

//====================================================================

var angular = require('angular');

//====================================================================

module.exports = angular.module('xoWebApp.genericModal', [
 require('angular-ui-bootstrap'),
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

  // A module exports its name.
  .name
;
