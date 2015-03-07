import angular from 'angular';
import uiBootstrap from 'angular-ui-bootstrap';

//====================================================================

export default angular.module('xoWebApp.genericModal', [
 uiBootstrap,
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
