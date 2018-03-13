export function getPermissionsForUser ({ userId }) {
  return this.getPermissionsForUser(userId)
}

getPermissionsForUser.permission = 'admin'

getPermissionsForUser.params = {
  userId: {
    type: 'string',
  },
}

// -------------------------------------------------------------------

export function hasPermission ({ userId, objectId, permission }) {
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

export function wait ({ duration, returnValue }) {
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

export async function copyVm ({ vm, sr }) {
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

import fs from 'fs'
import * as Vhd from '../vhd-merge'

export async function syntheticVhd () {
  const handler = await this.getRemoteHandler(
    'de509936-4d07-462c-a89f-25f0fbf1b518'
  )

  const input = await Vhd.createReadStream(
    handler,
    [
      'vm_delta_plop_0f7cd576-3ba4-e4dd-0063-dfc1cecd8eaf',
      'vdi_822806d5-3582-4573-ba6a-1e5a8ad05e58',
      '20180314T131806Z_delta.vhd',
    ].join('/')
  )
  await new Promise((resolve, reject) => {
    input
      .pipe(fs.createWriteStream('/tmp/disk.vhd'))
      .on('error', reject)
      .on('finish', resolve)
  })
}
