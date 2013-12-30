'use strict'

angular.module('xoWebApp')
  .controller 'SettingsCtrl', ($scope, xoApi) ->
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

    xoApi.call('server.getAll').then (servers) ->
      $scope.servers = servers

    # Users
    do ->
      # Fetches them.
      xoApi.call('user.getAll').then (users) ->
        $scope.users = users

      # Which ones are selected?
      selected = $scope.selectedUsers = {}

      # Saves any modifications.
      $scope.saveUsers = ->
        users = $scope.users

        # This will be the new list of users with those marked to
        # delete removed.
        updateUsers = []

        for user in users
          {id} = user
          if selected[id]
            delete selected[id]
            console.log {id}
            xoApi.call 'user.delete', {id}
          else
            # TODO: only update users which have been modified.
            xoApi.call 'user.set', user
            updateUsers.push user

        $scope.users = updateUsers
