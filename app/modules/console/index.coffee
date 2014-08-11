require 'angular'
require 'angular-ui-router'

#=====================================================================

module.exports = angular.module 'xoWebApp.console', [
  'ui.router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'consoles_view',
      url: '/consoles/:id'
      controller: 'ConsoleCtrl'
      template: require './view'
  .controller 'ConsoleCtrl', ($scope, $stateParams, xoApi, xo) ->
    {id} = $stateParams
    {get} = xo
    push = Array::push.apply.bind Array::push
    merge = do ->
      (args...) ->
        result = []
        for arg in args
          push result, arg if arg?
        result

    $scope.$watch(
      -> xo.revision
      ->
        unless xoApi.user
          $scope.consoleUrl = ''
          $scope.VDIs = []
          return

        VM = $scope.VM = xo.get id
        return unless VM? and VM.power_state is 'Running'

        pool = get VM.poolRef
        return unless pool

        $scope.consoleUrl = do ->
          for console in VM.consoles
            if console.protocol is 'rfb'
              return "#{console.location}&session_id=#{pool.$sessionId}"
          ''

        host = get VM.$container # host because the VM is running.
        return unless host

        # FIXME: We should filter on connected SRs (PBDs)!
        SRs = get (merge host.SRs, pool.SRs)
        $scope.VDIs = do ->
          VDIs = []
          for SR in SRs
            push VDIs, SR.VDIs if SR.content_type is 'iso'
          get VDIs

        cdDrive = do ->
          return VBD for VBD in (get VM.$VBDs) when VBD.is_cd_drive
          null

        $scope.mountedIso =
          if cdDrive and cdDrive.VDI and (VDI = get cdDrive.VDI)
            VDI.UUID
          else
            ''
    )

    $scope.eject = ->
      xo.vm.ejectCd id
    $scope.insert = (disc_id) ->
      xo.vm.insertCd id, disc_id, true
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
