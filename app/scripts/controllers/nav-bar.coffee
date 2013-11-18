'use strict'

angular.module('xoWebApp')
  .controller 'NavBarCtrl', ($scope, $location, session) ->

    # Pre-fills the login form.
    $scope.login = {
      email: 'admin@admin.net'
      password: 'admin'
    }

    # When a searched is entered, we must switch to the list view if
    # necessary.
    $scope.ensureListView = ->
      $location.path '/list'

    # Exposes the session service.
    $scope.session = session
