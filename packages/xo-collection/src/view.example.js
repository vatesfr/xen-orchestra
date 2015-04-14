import Collection from './collection'
import View from './view'

const users = new Collection()
users.getId = (user) => user.name

const activeUsers = new View(users, 'active')
activeUsers.on('add', console.log)
activeUsers.on('update', console.log)
activeUsers.on('remove', console.log)

users.add({
  name: 'bob'
})

users.add({
  name: 'clara',
  active: true
})

users.add({
  name: 'ophelia'
})

users.add({
  name: 'Steve',
  active: true
})

setTimeout(function () {
  console.log('-----')

  users.set({
    name: 'ophelia',
    active: true
  })
  users.set({
    name: 'Steve'
  })
}, 10)
