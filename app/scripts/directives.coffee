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
      $element.get(0).addEventListener(
        'click'
        (event) ->
          {attributes: attrs, tagName: tag} = event.target
          unless (
            'INPUT' == tag ||
            attrs['ng-click']? ||
            attrs['xo-click']? ||
            attrs['xo-sref']? ||
            ('A' == tag) and attrs.href?
          )
            event.stopPropagation()
            $scope.$apply ->
              fn $scope, {$event: event}
        true
      )

  # TODO: create a directive which allows a link on any element.

  # TODO: Mutualize code with `xoClick`.
  .directive 'xoSref', ($state) ->
    ($scope, $element, attrs) ->
      $element.get(0).addEventListener(
        'click'
        (event) ->
          {attributes: attrs_, tagName: tag} = event.target
          unless (
            'INPUT' == tag ||
            attrs_['ng-click']? ||
            attrs_['xo-click']? ||
            attrs_['xo-sref']? ||
            ('A' == tag) and attrs_.href?
          )
            event.stopPropagation()

            match = attrs.xoSref.match /^([^(]+)\s*(?:\((.*)\))?$/

            throw 'invalid SREF' unless match

            state = match[1]
            params = if match[2] then $scope.$eval match[2] else {}

            $state.go state, params
        true
      )
