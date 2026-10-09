import isEmpty from 'lodash/isEmpty.js'

/**
 * @typedef {import('./_objectVisibility.mjs').IsObjectVisible} IsObjectVisible
 */

/**
 * Turns a batch of object changes into the messages to push to a single
 * connection.
 *
 * An object can leave a user's scope without being destroyed — a VM migrated
 * to a host they cannot see reaches us as an update — so an entered object the
 * user may not see is reported as exited, otherwise their client would keep a
 * stale copy of it forever.
 *
 * Exits are forwarded as-is: the object is already gone from the collection
 * when the event is emitted, so its visibility can no longer be evaluated.
 * They carry ids only.
 *
 * @param {object} opts
 * @param {{ [id: string]: object }} opts.entered
 * @param {{ [id: string]: 0 }} opts.exited
 * @param {IsObjectVisible} [opts.isObjectVisible] - `undefined` means no filtering, as for an admin
 * @returns {{ enter?: { [id: string]: object }, exit?: { [id: string]: 0 } }}
 */
export function computeObjectNotifications({ entered, exited, isObjectVisible }) {
  if (isObjectVisible === undefined) {
    return {
      enter: !isEmpty(entered) ? entered : undefined,
      exit: !isEmpty(exited) ? exited : undefined,
    }
  } else {
    let enter
    let exit

    for (const objectId in entered) {
      if (isObjectVisible(objectId)) {
        if (enter === undefined) enter = { __proto__: null }
        enter[objectId] = entered[objectId]
      } else {
        if (exit === undefined) exit = { __proto__: null }
        exit[objectId] = 0
      }
    }

    if (!isEmpty(exited)) exit = { ...exit, ...exited }

    return { enter, exit }
  }
}
