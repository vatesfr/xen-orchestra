import {Xo} from 'xo-lib'
import {find, forEach, map, cloneDeep} from 'lodash'
import expect from 'must'

export async function getConfig () {
  return {
    adminCredentials: {
      email: 'admin@admin.net',
      password: 'admin'
    },
    xoServerUrl: 'localhost:9000',
    xenServer1: {
      host: '192.168.1.3',
      username: 'root',
      password: 'qwerty'
    }
  }
}

export async function getConnection ({
  credentials
} = {}) {
  const config = await getConfig()
  const xo = new Xo(config.xoServerUrl)
  await xo.signIn(
    credentials === undefined ?
      config.adminCredentials :
      credentials
  )

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

// =================================================================

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

// ==================================================================

export function getAllHosts (xo) {
  return xo.objects.indexes.type.host
}

export function getOneHost (xo) {
  const hosts = getAllHosts(xo)
  for (const id in hosts) {
    return hosts[id]
  }

  throw new Error('no hosts found')
}

// ==================================================================

export function deepDelete (obj, path) {
  const lastIndex = path.length - 1
  for (let i = 0; i < lastIndex; i++) {
    obj = obj[path[i]]

    if (typeof obj !== 'object' || obj === null) {
      return
    }
  }
  delete obj[path[lastIndex]]
}

export function almostEqual (actual, expected, ignoredAttributes) {
  actual = cloneDeep(actual)
  expected = cloneDeep(expected)
  forEach(ignoredAttributes, (ignoredAttribute) => {
    deepDelete(actual, ignoredAttribute.split('.'))
    deepDelete(expected, ignoredAttribute.split('.'))
  })
  expect(actual).to.be.eql(expected)
}

export async function waitObjectState (xo, id, predicate) {
  let obj = xo.objects.all[id]
  while (true) {
    try {
      await predicate(obj)
      return
    } catch (_) {}
    // If failed, wait for next object state/update and retry.
    obj = await xo.waitObject(id)
  }
}
