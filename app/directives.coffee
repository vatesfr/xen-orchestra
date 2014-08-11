# TODO: split into multiple modules.
module.exports = angular.module 'xoWebApp.directives', []

  # This attribute stops the ascendant propagation of a given event.
  #
  # The value of this attribute should be the name of the event to
  # stop.
  .directive 'stopEvent', ->
    (_, $element, attrs) ->
      $element.on attrs.stopEvent, ($event) ->
        console.log $event
        $event.stopPropagation()

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
  .directive 'xoSref', ($state, $window) ->
    ($scope, $element, attrs) ->
      current = $element.get(0)
      current.addEventListener(
        'mouseup'
        (event) ->

          {which: button} = event
          return unless button is 1 or button is 2

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
          throw new Error 'invalid SREF' unless match
          state = match[1]
          params = if match[2] then $scope.$eval match[2] else {}

           # Ctrl modifier or middle-button.
          if event.ctrlKey or button is 2
            url = $state.href state, params
            $window.open url
          else
            $state.go state, params
        true
      )

  .directive 'xoVnc', ($window) ->
    # This helper function parses a URL and returns its components:
    # protocol, hostname, port, path and query.
    parseUrl = (url) ->
      a = $window.document.createElement 'a'
      a.href = url
      {protocol, hostname, port, host, pathname, search, hash} = a

      {
        # Protocol lowercased postfixed with ':'.
        protocol

        hostname
        port

        # Same has hostname[:port].
        host

        # The path excluding the query string.
        pathname

        # Query string (including '?').
        search

        # Same has `pathname + search`.
        path: "#{pathname}#{search}"

        # Fragment (including '#').
        hash
      }

    # The directive definition.
    {
      restrict: 'E'

      scope: {
        height: '@?'
        width: '@?'
        url: '@'
        remoteControl: '='
      }

      replace: true
      template: '''
<canvas height="{{height}}" width="{{width}}">
  Sorry, your browser does not support the canvas element.
</canvas>
'''

      link: ($scope, $element, attrs) ->
        # Default options.
        $scope.$watch 'height', -> $scope.height ?= 480
        $scope.$watch 'width', -> $scope.width ?= 640

        rfb = null

        $scope.remoteControl = {
          sendCtrlAltDel: ->
            rfb.sendCtrlAltDel() if rfb?
        }

        # Connects to the specified URL.
        $scope.$watch 'url', (url) ->
          # Properly disconnects first if necessary.
          if rfb?
            rfb.disconnect()
            rfb = null

          # If the URL is empty, nothing to do.
          return unless url

          # Creates the new RFB object.
          rfb = new $window.RFB {
            # Options.
            encrypt: false
            target: $element[0]
            wsProtocols: ['chat']

            # Callbacks.
            onPasswordRequired: (rfb) ->
              rfb.sendPassword $window.prompt 'Password required:'
            onUpdateState: (args...) -> console.log args
          }

          # Parse the URL.
          url = parseUrl url

          # Connects.
          rfb.connect(
            url.hostname
            80 # Ignores the specified port and always use 80.
            '' # TODO: comment.
            url.path.substr 1 # Leading '/' is added by noVNC.
          )

        # Properly disconnect if the console is closed.
        $scope.$on '$destroy', ->
          if rfb?
            rfb.disconnect()
            rfb = null
    }

  .directive 'fixAutofill', ($timeout) ->
    restrict: 'A'
    require: 'ngModel'
    link: ($scope, $elem, attrs, ngModel) ->
      previous = $elem.val()
      $timeout(
        ->
          current = $elem.val()
          if ngModel.$pristine and current isnt previous
            ngModel.$setViewValue current
        5e2
      )
