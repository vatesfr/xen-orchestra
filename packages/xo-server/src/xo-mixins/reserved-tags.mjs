import { forbiddenOperation } from 'xo-common/api-errors.js'

// Tags starting with this prefix belong to the Vates Distributed Firewall: they
// put VMs into its groups (`vdf:role=app`), quarantine them (`vdf:quarantine`)
// and describe networks (`vdf:net=dmz`, `vdf:unprotected`). Host agents follow
// them live, so writing one changes the firewall.
//
// The reservation is in core, not in the plugin: it holds when the plugin is
// unloaded.
export const RESERVED_TAG_PREFIX = 'vdf:'

export const isReservedTag = tag => tag.startsWith(RESERVED_TAG_PREFIX)

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
  constructor(app) {
    this._app = app
  }

  /**
   * The one place that decides whether a user may add or remove tags on an
   * object: every path through which a user writes tags calls it.
   *
   * Reserved tags take an XO administrator or the `administrate` permission
   * on the object's pool; other tags are not checked here. Calls without a
   * user (xo-server's own work) are not checked.
   *
   * @param {object | undefined} user - the XO user making the change
   * @param {object} object - the XO object the tags are written on (for a VM being created, its template)
   * @param {{ added?: string[], removed?: string[] }} change
   * @throws {Error} `forbiddenOperation` if the change touches a reserved tag the user may not write
   */
  async checkTagsChange(user, object, { added = [], removed = [] }) {
    const reserved = [
      ...added.filter(isReservedTag).map(tag => ['add', tag]),
      ...removed.filter(isReservedTag).map(tag => ['remove', tag]),
    ]
    if (reserved.length === 0 || user === undefined || user.permission === 'admin') {
      return
    }

    if (await this._app.hasPermissions(user.id, [[object.$pool, 'administrate']])) {
      return
    }

    const [verb, tag] = reserved[0]
    throw forbiddenOperation(
      `${verb} tag ${tag}`,
      `the tag "${tag}" belongs to the firewall: changing it takes an XO administrator or the administrate permission on the pool`
    )
  }

  // exposed on the app for the REST API, which cannot import xo-server
  diffTags(oldTags, newTags) {
    return diffTags(oldTags, newTags)
  }
}
