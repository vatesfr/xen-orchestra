import { createLogger } from '@xen-orchestra/log'
import { incorrectState, noHostsAvailable } from 'xo-common/api-errors.js'

const log = createLogger('xo:browser-media')

// CD drives whose invalid tag was reported: they are looked at by each release and recovery attempt
const reportedInvalidTags = new Set()

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
 * The session a CD drive was changed for, from its tag.
 *
 * - `created`: the drive was created for the ISO, and is destroyed once released if it is empty
 * - `backendKind`: `backend-kind` was added for the ISO, and is removed once released
 * - `ejected`: the ISO was ejected while the VM was not halted, and what remains to undo waits for
 *   it to halt, see `settleCd()`
 *
 * @returns {{ session: string, created: boolean, backendKind: boolean, ejected?: true } | undefined}
 * undefined if the drive is not tagged, or if its tag is invalid, e.g. edited by hand
 */
function parseCdTag(vbdRef, otherConfig) {
  const tag = otherConfig[TAG]
  if (tag === undefined) {
    return undefined
  }
  try {
    return JSON.parse(tag)
  } catch (error) {
    if (!reportedInvalidTags.has(vbdRef)) {
      reportedInvalidTags.add(vbdRef)
      log.warn('ignoring a CD drive whose browser media tag is invalid', { error, vbd: vbdRef, tag: tag.slice(0, 200) })
    }
  }
}

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

/** Replace the tag of a CD drive: XAPI cannot set a key of a map which already has it. */
async function retag(xapi, vbdRef, tag) {
  await xapi.call('VBD.remove_from_other_config', vbdRef, TAG)
  await xapi.call('VBD.add_to_other_config', vbdRef, TAG, JSON.stringify(tag))
}

const isHalted = async (xapi, vmRef) => (await xapi.getField('VM', vmRef, 'power_state')) === 'Halted'

/**
 * Insert `vdiRef` in the CD drive `cdRef` of the VM, or in a new one when `cdRef` is undefined.
 *
 * The drive is told to use blkback (`backend-kind: vbd`) for a UEFI firmware: XAPI ignores the
 * `backend-kind` the SR driver sets on a raw LUN VDI when it is inserted in a CD drive, and plugs it
 * on tapdisk, which refuses a raw device (`tapback: ignoring non-blktap2 physical device`). OVMF
 * reads the drive through its PV driver, and waits for it forever, whatever the boot order. A BIOS
 * firmware and the guests read it through the CD drive QEMU emulates, which does not depend on it.
 *
 * `backend-kind` is only ever changed while the VM is halted. On a plugged drive, XAPI hands the
 * drive over to xenopsd under the new kind, and when the VM stops, xenopsd looks for the drive under
 * that kind, misses the device it really is, and waits for it until it gives up, about 10 minutes
 * during which every other operation on the VM waits too. Adding it to a drive plugged on tapdisk
 * does this as well as removing it from one plugged on blkback.
 *
 * An ISO inserted in a running VM whose drive is on tapdisk is therefore read by the guest, but a
 * UEFI firmware hangs if the VM reboots with it: `backend-kind` is added once the VM halts, see
 * `settleCd()`, so that the VM boots from it once started again.
 *
 * @returns {Promise<string>} opaque ref of the CD drive
 */
export async function insertIso(xapi, { vmRef, cdRef, vdiRef, sessionId }) {
  // a CD drive can only be created in a halted VM, see assertInsertable()
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
  const previousTag = parseCdTag(cdRef, otherConfig)
  // the drive of an ISO ejected while the VM was not halted: what remains to undo is taken over by
  // this session
  const ejected = previousTag?.ejected ? previousTag : undefined
  const addBackendKind = otherConfig['backend-kind'] === undefined && (await isHalted(xapi, vmRef))
  const tag = {
    session: sessionId,
    created: ejected?.created ?? false,
    backendKind: (ejected?.backendKind ?? false) || addBackendKind,
  }
  if (otherConfig[TAG] === undefined) {
    await xapi.call('VBD.add_to_other_config', cdRef, TAG, JSON.stringify(tag))
  } else {
    await retag(xapi, cdRef, tag)
  }
  if (addBackendKind) {
    await xapi.call('VBD.add_to_other_config', cdRef, 'backend-kind', 'vbd')
  }
  await xapi.call('VBD.insert', cdRef, vdiRef)
  return cdRef
}

