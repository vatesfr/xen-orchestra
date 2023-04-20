/* eslint-disable no-console */
import forEach from 'lodash/forEach.js'

import { Collection } from './collection'
import { View } from './view'

// ===================================================================

// Create the collection.
const users = new Collection()
users.getKey = user => user.name

// Inserts some data.
users.add({
  name: 'bob',
})
users.add({
  name: 'clara',
  active: true,
})
users.add({
  name: 'ophelia',
})
users.add({
  name: 'Steve',
  active: true,
})

// -------------------------------------------------------------------

// Create the view.
const activeUsers = new View(users, 'active')

// Register some event listeners to see the changes.
activeUsers.on('add', users => {
  forEach(users, (_, id) => {
    console.log('+ active user:', id)
  })
})
activeUsers.on('remove', users => {
  forEach(users, (_, id) => {
    console.log('- active user:', id)
  })
})

// Make some changes in the future.
setTimeout(function () {
  console.log('-----')

  users.set({
    name: 'ophelia',
    active: true,
  })
  users.set({
    name: 'Steve',
  })
}, 10)
/* eslint-enable no-console */
