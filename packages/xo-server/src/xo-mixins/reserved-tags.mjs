import { createLogger } from '@xen-orchestra/log'
import { hasPrivilegeOn } from '@xen-orchestra/acl'
import { featureUnauthorized, forbiddenOperation } from 'xo-common/api-errors.js'

const log = createLogger('xo:reserved-tags')

// Tags starting with this prefix belong to the Vates Distributed Firewall: they
// put VMs into its groups (`vdf:role=app`), quarantine them (`vdf:quarantine`)
// and describe networks (`vdf:net=dmz`, `vdf:unprotected`). Host agents follow
// them live, so writing one changes the firewall.
//
// The reservation is in core, not in the plugin: it holds when the plugin is
// unloaded.
export const RESERVED_TAG_PREFIX = 'vdf:'

export const isReservedTag = tag => tag.startsWith(RESERVED_TAG_PREFIX)

// a copy of a quarantined VM stays quarantined: tightening is always safe to inherit
const QUARANTINE_TAG = 'vdf:quarantine'

// Who may do what with a pool's firewall: the actions of the RBAC `firewall`
// resource, whose object is the pool, and the legacy ACL on the pool that
// counts as each of them (`administrate` as every action, `view` as `read`).
const LEGACY_PERMISSION_BY_FIREWALL_ACTION = {
  read: 'view',
  publish: 'administrate',
  membership: 'administrate',
  'quarantine:add': 'administrate',
  'quarantine:remove': 'administrate',
}

// Network tags: a group scoped to networks applies on the networks carrying
// its tags (`vdf:net=dmz`), and `vdf:unprotected` takes a whole network out of
// the firewall.
const NETWORK_TAG_PREFIX = 'vdf:net='
const UNPROTECTED_TAG = 'vdf:unprotected'
export const isNetworkTag = tag => tag.startsWith(NETWORK_TAG_PREFIX) || tag === UNPROTECTED_TAG

/**
 * The firewall actions adding or removing a reserved tag on an object takes,
 * all of them:
 *
 * - on a network, `publish`, whatever the tag: a network's tags decide where
 *   the policies apply, as publishing them does;
 * - `vdf:quarantine`: putting the VM into quarantine or lifting it;
 * - a network tag on another object (a VM): it means nothing to the
 *   firewall there, but a group may select VMs by any tag, so `membership`,
 *   and `publish` as for a network tag anywhere;
 * - every other one (group tags): `membership`.
 *
 * @param {'add' | 'remove'} change
 * @param {string} tag - a reserved tag
 * @param {string} objectType - the XO type of the object carrying it (`VM`, `network`…)
 * @returns {Array<'publish' | 'membership' | 'quarantine:add' | 'quarantine:remove'>}
 */
export function firewallActionsForTag(change, tag, objectType) {
  if (objectType === 'network') {
    return ['publish']
  }
  if (tag === QUARANTINE_TAG) {
    return [`quarantine:${change}`]
  }
  if (isNetworkTag(tag)) {
    return ['membership', 'publish']
  }
  return ['membership']
}

// what a refusal says the user lacks
const describeFirewallRight = (action, pool = 'the pool') =>
  `the firewall ${action} privilege on ${pool}, the ${LEGACY_PERMISSION_BY_FIREWALL_ACTION[action]} permission on it, or an XO administrator`

// Where prevention ends, detect (vdf#141 §7): xe, another XO or any XAPI
// client can change these tags, XO can't prevent it. XO notes the reserved
// tag changes it lets through (`checkTagsChange`) or makes itself
// (`stripInheritedReservedTags`), then classifies each change XAPI reports
// on a VM or network: made through XO when a noted one matches it, outside
// XO otherwise. Each change is logged and emitted on the app as this event:
//
//   { objectId, objectType, poolId, tag, change: 'add' | 'remove',
//     userId (through XO only, 'xo' for XO's own), outsideXo, timestamp }
//
// Limits:
// - objects XO loads (at startup, on (re)connection to a pool) and new
//   objects are taken as they are: changes made while XO wasn't watching are
//   missed, and an object that appears already tagged isn't reported;
// - a VM XO is creating gets its tags set after it appears (createVm): its
//   changes nobody noted are part of its creation, not reported, while its
//   `xo:creation` date is less than 30 seconds old (CREATION_WINDOW_MS);
// - a change XO let through but that failed is never reported by XAPI: its
//   note expires; one that changes nothing (adding a tag the object has,
//   removing one it lacks) isn't noted.
export const RESERVED_TAG_CHANGE_EVENT = 'xo:reservedTagChanged'

