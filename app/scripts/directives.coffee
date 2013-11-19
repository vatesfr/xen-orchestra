angular.module('xoWebApp')

  # TODO: comment.
  .directive 'stopEvent', ->
    {
      restrict: 'A'
      link: (_, $element, attrs) ->
        $element.bind attrs.stopEvent, ($event) -> $event.stopPropagation()
    }

  # TODO: comment.
  .directive 'indeterminate', ->
    {
      restrict: 'A'
      link: ($scope, $element, attrs) ->
        $scope.$watch attrs.indeterminate, (value) ->
          $element.prop 'indeterminate', value
    }
