import angular from 'angular'
import uiBootstrap from 'angular-ui-bootstrap'

import template from './view'

// ===================================================================

export default angular.module('xoWebApp.genericModal', [
  uiBootstrap
])
  .controller('GenericModalCtrl', function ($modalInstance, $sce, options) {
    const {
      htmlMessage,
      message,
      noButtonLabel = undefined,
      title,
      yesButtonLabel = 'Ok'
    } = options

    this.title = title
    this.message = message
    this.htmlMessage = htmlMessage && $sce.trustAsHtml(htmlMessage)

    this.yesButtonLabel = yesButtonLabel
    this.noButtonLabel = noButtonLabel
  })
  .service('modal', function ($modal) {
    return {
      alert: ({ title, htmlMessage, message }) => $modal.open({
        controller: 'GenericModalCtrl as $ctrl',
        template,
        resolve: {
          options: () => ({ title, htmlMessage, message })
        }
      }).result,
      confirm: ({ title, htmlMessage, message }) => $modal.open({
        controller: 'GenericModalCtrl as $ctrl',
        template,
        resolve: {
          options: () => ({
            title,
            htmlMessage,
            message,
            noButtonLabel: 'Cancel'
          })
        }
      }).result
    }
  })

  // A module exports its name.
  .name