// how long a noted change waits for XAPI to report it: XAPI reports a change
// within seconds, a longer wait lets a leftover note misattribute a later one
const NOTE_TTL_MS = 30 * 1000

// how long after its creation a VM is still being created by XO (createVm):
// XO sets a new VM's tags right after creating it, well within 30 seconds; the
// price is that a change made outside XO in a new VM's first 30 seconds is not
// reported
const CREATION_WINDOW_MS = 30 * 1000

// A new VM's inherited reserved tags `stripInheritedReservedTags` removed,
// emitted on the app once they are removed, for a VM that may not be in
// XO's objects yet:
//
//   { vmId, vmName, poolId, tags, userId (who created the VM), timestamp }
//
// Core only logs it; the plugin shows it.
export const RESERVED_TAGS_STRIPPED_EVENT = 'xo:reservedTagsStripped'

const WATCHED_TYPES = new Set(['VM', 'network'])

const noteKey = (objectId, change, tag) => `${objectId}\0${change}\0${tag}`

/**
 * Tags added and removed when `oldTags` are replaced by `newTags`
 *
 * @param {string[]} oldTags
 * @param {string[]} newTags
 * @returns {{ added: string[], removed: string[] }}
 */
export function diffTags(oldTags, newTags) {
  return {
    added: newTags.filter(tag => !oldTags.includes(tag)),
    removed: oldTags.filter(tag => !newTags.includes(tag)),
  }
}

export default class ReservedTags {
  // noted changes (noteKey) → [{ user, at }], oldest first
  #notes = new Map()

  // the reserved tags of each VM and network, as XO last saw them
  #seen = new Map()

  constructor(app) {
    this._app = app

    app.hooks?.on('start', () => {
      const { objects } = app
      objects.on('add', this.#onAdd)
      objects.on('update', this.#onUpdate)
      objects.on('remove', this.#onRemove)
    })
    app.hooks?.on('stop', () => {
      const { objects } = app
      objects.removeListener('add', this.#onAdd)
      objects.removeListener('update', this.#onUpdate)
      objects.removeListener('remove', this.#onRemove)
    })
  }

  #note(objectId, user, { added = [], removed = [] }) {
    const now = Date.now()
    for (const [key, notes] of this.#notes) {
      const kept = notes.filter(note => now - note.at < NOTE_TTL_MS)
      if (kept.length === 0) {
        this.#notes.delete(key)
      } else {
        this.#notes.set(key, kept)
      }
    }
    const userId = user?.id ?? 'xo'
    for (const [change, tags] of [
      ['add', added],
      ['remove', removed],
    ]) {
      for (const tag of tags.filter(isReservedTag)) {
        const key = noteKey(objectId, change, tag)
        this.#notes.set(key, [...(this.#notes.get(key) ?? []), { user: userId, at: now }])
      }
    }
  }

  // the user who made this change through XO (consumed), if any
  #matchNote(objectId, change, tag, now) {
    const key = noteKey(objectId, change, tag)
    const notes = (this.#notes.get(key) ?? []).filter(note => now - note.at < NOTE_TTL_MS)
    const note = notes.shift()
    if (notes.length === 0) {
      this.#notes.delete(key)
    } else {
      this.#notes.set(key, notes)
    }
    return note?.user
  }

  // loaded or new: taken as it is, nothing reported
  #onAdd = objects => {
    for (const [id, object] of Object.entries(objects)) {
      this.#see(id, object)
    }
  }

  #onUpdate = objects => {
    for (const [id, object] of Object.entries(objects)) {
      const before = this.#seen.get(id)
      const after = this.#see(id, object)
      if (before !== undefined && after !== undefined) {
        this.#report(object, diffTags(before, after))
      }
    }
  }

  #onRemove = objects => {
    for (const id of Object.keys(objects)) {
      this.#seen.delete(id)
    }
  }

  #see(id, object) {
    if (!WATCHED_TYPES.has(object.type)) {
      this.#seen.delete(id)
      return
    }
    const tags = (object.tags ?? []).filter(isReservedTag)
    this.#seen.set(id, tags)
    return tags
  }

  #report(object, { added, removed }) {
    const now = Date.now()
    const isBeingCreated = object.type === 'VM' && now - Date.parse(object.creation?.date) < CREATION_WINDOW_MS
    for (const [change, tags] of [
      ['add', added],
      ['remove', removed],
    ]) {
      for (const tag of tags) {
        const userId = this.#matchNote(object.id, change, tag, now)
        if (userId === undefined && isBeingCreated) {
          continue
        }
        const event = {
          objectId: object.id,
          objectType: object.type,
          poolId: object.$pool,
          tag,
          change,
          ...(userId === undefined ? {} : { userId }),
          outsideXo: userId === undefined,
          timestamp: now,
        }
        if (event.outsideXo) {
          log.warn('reserved tag changed outside XO', event)
        } else {
          log.info('reserved tag changed through XO', event)
        }
        this._app.emit(RESERVED_TAG_CHANGE_EVENT, event)
      }
    }
  }

