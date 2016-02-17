import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'

import template from './view'

// ===================================================================

export default angular.module('xoWebApp.genericModal', [
  uiBootstrap
])
  .controller('GenericModalCtrl', function ($scope, $modalInstance, options) {
    $scope.title = options.title
    $scope.message = options.message

    $scope.yesButtonLabel = options.yesButtonLabel || 'Ok'
    $scope.noButtonLabel = options.noButtonLabel
  })
  .service('modal', function ($modal) {
    return {
      alert: ({ title, message }) => $modal.open({
        controller: 'GenericModalCtrl',
        template,
        resolve: {
          title: title,
          message: message
        }
      }).result,
      confirm: function (opts) {
        const modal = $modal.open({
          controller: 'GenericModalCtrl',
          template,
          resolve: {
            options: function () {
              return {
                title: opts.title,
                message: opts.message,
                noButtonLabel: 'Cancel'
              }
            }
          }
        })

        return modal.result
      }
    }
  })

  // A module exports its name.
  .name
