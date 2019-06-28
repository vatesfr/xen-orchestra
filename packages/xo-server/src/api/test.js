import assert from 'assert'
import { fromEvent } from 'promise-toolbox'

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
    console.log('export full VM...')
    const input = await srcXapi.exportVm(vm)
    console.log('import full VM...')
    await tgtXapi.deleteVm(await tgtXapi.importVm(input, { srId: sr }))
  }

  // delta
  {
    console.log('export delta VM...')
    const input = await srcXapi.exportDeltaVm(vm)
    console.log('import delta VM...')
    const { transferSize, vm: copyVm } = await tgtXapi.importDeltaVm(input, {
      srId: sr,
    })
    console.log('transfered size:', transferSize)
    await tgtXapi.deleteVm(copyVm)
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

export async function xapiPoolChange({
  currentPoolObject,
  newPoolHostname,
  newPoolObject,
}) {
  const xapi = this.getXapi(currentPoolObject)
  const { _pool: currentPool } = xapi

  xapi._setUrl({ ...xapi._url, hostname: newPoolHostname })
  const [newPool] = await Promise.all([
    // used to trigger the "update" event
    xapi.getAllRecords('pool').then(array => array[0]),
    fromEvent(xapi.objects, 'update'),
  ])

  assert(currentPool.$id !== newPool.$id)
  assert.doesNotThrow(() => this.getXapi(newPoolObject))
  assert.throws(() => this.getXapi(currentPoolObject))
}

xapiPoolChange.permission = 'admin'
xapiPoolChange.params = {
  currentPoolObject: { type: 'string' },
  newPoolHostname: { type: 'string' },
  newPoolObject: { type: 'string' },
}
