require 'angular'
require 'angular-ui-router'

#=====================================================================

# FIXME: Mutualize the code between users and servers.

module.exports = angular.module 'xoWebApp.settings', [
  'ui.router'
]
  .config ($stateProvider) ->
    $stateProvider.state 'settings',
      url: '/settings'
      controller: 'SettingsCtrl'
      template: require './view'
  .controller 'SettingsCtrl', ($scope, xo) ->
    $scope.permissions = [
      {
        label: 'None'
        value: 'none'
      }
      {
        label: 'Read'
        value: 'read'
      }
      {
        label: 'Write'
        value: 'write'
      }
      {
        label: 'Admin'
        value: 'admin'
      }
    ]

    # Users
    do ->
      # Fetches them.
      $scope.users = []
      xo.user.getAll().then (users) ->
        $scope.users = users

      # Which ones are selected?
      selected = $scope.selectedUsers = {}

      # New users to create.
      $scope.newUsers = []

      # Add a new user to be created.
      $scope.addUser = ->
        $scope.newUsers.push {
          # Fake (unique) identifier needed by Angular.JS
          id: Math.random()

          # Default permission.
          permission: 'none'
        }
      $scope.addUser()

      # Saves any modifications.
      $scope.saveUsers = ->
        {users, newUsers} = $scope

        # This will be the new list of users with those marked to
        # delete removed.
        updateUsers = []

        for user in users
          {id} = user
          if selected[id]
            delete selected[id]

            # FIXME: this cast should not be necessary.
            xo.user.delete "#{id}"
          else
            # Only sets the password if not empty.
            delete user.password unless user.password

            # TODO: only update users which have been modified.
            xo.user.set user

            # Remove the password from the interface.
            delete user.password

            updateUsers.push user

        for user in newUsers
          {email, permission, password} = user

          # Required field.
          continue unless email

          # Sends the order to XO-Server.
          xo.user.create {email, permission, password}

          # The password should not be displayed.
          delete user.password

          # Adds the user to out local list.
          updateUsers.push user

        $scope.users = updateUsers
        $scope.newUsers = []
        $scope.addUser()

        # TODO: Retrieves an up to date users list from the server.

    # Servers
    do ->
      # Fetches them.
      $scope.servers = []
      xo.server.getAll().then (servers) ->
        $scope.servers = servers

      # Which ones are selected?
      selected = $scope.selectedServers = {}

      # New servers to create.
      $scope.newServers = []

      # Add a new server to be created.
      $scope.addServer = ->
        $scope.newServers.push {
          # Fake (unique) identifier needed by Angular.JS
          id: Math.random()
        }
      $scope.addServer()

      # Saves any modifications.
      $scope.saveServers = ->
        {servers, newServers} = $scope

        # This will be the new list of servers with those marked to
        # delete removed.
        updateServers = []

        for server in servers
          {id} = server
          if selected[id]
            delete selected[id]
            xo.server.remove id
          else
            # Only sets the password if not empty.
            delete server.password unless server.password

            # TODO: only update servers which have been modified.
            xo.server.set server

            # Remove the password from the interface.
            delete server.password

            updateServers.push server

        for server in newServers
          {host, username, password} = server

          # Required field.
          continue unless host

          # Sends the order to XO-Server.
          xo.server.add {host, username, password}

          # The password should not be displayed.
          delete server.password

          # Adds the server to out local list.
          updateServers.push server

        $scope.servers = updateServers
        $scope.newServers = []
        $scope.addServer()

        # TODO: Retrieves an up to date servers list from the server.
