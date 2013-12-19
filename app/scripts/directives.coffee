angular.module('xoWebApp')

  # This attribute stops the asendant propagation of a given event.
  #
  # The value of this attribute should be the name of the event to
  # stop.
  .directive 'stopEvent', ->
    (_, $element, attrs) ->
      $element.on attrs.stopEvent, ($event) -> $event.stopPropagation()

  # This attribute works similarly to `ng-click` but do not handle the
  # event if the clicked element:
  # - is an `input`;
  # - has a `ng-click` attribute;
  # - has a `xo-click` attribute;
  # - has a `xo-sref` attribute;
  # - is a link (`a`) and has a `href` attribute.
  .directive 'xoClick', ($parse) ->
    ($scope, $element, attrs) ->
      fn = $parse attrs.xoClick
      current = $element.get(0)
      current.addEventListener(
        'click'
        (event) ->

          # Browse all parent elements of the element the event
          # happened to and abort if one of them should handle the
          # event itself.
          el = event.target
          while el isnt current
            {attributes: attrs, tagName: tag} = el

            return if (
              tag is 'INPUT' or
              attrs['ng-click']? or
              attrs['xo-click']? or
              attrs['xo-sref']? or
              (tag is 'A') and attrs.href?
            )

            el = el.parentNode

          # Stop the propagation.
          event.stopPropagation()

          # Apply the `xo-click` attribute.
          $scope.$apply ->
            fn $scope, {$event: event}
        true
      )

  # TODO: create a directive which allows a link on any element.

  # TODO: Mutualize code with `xoClick`.
  .directive 'xoSref', ($state) ->
    ($scope, $element, attrs) ->
      current = $element.get(0)
      current.addEventListener(
        'click'
        (event) ->

          # Browse all parent elements of the element the event
          # happened to and abort if one of them should handle the
          # event itself.
          el = event.target
          while el isnt current
            {attributes: attrs_, tagName: tag} = el

            return if (
              tag is 'INPUT' or
              attrs_['ng-click']? or
              attrs_['xo-click']? or
              attrs_['xo-sref']? or
              (tag is 'A') and attrs_.href?
            )

            el = el.parentNode

          # Stop the propagation.
          event.stopPropagation()

          # Extracts the state and its parameters for the `xo-sref`
          # attribute.
          match = attrs.xoSref.match /^([^(]+)\s*(?:\((.*)\))?$/
          throw 'invalid SREF' unless match
          state = match[1]
          params = if match[2] then $scope.$eval match[2] else {}

          # Go to this state.
          $state.go state, params
        true
      )
