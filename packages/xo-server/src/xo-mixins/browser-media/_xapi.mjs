import { incorrectState, noHostsAvailable } from 'xo-common/api-errors.js'

// tags what a session changed in a pool, so that it can be undone even after a crash: the SR
// (`sm_config`), the CD drive (`other_config`) and the blocked operations of the VM (their reason)
export const TAG = 'xo:browser-media'

export const INSERTABLE_POWER_STATES = ['Running', 'Halted']

// The ISO is attached to a single host, for as long as the browser serves it: the VM must not
// leave that host, nor be saved with a reference to a medium that will not come back. A snapshot
// is not blocked, so that a backup job does not fail during an installation: its CD drive points to
// the ISO, and is emptied when the ISO is ejected.
const BLOCKED_OPERATIONS = ['checkpoint', 'migrate_send', 'pool_migrate', 'suspend']

const blockedReason = sessionId =>
  `an ISO is streamed into this VM from a browser, which must stay connected (${TAG}:${sessionId})`

/**
 * Check what can be checked before inserting the ISO of a session in `vm`, e.g. before starting a
 * task, from the XO object of the VM.
 *
 * @returns {object | undefined} the CD drive to insert the ISO in, undefined if one has to be created
 */
export function assertInsertable(app, vm) {
  if (!INSERTABLE_POWER_STATES.includes(vm.power_state)) {
    throw incorrectState({
      actual: vm.power_state,
      expected: INSERTABLE_POWER_STATES,
      object: vm.id,
      property: 'power_state',
    })
  }
  if (vm.high_availability !== '') {
    // the ISO is attached to a single host: HA could not restart the VM anywhere else
    throw incorrectState({ actual: vm.high_availability, expected: '', object: vm.id, property: 'high_availability' })
  }
  const cds = vm.$VBDs.map(id => app.getObject(id, 'VBD')).filter(vbd => vbd.is_cd_drive)
  const inserted = cds.find(vbd => vbd.VDI != null)
  if (inserted !== undefined) {
    throw incorrectState({ actual: false, expected: true, object: inserted.id, property: 'empty' })
  }
  const cd = cds[0]
  if (vm.power_state === 'Running' && (cd === undefined || !cd.attached)) {
    // a CD drive can only be created or plugged while the VM is halted
    throw incorrectState({ actual: 'Running', expected: 'Halted', object: vm.id, property: 'power_state' })
  }
  return cd
}

/**
 * The host the ISO must be attached to: the one running the VM, or the one it would start on.
 *
 * @returns {Promise<string>} opaque ref of the host
 */
export async function getInsertionHost(xapi, vmRef) {
  const vmRecord = await xapi.getRecord('VM', vmRef)
  if (vmRecord.power_state === 'Running') {
    return vmRecord.resident_on
  }
  const hosts = await xapi.call('VM.get_possible_hosts', vmRef)
  const host = hosts.includes(vmRecord.affinity) ? vmRecord.affinity : hosts[0]
  if (host === undefined) {
    throw noHostsAvailable()
  }
  return host
}

/** Block the operations the ISO does not survive, unless something else already blocks them. */
export async function blockOperations(xapi, vmRef, sessionId) {
  const blocked = await xapi.getField('VM', vmRef, 'blocked_operations')
  for (const operation of BLOCKED_OPERATIONS) {
    if (blocked[operation] === undefined) {
      await xapi.call('VM.add_to_blocked_operations', vmRef, operation, blockedReason(sessionId))
    }
  }
}

/** Unblock the operations blocked for `sessionId`, and only those. */
export async function unblockOperations(xapi, vmRef, sessionId) {
  const blocked = await xapi.getField('VM', vmRef, 'blocked_operations')
  for (const [operation, reason] of Object.entries(blocked)) {
    if (reason.includes(`${TAG}:${sessionId}`)) {
      await xapi.call('VM.remove_from_blocked_operations', vmRef, operation)
    }
  }
}

