angular = require 'angular'

#=====================================================================

module.exports = angular.module 'xoWebApp.console', [
  require 'angular-ui-router'
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

        $scope.consoleUrl = "/consoles/#{id}"

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

    $scope.startVM = xo.vm.start
    $scope.stopVM = xo.vm.stop
    $scope.rebootVM = xo.vm.restart

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
      template: require './xo-novnc'

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

          # Parse the URL.
          url = parseUrl url

          isSecure = url.protocol is 'https:' or url.protocol is 'wss:'

          # Creates the new RFB object.
          rfb = new $window.RFB {
            # Options.
            encrypt: isSecure
            # local_cursor: true
            target: $element[0]
            wsProtocols: ['chat']

            # Callbacks.
            onPasswordRequired: (rfb) ->
              rfb.sendPassword $window.prompt 'Password required:'

            # TODO: Display the current status.
            onUpdateState: (args...) -> console.log args
          }

          path = url.path
          # Leading '/' is added by noVNC.
          if path[0] is '/'
            path = path.substr 1

          # Connects.
          rfb.connect(
            url.hostname
            url.port || (if isSecure then 443 else 80)
            '' # TODO: comment.
            path
          )

        # Properly disconnect if the console is closed.
        $scope.$on '$destroy', ->
          if rfb?
            rfb.disconnect()
            rfb = null
    }

  # A module exports its name.
  .name
