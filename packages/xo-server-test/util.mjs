import config from './_config.mjs'

import assert from 'node:assert'
import cloneDeep from 'lodash/cloneDeep.js'
import find from 'lodash/find.js'
import forEach from 'lodash/forEach.js'
import map from 'lodash/map.js'

export const rejectionOf = promise =>
  promise.then(
    value => {
      throw value
    },
    reason => reason
  )

// =================================================================

async function getAllUsers(xo) {
  return xo.call('user.getAll')
}

export async function getUser(xo, id) {
  const users = await getAllUsers(xo)
  return find(users, { id })
}

export async function createUser(xo, userIds, params) {
  const userId = await xo.call('user.create', params)
  userIds.push(userId)
  return userId
}

export async function deleteUsers(xo, userIds) {
  await Promise.all(map(userIds, userId => xo.call('user.delete', { id: userId })))
}

// ==================================================================

export function getAllHosts(xo) {
  return xo.objects.indexes.type.host
}

export function getOneHost(xo) {
  const hosts = getAllHosts(xo)
  // eslint-disable-next-line no-unreachable-loop
  for (const id in hosts) {
    return hosts[id]
  }

  throw new Error('no hosts found')
}

// ==================================================================

export async function getNetworkId(xo) {
  const networks = xo.objects.indexes.type.network
  const network = find(networks, { name_label: config.network })
  return network.id
}

// ==================================================================

export async function getVmXoTestPvId(xo) {
  const vms = xo.objects.indexes.type.VM
  const vm = find(vms, { name_label: config.pvVm })
  return vm.id
}

export async function getVmToMigrateId(xo) {
  const vms = xo.objects.indexes.type.VM
  const vm = find(vms, { name_label: config.vmToMigrate })
  return vm.id
}

// ==================================================================

export async function getSrId(xo) {
  const host = getOneHost(xo)
  const pool = await xo.getOrWaitObject(host.$poolId)
  return pool.default_SR
}

// ==================================================================

export async function jobTest(xo) {
  const vmId = await getVmXoTestPvId(xo)
  const jobId = await xo.call('job.create', {
    job: {
      type: 'call',
      key: 'snapshot',
      method: 'vm.snapshot',
      paramsVector: {
        type: 'cross product',
        items: [
          {
            type: 'set',
            values: [
              {
                id: vmId,
                name: 'snapshot',
              },
            ],
          },
        ],
      },
    },
  })
  return jobId
}

export async function scheduleTest(xo, jobId) {
  const schedule = await xo.call('schedule.create', {
    jobId,
    cron: '* * * * * *',
    enabled: false,
  })
  return schedule
}

export async function getSchedule(xo, id) {
  const schedule = xo.call('schedule.get', { id })
  return schedule
}

// ==================================================================

export function deepDelete(obj, path) {
  const lastIndex = path.length - 1
  for (let i = 0; i < lastIndex; i++) {
    obj = obj[path[i]]

    if (typeof obj !== 'object' || obj === null) {
      return
    }
  }
  delete obj[path[lastIndex]]
}

export function almostEqual(actual, expected, ignoredAttributes) {
  actual = cloneDeep(actual)
  expected = cloneDeep(expected)
  forEach(ignoredAttributes, ignoredAttribute => {
    deepDelete(actual, ignoredAttribute.split('.'))
    deepDelete(expected, ignoredAttribute.split('.'))
  })
  assert.equal(actual, expected)
}
