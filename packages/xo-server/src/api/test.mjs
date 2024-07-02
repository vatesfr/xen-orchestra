import assert from 'assert'
import { fromEvent } from 'promise-toolbox'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

export function getPermissionsForUser({ userId }) {
  return this.getPermissionsForUser(userId)
}

getPermissionsForUser.permission = 'admin'

getPermissionsForUser.params = {
  userId: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function hasPermission({ userId, objectId, permission }) {
  return this.hasPermissions(userId, [[objectId, permission]])
}

hasPermission.permission = 'admin'

hasPermission.params = {
  userId: {
    type: 'string',
  },
  objectId: {
    type: 'string',
  },
  permission: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function wait({ duration, returnValue }) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(returnValue)
    }, +duration)
  })
}

wait.params = {
  duration: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export async function copyVm({ vm, sr }) {
  const srcXapi = this.getXapi(vm)
  const tgtXapi = this.getXapi(sr)

  // full
  {
    // eslint-disable-next-line no-console
    console.log('export full VM...')
    const input = (await srcXapi.VM_export(vm._xapiRef)).body
    // eslint-disable-next-line no-console
    console.log('import full VM...')
    await tgtXapi.VM_destroy(await tgtXapi.VM_import(input, sr._xapiRef))
  }
}

copyVm.description = 'export/import full/delta VM'

copyVm.permission = 'admin'

copyVm.params = {
  vm: { type: 'string' },
  sr: { type: 'string' },
}

copyVm.resolve = {
  vm: ['vm', 'VM'],
  sr: ['sr', 'SR'],
}

// -------------------------------------------------------------------

export async function changeConnectedXapiHostname({ hostname, newObject, oldObject }) {
  const xapi = this.getXapi(oldObject)
  const { pool: currentPool } = xapi

  xapi._setUrl({ ...xapi._url, hostname })
  await fromEvent(xapi.objects, 'finish')
  if (xapi.pool.$id === currentPool.$id) {
    await fromEvent(xapi.objects, 'finish')
  }

  assert(xapi.pool.$id !== currentPool.$id)
  assert.doesNotThrow(() => this.getXapi(newObject))
  assert.throws(() => this.getXapi(oldObject))
}

changeConnectedXapiHostname.description =
  'change the connected XAPI hostname and check if the pool and the local cache are updated'

changeConnectedXapiHostname.permission = 'admin'

changeConnectedXapiHostname.params = {
  hostname: { type: 'string' },
  newObject: { type: 'string', description: "new connection's XO object" },
  oldObject: { type: 'string', description: "current connection's XO object" },
}

// -------------------------------------------------------------------

export async function createTask({ name, objectId, result, duration }) {
  const task = this.tasks.create({ name, objectId, progress: 0 })
  task
    .run(async () => {
      const { abortSignal } = Task

      let i = 0
      let progress = 0
      const handle = setInterval(() => {
        progress += (100 - progress) * 0.1
        Task.set('progress', progress)

        ++i
        Task.set('name', `${name} (step ${i})`)
      }, 5e3)
      try {
        await new Promise((resolve, reject) => {
          setTimeout(resolve, duration)

          abortSignal.addEventListener('abort', () => reject(abortSignal.reason))
        })
        return result
      } finally {
        clearInterval(handle)
      }
    })
    .catch(Function.prototype)
  return task.id
}

createTask.permission = 'admin'

createTask.params = {
  name: { type: 'string', default: 'xo task' },
  objectId: { type: 'string', optional: true },
  result: { optional: true },
  duration: { type: 'number', default: 600e3 },
}
