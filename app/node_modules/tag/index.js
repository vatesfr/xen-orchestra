import angular from 'angular'
import trim from 'lodash.trim'

import view from './view'

// =====================================================================

export default angular.module('xoWebApp.tag', [])

  .directive('xoTag', () => {
    function link (scope, element, attrs) {
      element.find('.add-button').on('click', function () {
        element.find('input').focus()
      })
    }

    return {
      restrict: 'E',
      template: view,
      scope: {
        object: '='
      },
      controller: 'XoTag as ctrl',
      bindToController: true,
      link
    }
  })

  .controller('XoTag', function ($scope, xo, xoApi) {
    this.id = this.object.id || this.object

    const {get} = xoApi
    if (typeof this.object === 'string') {
      this.object = get(this.object)
    }

    this.add = (tag) => {
      tag = trim(tag)
      if (tag === '') {
        return
      }
      xo.tag.add(tag, this.object.id)
    }

    this.remove = (tag) => {
      xo.tag.remove(tag, this.object.id)
    }
  })

  // A module exports its name.
  .name
