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
  xo.objects.on('remove', onUpdate)

  xo.getOrWaitObject = async function (id) {
    const object = this.objects.all[id]
    if (object) {
      return object
    }

    return await this.waitObject(id)
  }

  return xo
}

export async function getAllUsers (xo) {
  return await xo.call('user.getAll')
}

export async function getUser (xo, id) {
  const users = await getAllUsers(xo)
  return find(users, {id: id})
}

export async function createUser (xo, userIds, params) {
  const userId = await xo.call('user.create', params)
  userIds.push(userId)
  return userId
}

export async function deleteUsers (xo, userIds) {
  await Promise.all(map(
    userIds,
    userId => xo.call('user.delete', {id: userId})
  ))
}
