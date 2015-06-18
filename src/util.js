import {Xo} from 'xo-lib'
import {find, forEach, map} from 'lodash'

export async function getConnection ({
  credentials = {
    // FIXME: sould be username
    email: 'admin@admin.net',
    password: 'admin'
  }
} = {}) {

  const xo = new Xo('localhost:9000')
  await xo.signIn(credentials)

  // Injects waitObject()
  //
  // TODO: integrate in xo-lib.
  const watchers = {}
  xo.waitObject = (id) => {
    return new Promise(resolve => {
      watchers[id] = resolve
    })
  }

  const onUpdate = objects => {
    forEach(objects, (object, id) => {
      if (watchers[id]) {
        watchers[id](object)
        delete watchers[id]
      }
    })
  }
  xo.objects.on('add', onUpdate)
  xo.objects.on('update', onUpdate)

  return xo
}

export async function getAllUsers (xo) {
  return await xo.call('user.getAll')
}

export async function getUser (xo, id) {
  const users = await getAllUsers(xo)
  return find(users, {id: id})
}

export async function deleteAllUsers (xo) {
  await Promise.all(map(
    await getAllUsers(xo),
    user => (user.id !== xo.user.id) && xo.call('user.delete', {id: user.id})
  ))
}