  /**
   * The one place that decides whether a user may add or remove tags on an
   * object: every path through which a user writes tags calls it.
   *
   * Each reserved tag takes its firewall actions (`firewallActionsForTag`) on
   * the object's pool (`hasFirewallRight`); other tags are not checked here.
   * Calls without a user (xo-server's own work) are not checked.
   *
   * A change it lets through is noted as XO's, for XAPI's report of it, if
   * it changes the object's tags (as XO sees them).
   *
   * @param {object | undefined} user - the XO user making the change
   * @param {object} object - the XO object the tags are written on (for a VM being created, its template)
   * @param {{ added?: string[], removed?: string[] }} change
   * @throws {Error} `forbiddenOperation` if the change touches a reserved tag the user may not write
   */
  async checkTagsChange(user, object, { added = [], removed = [] }) {
    await this.#checkPermission(user, object, { added, removed })
    // a change that changes nothing produces no XAPI event: a note would wait for another change
    const tags = object.tags ?? []
    this.#note(object.id, user, {
      added: added.filter(tag => !tags.includes(tag)),
      removed: removed.filter(tag => tags.includes(tag)),
    })
  }

  /**
   * The one decision on the firewall's rights: may this user do this action
   * (of the RBAC `firewall` resource) on the firewall of this pool. The tag
   * guard decides with it, and so do the firewall plugin's routes.
   *
   * Yes for an XO administrator; for a user with the legacy ACL that counts
   * as the action on the pool (`administrate` for every action, `view` for
   * `read`); for a user whose RBAC privileges allow `firewall <action>` on
   * the pool (the object their selectors are evaluated against). Calls
   * without a user (xo-server's own work) are allowed.
   *
   * Where the RBAC feature is not available (an XOA whose licence lacks it),
   * only legacy ACLs count. From the sources, it always is: RBAC privileges
   * then count as on any XOA that has it, a user without a role has none.
   *
   * @param {object | undefined} user - the XO user
   * @param {string} poolId
   * @param {'read' | 'publish' | 'membership' | 'quarantine:add' | 'quarantine:remove'} action
   * @returns {Promise<boolean>}
   */
  async hasFirewallRight(user, poolId, action) {
    const legacyPermission = LEGACY_PERMISSION_BY_FIREWALL_ACTION[action]
    if (legacyPermission === undefined) {
      throw new TypeError(`unknown firewall action: ${action}`)
    }
    if (user === undefined || user.permission === 'admin') {
      return true
    }
    if (await this._app.hasPermissions(user.id, [[poolId, legacyPermission]])) {
      return true
    }

    let userPrivileges
    try {
      userPrivileges = await this._app.getAclV2UserPrivileges(user.id)
    } catch (error) {
      if (featureUnauthorized.is(error)) {
        return false
      }
      throw error
    }
    return (
      userPrivileges.length !== 0 &&
      hasPrivilegeOn({
        user,
        resource: 'firewall',
        action,
        // throws for an unknown pool: refused
        objects: this._app.getObject(poolId, 'pool'),
        userPrivileges,
      })
    )
  }

  // the guard's decision, without noting the change
  async #checkPermission(user, object, { added = [], removed = [] }) {
    const reserved = [
      ...added.filter(isReservedTag).map(tag => ['add', tag]),
      ...removed.filter(isReservedTag).map(tag => ['remove', tag]),
    ]

    // action → allowed
    const decided = new Map()
    for (const [change, tag] of reserved) {
      for (const action of firewallActionsForTag(change, tag, object.type)) {
        if (!decided.has(action)) {
          decided.set(action, await this.hasFirewallRight(user, object.$pool, action))
        }
        if (!decided.get(action)) {
          throw forbiddenOperation(
            `${change} tag ${tag}`,
            `the tag "${tag}" belongs to the firewall: ${change === 'add' ? 'adding' : 'removing'} it ${object.type === 'network' ? 'on a network ' : ''}takes ${describeFirewallRight(action)}`
          )
        }
      }
    }
  }

  /**
   * Before a VM migrates to another pool: it arrives there with its group
   * tags (reserved, but not `vdf:quarantine`), which puts it into that pool's
   * firewall groups. For the user, it is as if they added them on the
   * destination pool: it takes `membership` there. `vdf:quarantine` only
   * tightens, it is not checked. Nothing is stripped and nothing is noted: the VM's tags
   * don't change.
   *
   * Migrations within the pool and calls without a user are not checked.
   *
   * @param {object | undefined} user - the XO user migrating the VM
   * @param {object} vm - the XO record of the VM
   * @param {string} destinationPoolId - the pool of the destination host
   * @throws {Error} `forbiddenOperation` if the user may not bring these tags to the destination pool
   */
  async checkMigration(user, vm, destinationPoolId) {
    const groupTags = (vm.tags ?? []).filter(tag => isReservedTag(tag) && tag !== QUARANTINE_TAG)
    if (destinationPoolId === vm.$pool || groupTags.length === 0) {
      return
    }

    if (!(await this.hasFirewallRight(user, destinationPoolId, 'membership'))) {
      throw forbiddenOperation(
        'migrate VM to another pool',
        `the VM carries firewall tags (${groupTags.join(', ')}): migrating it to another pool takes ${describeFirewallRight('membership', 'the destination pool')}`
      )
    }
  }

  /**
   * The tags of a VM created from a template by `vm.create`, checked: the new
   * VM gets `tags` instead of the template's, or, when `tags` is omitted, the
   * template's, or the resource set's if there is one; the resource set's
   * tags are added in every case. Compared with the template's:
   *
   * - a reserved tag added (not by the resource set, which an administrator
   *   chose) goes through the guard;
   * - a group tag (reserved, but not `vdf:quarantine`) not kept is fine: it
   *   is what `stripInheritedReservedTags` would do;
   * - `vdf:quarantine` is kept when `tags` is omitted, whoever the user is;
   *   `tags` without it remove it: through the guard;
   * - a group tag kept is inherited: call `stripInheritedReservedTags` on the
   *   new VM, before it can be started.
   *
   * @param {object | undefined} user - the XO user creating the VM
   * @param {object} template - the XO record of the template
   * @param {string[] | undefined} tags - the tags requested, if any
   * @param {string[] | undefined} resourceSetTags - the tags of the resource set, if any
   * @returns {Promise<string[]>} the tags of the new VM
   * @throws {Error} `forbiddenOperation` if the user may not add or remove a reserved tag this way
   */
  async checkNewVmTags(user, template, tags, resourceSetTags) {
    const templateTags = template.tags ?? []
    let newTags
    if (tags !== undefined) {
      newTags = [...tags, ...(resourceSetTags ?? [])]
    } else {
      newTags = [...(resourceSetTags ?? templateTags)]
      // nobody asked to remove it
      if (templateTags.includes(QUARANTINE_TAG) && !newTags.includes(QUARANTINE_TAG)) {
        newTags.push(QUARANTINE_TAG)
      }
    }

    // the VM doesn't exist yet: nothing to note, its tags are part of its creation
    await this.#checkPermission(user, template, {
      added: newTags.filter(tag => !templateTags.includes(tag) && !resourceSetTags?.includes(tag)),
      removed: templateTags.includes(QUARANTINE_TAG) && !newTags.includes(QUARANTINE_TAG) ? [QUARANTINE_TAG] : [],
    })
    return newTags
  }

  /**
   * A new VM (clone, copy, import, instance of a template) carries its source's
   * tags: for the user who created it, it is as if they added them. The
   * reserved tags the guard (`checkTagsChange`) does not let them add on the
   * new VM are removed from it, except `vdf:quarantine`, which always stays.
   *
   * Call it before the new VM can be started; if the removal fails, it throws
   * and the VM must not be started. Calls without a user are not checked.
   * Tags removed are emitted on the app (`RESERVED_TAGS_STRIPPED_EVENT`).
   *
   * @param {object | undefined} user - the XO user who created the VM
   * @param {object} vm - the XAPI record of the new VM
   * @param {string[]} [inheritedTags] - the tags it inherited, if not all its tags
   * @returns {Promise<string[]>} the tags removed
   */
  async stripInheritedReservedTags(user, vm, inheritedTags = vm.tags) {
    const candidates = inheritedTags.filter(
      tag => isReservedTag(tag) && tag !== QUARANTINE_TAG && vm.tags.includes(tag)
    )
    if (candidates.length === 0) {
      return []
    }

    // the guard decides on the XO record, which xo-server may not have received yet
    const object = vm.$xapi.xo.addObject(vm)
    const stripped = []
    // one tag at a time: the guard may allow some and not others
    for (const tag of candidates) {
      try {
        await this.checkTagsChange(user, object, { added: [tag] })
      } catch (error) {
        if (!forbiddenOperation.is(error)) {
          throw error
        }
        stripped.push(tag)
      }
    }

    if (stripped.length !== 0) {
      this.#note(object.id, undefined, { removed: stripped })
      await vm.set_tags(vm.tags.filter(tag => !stripped.includes(tag)))
      log.info('reserved tags stripped from a new VM', { vm: vm.uuid, tags: stripped, user: user.id })
      this._app.emit(RESERVED_TAGS_STRIPPED_EVENT, {
        vmId: object.id,
        vmName: vm.name_label,
        poolId: object.$pool,
        tags: stripped,
        userId: user.id,
        timestamp: Date.now(),
      })
    }
    return stripped
  }

  /**
   * `stripInheritedReservedTags`, for a path with no cleanup of its own: if
   * the removal fails, the new VM is destroyed with its disks, so that it is
   * never left behind with the tags, then the removal's error is thrown. A
   * failed destroy is logged.
   *
   * @param {object | undefined} user - the XO user who created the VM
   * @param {object} vm - the XAPI record of the new VM
   * @param {string[]} [inheritedTags] - the tags it inherited, if not all its tags
   * @returns {Promise<string[]>} the tags removed
   */
  async stripInheritedReservedTagsOrDestroy(user, vm, inheritedTags) {
    try {
      return await this.stripInheritedReservedTags(user, vm, inheritedTags)
    } catch (error) {
      try {
        await vm.$xapi.VM_destroy(vm.$ref, { deleteDisks: true, force: true })
      } catch (destroyError) {
        log.error('a new VM whose reserved tags could not be stripped could not be destroyed', {
          vm: vm.uuid,
          error: destroyError,
        })
      }
      throw error
    }
  }

  // exposed on the app for the REST API, which cannot import xo-server
  diffTags(oldTags, newTags) {
    return diffTags(oldTags, newTags)
  }
}
