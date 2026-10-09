import { createLogger } from '@xen-orchestra/log'

import { getRequiredEnv } from './index.js'
import { xoConnection } from '../client/xoLibClient.js'

const log = createLogger('xo:qa-test:rbac')

/**
 * How long to watch the event stream before concluding that nothing arrived.
 *
 * The event assertions are the only source of flakiness in the RBAC suite:
 * they prove a *negative* ("nothing was pushed"), so the window has to be long
 * enough for a change made by the admin to have travelled back.
 */
export const EVENT_WINDOW = Number(process.env.RBAC_EVENT_WINDOW ?? 10_000)

/** Prefix of every account created by this suite, so leftovers are recognizable. */
export const TEST_USER_PREFIX = 'qa-rbac-'

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Opens a second, independent XO connection signed in as another account.
 *
 * The whole suite rests on this: an admin connection arranges the fixtures
 * while a low-privilege connection observes what the server actually sends it.
 * The bug is only visible on the wire — xo-web filters client-side, so the UI
 * looks identical whether or not the server does its job.
 *
 * @param {object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @returns {Promise<object>} a signed-in xo-lib client
 */
export function connectAs({ email, password }) {
  return xoConnection({
    xoUrl: getRequiredEnv('HOSTNAME'),
    // XO looks accounts up by name, which is the email for local accounts
    username: email,
    password,
  })
}

/**
 * Creates a throw-away account.
 *
 * @param {object} xo - an admin connection
 * @param {object} [opts]
 * @param {string} [opts.permission] - defaults to `none`, i.e. the "User" role
 * @returns {Promise<{ id: string, email: string, password: string }>}
 */
export async function createTestUser(xo, { permission = 'none' } = {}) {
  const email = `${TEST_USER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}@qa.test`
  const password = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

  const id = await xo.call('user.create', { email, password, permission })
  log.debug('created test user', { id, email, permission })

  return { id, email, password }
}

/**
 * Deletes an account, ignoring the error if it is already gone, so that
 * teardown never masks the failure that led to it.
 *
 * @param {object} xo - an admin connection
 * @param {string} id
 */
export async function deleteTestUser(xo, id) {
  try {
    await xo.call('user.delete', { id })
    log.debug('deleted test user', { id })
  } catch (error) {
    log.warn('failed to delete test user', { error, id })
  }
}

/**
 * Creates a throw-away group.
 *
 * @param {object} xo - an admin connection
 * @returns {Promise<{ id: string, name: string }>}
 */
export async function createTestGroup(xo) {
  const name = `${TEST_USER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const id = await xo.call('group.create', { name })
  log.debug('created test group', { id, name })

  return { id, name }
}

/**
 * Deletes a group, ignoring the error if it is already gone, so that teardown
 * never masks the failure that led to it.
 *
 * @param {object} xo - an admin connection
 * @param {string} id
 */
export async function deleteTestGroup(xo, id) {
  try {
    await xo.call('group.delete', { id })
    log.debug('deleted test group', { id })
  } catch (error) {
    log.warn('failed to delete test group', { error, id })
  }
}

/**
 * Accumulates everything the server pushes on a connection.
 *
 * Note that `exited` may legitimately contain ids the connection never
 * received: removals carry ids only and the object is already gone from the
 * collection when the event is emitted, so the server cannot evaluate who was
 * allowed to see it and forwards them to everyone. Assertions about leaked
 * data must therefore be made on `entered`.
 *
 * @param {object} xo
 * @returns {{ entered: Map<string, object>, exited: Set<string>, reset(): void, stop(): void }}
 */
export function recordPushedObjects(xo) {
  const entered = new Map()
  const exited = new Set()

  const onNotification = notification => {
    if (notification.method !== 'all') {
      return
    }

    const { type, items } = notification.params
    for (const id of Object.keys(items)) {
      if (type === 'enter') {
        entered.set(id, items[id])
      } else {
        exited.add(id)
      }
    }
  }

  xo.on('notification', onNotification)

  return {
    entered,
    exited,
    reset() {
      entered.clear()
      exited.clear()
    },
    stop() {
      xo.removeListener('notification', onNotification)
    },
  }
}

/**
 * Everything the server is willing to hand over to this connection.
 *
 * @param {object} xo
 * @returns {Promise<{ [id: string]: object }>}
 */
export function fetchAllObjects(xo) {
  return xo.call('xo.getAllObjects', {})
}

/**
 * Counts the returned objects by type, to make failures readable.
 *
 * @param {{ [id: string]: object }} objects
 * @returns {{ [type: string]: number }}
 */
export function countByType(objects) {
  const counts = {}
  for (const id of Object.keys(objects)) {
    const { type } = objects[id]
    counts[type] = (counts[type] ?? 0) + 1
  }
  return counts
}

/**
 * Polls until a condition holds, or gives up.
 *
 * Preferable to a flat sleep for assertions that wait for something to
 * *happen*: the test finishes as soon as it does, and only pays the full
 * timeout when it genuinely failed.
 *
 * @param {() => boolean} predicate
 * @param {object} [opts]
 * @param {number} [opts.timeout]
 * @param {number} [opts.interval]
 * @returns {Promise<boolean>} whether the condition held before the timeout
 */
export async function waitUntil(predicate, { timeout = EVENT_WINDOW, interval = 250 } = {}) {
  const deadline = Date.now() + timeout
  do {
    if (predicate()) {
      return true
    }
    await wait(interval)
  } while (Date.now() < deadline)

  return predicate()
}

/**
 * Picks one object of each given type belonging to a pool.
 *
 * @param {{ [id: string]: object }} objects - the admin's view
 * @param {string} poolId
 * @param {string[]} types
 * @returns {{ [type: string]: string | undefined }} one id per type
 */
export function pickObjectsByType(objects, poolId, types) {
  const picked = {}
  for (const id of Object.keys(objects)) {
    const object = objects[id]
    if (object.$pool === poolId && types.includes(object.type) && picked[object.type] === undefined) {
      picked[object.type] = id
    }
  }
  return picked
}

/**
 * Finds the SR holding one of a VM's disks, along with that disk.
 *
 * Granting an SR is only a meaningful non-leak test if a VM actually lives on
 * it: the point is to prove that reaching a VM's storage does not reach the VM.
 *
 * @param {{ [id: string]: object }} objects - the admin's view
 * @param {string} vmId
 * @returns {{ srId: string, vdiId: string } | undefined}
 */
export function findVmStorage(objects, vmId) {
  const vm = objects[vmId]
  for (const vbdId of vm?.$VBDs ?? []) {
    const vbd = objects[vbdId]
    if (vbd === undefined || vbd.is_cd_drive || vbd.VDI == null) {
      continue
    }

    const vdi = objects[vbd.VDI]
    if (vdi?.$SR != null) {
      return { srId: vdi.$SR, vdiId: vdi.id }
    }
  }
}

/**
 * Renders a type breakdown on a single line, most numerous first.
 *
 * Assertions in this suite compare *counts*, never the object collections
 * themselves: a failing `deepEqual` on 28k ids buries the result under a diff
 * nobody can read. The numbers go in the assertion, the detail goes here.
 *
 * @param {{ [id: string]: object }} objects
 * @param {number} [max] - number of types to show before summarising the rest
 * @returns {string}
 */
export function summarize(objects, max = 6) {
  const entries = Object.entries(countByType(objects)).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) {
    return 'nothing'
  }

  const shown = entries.slice(0, max).map(([type, count]) => `${count} ${type}`)
  const remaining = entries.length - max
  if (remaining > 0) {
    shown.push(`and ${remaining} other type${remaining > 1 ? 's' : ''}`)
  }
  return shown.join(', ')
}

/**
 * Makes an object change so that the server has something to push.
 *
 * Tagging goes all the way to XAPI, so it produces a genuine object update
 * rather than something synthesised by xo-server.
 *
 * @param {object} xo - an admin connection
 * @param {string} objectId
 * @param {string} tag
 */
export async function withTag(xo, objectId, tag, fn) {
  await xo.call('tag.add', { id: objectId, tag })
  try {
    return await fn()
  } finally {
    await xo.call('tag.remove', { id: objectId, tag }).catch(error => {
      log.warn('failed to remove the test tag', { error, objectId, tag })
    })
  }
}

/**
 * Grants a permission, making sure it is a *change*.
 *
 * `addAcl` silently ignores an ACL that already exists, which emits no event
 * and therefore triggers no invalidation — correct behaviour, but it turns a
 * test that expects a push into a silent no-op. Revoking first guarantees the
 * grant produces something to observe.
 *
 * @param {object} xo - an admin connection
 * @param {string} subject - a user or group id
 * @param {string} object
 * @param {string} [action]
 */
export async function grant(xo, subject, object, action = 'viewer') {
  await revoke(xo, subject, object, action)
  await xo.call('acl.add', { subject, object, action })
}

/**
 * Revokes a permission, tolerating its absence.
 *
 * @param {object} xo - an admin connection
 * @param {string} subject
 * @param {string} object
 * @param {string} [action]
 */
export async function revoke(xo, subject, object, action = 'viewer') {
  try {
    await xo.call('acl.remove', { subject, object, action })
  } catch (error) {
    log.warn('failed to revoke an ACL', { error, subject, object, action })
  }
}

/**
 * Deletes whatever a previous run left behind.
 *
 * An `after` hook does not run when its `before` threw, so a suite that fails
 * half way leaves users, groups and resource sets on the appliance — and their
 * ACLs with them. The next run then starts from a state it did not choose,
 * which is how a grant becomes a no-op and a test fails for reasons that have
 * nothing to do with the code under test.
 *
 * Deleting a user or a group removes its ACLs, so they need no separate pass.
 *
 * @param {object} xo - an admin connection
 */
export async function purgeLeftoverFixtures(xo) {
  const mine = name => name !== undefined && name.startsWith(TEST_USER_PREFIX)

  const [users, groups, resourceSets] = await Promise.all([
    xo.call('user.getAll'),
    xo.call('group.getAll'),
    xo.call('resourceSet.getAll'),
  ])

  const stale = {
    users: users.filter(({ email }) => mine(email)),
    groups: groups.filter(({ name }) => mine(name)),
    resourceSets: resourceSets.filter(({ name }) => mine(name)),
  }

  const nStale = stale.users.length + stale.groups.length + stale.resourceSets.length
  if (nStale === 0) {
    return
  }

  log.warn('deleting fixtures left by a previous run', {
    users: stale.users.length,
    groups: stale.groups.length,
    resourceSets: stale.resourceSets.length,
  })

  for (const [method, records] of [
    ['user.delete', stale.users],
    ['group.delete', stale.groups],
    ['resourceSet.delete', stale.resourceSets],
  ]) {
    for (const { id } of records) {
      try {
        await xo.call(method, { id })
      } catch (error) {
        log.warn('failed to delete a leftover fixture', { error, method, id })
      }
    }
  }
}