/**
 * Insert `vdiRef` in the CD drive `cdRef` of the VM, or in a new one when `cdRef` is undefined.
 *
 * The drive is told to use blkback (`backend-kind: vbd`): XAPI ignores the `backend-kind` the SR
 * driver sets on a raw LUN VDI when it is inserted in a CD drive, and uses tapdisk by default, which
 * refuses a raw device, so the guest never reads the ISO.
 *
 * @returns {Promise<string>} opaque ref of the CD drive
 */
export async function insertIso(xapi, { vmRef, cdRef, vdiRef, sessionId }) {
  if (cdRef === undefined) {
    return xapi.VBD_create({
      VM: vmRef,
      VDI: vdiRef,
      type: 'CD',
      mode: 'RO',
      bootable: true,
      throwVbdPlug: true,
      other_config: {
        'backend-kind': 'vbd',
        [TAG]: JSON.stringify({ session: sessionId, created: true, backendKind: true }),
      },
    })
  }
  const otherConfig = await xapi.getField('VBD', cdRef, 'other_config')
  const backendKind = otherConfig['backend-kind'] === undefined
  await xapi.call(
    'VBD.add_to_other_config',
    cdRef,
    TAG,
    JSON.stringify({ session: sessionId, created: false, backendKind })
  )
  if (backendKind) {
    await xapi.call('VBD.add_to_other_config', cdRef, 'backend-kind', 'vbd')
  }
  await xapi.call('VBD.insert', cdRef, vdiRef)
  return cdRef
}

/**
 * Eject the ISO of `sessionId` from its CD drive, if it is still there, and undo what was changed
 * on the drive: a drive created for the ISO is destroyed once the VM is halted.
 *
 * Nothing is done to a drive which was not changed for this session, and only one of `vdiRefs` is
 * ejected: another client may have replaced the ISO meanwhile.
 */
export async function ejectIso(xapi, { vbdRef, vdiRefs, sessionId }) {
  let vbd
  try {
    vbd = await xapi.getRecord('VBD', vbdRef)
  } catch (error) {
    if (error.code === 'HANDLE_INVALID') {
      return // the drive is gone, e.g. with its VM
    }
    throw error
  }
  let tag
  try {
    tag = JSON.parse(vbd.other_config[TAG])
  } catch {}
  if (tag?.session !== sessionId) {
    return
  }
  if (!vbd.empty && vdiRefs.includes(vbd.VDI)) {
    await xapi.call('VBD.eject', vbdRef)
  }
  if (tag.created && (await xapi.getField('VM', vbd.VM, 'power_state')) === 'Halted') {
    await xapi.call('VBD.destroy', vbdRef)
    return
  }
  if (tag.backendKind) {
    await xapi.call('VBD.remove_from_other_config', vbdRef, 'backend-kind')
  }
  await xapi.call('VBD.remove_from_other_config', vbdRef, TAG)
}

/** CD drives of a VM changed for `sessionId`. */
export async function findTaggedCds(xapi, vmRef, sessionId) {
  const refs = []
  for (const vbdRef of await xapi.getField('VM', vmRef, 'VBDs')) {
    const otherConfig = await xapi.getField('VBD', vbdRef, 'other_config')
    try {
      if (JSON.parse(otherConfig[TAG]).session === sessionId) {
        refs.push(vbdRef)
      }
    } catch {}
  }
  return refs
}

/** SRs introduced for `sessionId`, as records. */
export async function findTaggedSrs(xapi, sessionId) {
  const records = await xapi.call('SR.get_all_records')
  return Object.entries(records)
    .filter(([, sr]) => sr.sm_config[TAG] === sessionId)
    .map(([$ref, sr]) => ({ ...sr, $ref }))
}

/** Unplug and forget an SR: SR.forget, never SR.destroy, the LUN is not ours to touch. */
export async function forgetSr(xapi, srRef) {
  for (const pbdRef of await xapi.getField('SR', srRef, 'PBDs')) {
    if (await xapi.getField('PBD', pbdRef, 'currently_attached')) {
      await xapi.callAsync('PBD.unplug', pbdRef)
    }
  }
  await xapi.call('SR.forget', srRef)
}
