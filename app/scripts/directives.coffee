angular.module('xoWebApp')

  # This attribute stops the asendant propagation of a given event.
  #
  # The value of this attribute should be the name of the event to
  # stop.
  .directive 'stopEvent', ->
    {
      restrict: 'A'
      link: (_, $element, attrs) ->
        $element.on attrs.stopEvent, ($event) -> $event.stopPropagation()
    }

  # This attribute sets a checkbox to an indeterminate state (only
  # visual) regarding the truth of an expression.
  .directive 'indeterminate', ->
    {
      restrict: 'A'
      link: ($scope, $element, attrs) ->
        $scope.$watch attrs.indeterminate, (value) ->
          $element.prop 'indeterminate', value
    }

  # This attribute works similarly to `ng-click` but do not handle the
  # event if the clicked element:
  # - is an `input`;
  # - has a `ng-click` attribute;
  # - has a `xo-click` attribute;
  # - is a link (`a`) and has a `href` attribute.
  .directive 'xoClick', ($parse) ->
    {
      restrict: 'A'
      link: ($scope, $element, attrs) ->
        fn = $parse attrs.xoClick
        $element.get(0).addEventListener(
          'click'
          (event) ->
            {attributes: attrs, tagName: tag} = event.target
            unless (
              'INPUT' == tag ||
              ('A' == tag) and attrs.href? ||
              attrs['ng-click']? || attrs['xo-click']?
            )
              event.stopPropagation()
              $scope.$apply ->
                fn $scope, {$event: event}
          true
        )
    }

  # TODO: create a directive which allows a link on any element.