/**
 * Eject the ISO of `sessionId` from its CD drive, if it is still there, and undo what was changed
 * on the drive: a drive created for the ISO is destroyed if it is empty.
 *
 * While the VM is not halted, `backend-kind` must stay as it is, see `insertIso()`: a drive whose
 * `backend-kind` was added for the ISO, or which was created for it, is marked `ejected`, and
 * released once the VM halts, see `settleCd()`. Its drive stays on blkback meanwhile, which reads an
 * ISO from an ISO SR as well.
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
  const tag = parseCdTag(vbdRef, vbd.other_config)
  if (tag?.session !== sessionId) {
    return
  }
  if (!vbd.empty && vdiRefs.includes(vbd.VDI)) {
    await xapi.call('VBD.eject', vbdRef)
    vbd = { ...vbd, empty: true }
  }
  if (await isHalted(xapi, vbd.VM)) {
    await undoCdChanges(xapi, vbdRef, vbd, tag)
  } else if (tag.backendKind || tag.created) {
    if (!tag.ejected) {
      await retag(xapi, vbdRef, { ...tag, ejected: true })
    }
  } else {
    // nothing else was changed
    await xapi.call('VBD.remove_from_other_config', vbdRef, TAG)
  }
}

/** Whether a CD drive has been changed for a browser ISO, see `settleCd()`. */
export function isTaggedCd(vbdRef, otherConfig) {
  return parseCdTag(vbdRef, otherConfig) !== undefined
}

/** Whether `vdiRef` is the ISO of `sessionId`, from the tag of its SR. */
async function isIsoOf(xapi, vdiRef, sessionId) {
  try {
    const srRef = await xapi.getField('VDI', vdiRef, 'SR')
    return (await xapi.getField('SR', srRef, 'sm_config'))[TAG] === sessionId
  } catch (error) {
    if (error.code === 'HANDLE_INVALID') {
      return false // e.g. its SR was forgotten meanwhile
    }
    throw error
  }
}

/**
 * Once the VM is halted, make `backend-kind` of a CD drive changed for a browser ISO follow what it
 * holds, see `insertIso()`: release what remains of an ISO ejected while the VM was not halted, and
 * add `backend-kind` for the ISO of a session inserted while it was running. Nothing is done while
 * the VM is not halted.
 *
 * A VM started again between the check and the change gets its drive under the previous kind: not
 * prevented, since blocking `start` meanwhile would make whatever starts it fail instead, e.g. an
 * offline backup. The window is that of a few XAPI calls, right after the VM halted.
 */
export async function settleCd(xapi, vbdRef) {
  let vbd
  try {
    vbd = await xapi.getRecord('VBD', vbdRef)
  } catch (error) {
    if (error.code === 'HANDLE_INVALID') {
      return // the drive is gone, e.g. with its VM
    }
    throw error
  }
  const tag = parseCdTag(vbdRef, vbd.other_config)
  if (tag === undefined || vbd.currently_attached || !(await isHalted(xapi, vbd.VM))) {
    return
  }
  if (tag.ejected) {
    await undoCdChanges(xapi, vbdRef, vbd, tag)
  } else if (
    !vbd.empty &&
    vbd.other_config['backend-kind'] === undefined &&
    (await isIsoOf(xapi, vbd.VDI, tag.session))
  ) {
    // first, so that a failure leaves at worst `backend-kind` on the drive, which is harmless, rather
    // than a tag claiming it
    await xapi.call('VBD.add_to_other_config', vbdRef, 'backend-kind', 'vbd')
    await retag(xapi, vbdRef, { ...tag, backendKind: true })
  }
}

/** The VM of the drive is halted. */
async function undoCdChanges(xapi, vbdRef, vbd, tag) {
  if (tag.created && vbd.empty) {
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
    if (parseCdTag(vbdRef, otherConfig)?.session === sessionId) {
      refs.push(vbdRef)
    }
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
