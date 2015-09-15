import angular from 'angular'

import view from './view'

// =====================================================================

export default angular.module('xoWebApp.tag', [])

  .directive('xoTag', () => ({
    restrict: 'E',
    template: view,
    scope: {
      object: '='
    },
    controller: 'XoTag as ctrl',
    bindToController: true
  }))

  .controller('XoTag', function ($scope, xo, xoApi) {
    this.id = this.object.id || this.object

    const {get} = xoApi
    if (typeof this.object === 'string') {
      this.object = get(this.object)
    }

    this.add = (tag) => {
      xo.tag.add(tag, this.object.id)
    }

    this.remove = (tag) => {
      xo.tag.remove(tag, this.object.id)
    }
  })

  // A module exports its name.
  .name
