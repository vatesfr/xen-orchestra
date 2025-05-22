import { formatDateTime } from '@xen-orchestra/xapi'
import assert from 'node:assert/strict'
// in `other_config` of an incrementally replicated VM or VDI
// contains the UUID of the object used as a base for an incremental export
// used to search for the replica of the base before applying a incremental replication
export const BASE_DELTA_VDI = 'xo:base_delta_vdi'

// in `other_config` of an incrementally replicated VM, contains the UUID of the target SR used for replication
//
// added after the complete replication
export const REPLICATED_TO_SR_UUID = 'xo:backup:sr'

// in other_config of VDIs of an incrementally replicated VM
// contains the UUID of the source  exported object (snapshot or VM)

export const COPY_OF = 'xo:copy_of'

export const DATETIME = 'xo:backup:datetime'

export const JOB_ID = 'xo:backup:job'
export const SCHEDULE_ID = 'xo:backup:schedule'

// contains the number of delta in a chain, stored as a string
export const DELTA_CHAIN_LENGTH = 'xo:backup:deltaChainLength'
// contains the string true if this vdi has been exported successfully
export const EXPORTED_SUCCESSFULLY = 'xo:backup:exported'

// the VM ( not the snapshot) uuid
export const VM_UUID = 'xo:backup:vm'

async function listVdiRefs(xapi, vmRef) {
  return xapi.VM_getDisks(vmRef)
}

async function applyToVmAndVdis(xapi, vmRef, fn) {
  const vdiRefs = await listVdiRefs(xapi, vmRef)
  return Promise.all([fn('VM', vmRef), ...vdiRefs.map(vdiRef => fn('VDI', vdiRef))])
}

async function getDeltaChainLength(xapi, type, ref) {
  const otherConfig = await xapi.getField(type, ref, 'other_config')
  return Number(otherConfig[DELTA_CHAIN_LENGTH] ?? 0)
}

/**
 * set the delta chain length ( number of delta since last base backup) to a VM and its associated VDIs
 *
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @param {Number} length
 * @returns {Promise}
 */
export async function setVmDeltaChainLength(xapi, vmRef, length) {
  return applyToVmAndVdis(xapi, vmRef, async (type, ref) => {
    await xapi.setFieldEntry(type, ref, 'other_config', DELTA_CHAIN_LENGTH, String(length))
  })
}

/**
 * Compute the delta chain length of a VM and its associated VDIs
 * if there is a discrepancy, use, the highest value
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @returns {Promise}
 */
export async function getVmDeltaChainLength(xapi, vmRef) {
  const lengths = await applyToVmAndVdis(xapi, vmRef, async (type, ref) => getDeltaChainLength(xapi, type, ref))
  return Math.max(...lengths)
}

/**
 *
 * Reset the other_config field of a VM and its VDIs
 *
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @returns {Promise}
 */
export function resetVmOtherConfig(xapi, vmRef) {
  return applyToVmAndVdis(xapi, vmRef, (type, ref) => {
    return xapi.setFieldEntries(type, ref, 'other_config', {
      [DATETIME]: null,
      [DELTA_CHAIN_LENGTH]: null,
      [EXPORTED_SUCCESSFULLY]: null,
      [JOB_ID]: null,
      [SCHEDULE_ID]: null,
      [VM_UUID]: null,
      // REPLICATED_TO_SR_UUID is not reset since we can replicate a replication
    })
  })
}

/**
 *
 * used to ensure compatibility with the previous snapshots that were having the config stored only into VM
 *
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @returns {Promise}
 */
export async function populateVdisOtherConfig(xapi, vmRef) {
  const otherConfig = await xapi.getField('VM', vmRef, 'other_config')
  const {
    [DATETIME]: datetime,
    [DELTA_CHAIN_LENGTH]: chainLength,
    [EXPORTED_SUCCESSFULLY]: successfully,
    [JOB_ID]: jobId,
    [REPLICATED_TO_SR_UUID]: replicatedTo,
    [SCHEDULE_ID]: scheduleId,
    [VM_UUID]: vmUuid,
  } = otherConfig

  return applyToVmAndVdis(xapi, vmRef, (type, ref) =>
    xapi.setFieldEntries(type, ref, 'other_config', {
      [DATETIME]: datetime,
      [DELTA_CHAIN_LENGTH]: chainLength,
      [EXPORTED_SUCCESSFULLY]: successfully,
      [JOB_ID]: jobId,
      [REPLICATED_TO_SR_UUID]: replicatedTo,
      [SCHEDULE_ID]: scheduleId,
      [VM_UUID]: vmUuid,
    })
  )
}

/**
 *
 * set the other_config key related to a backup of a VM and its associated VDIs
 *
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @param {*} settings
 * @returns {PRomise}
 */
export async function setVmOtherConfig(xapi, vmRef, { timestamp, jobId, scheduleId, vmUuid, srUuid = null, ...other }) {
  assert.notEqual(timestamp, undefined)
  assert.notEqual(jobId, undefined)
  assert.notEqual(scheduleId, undefined)
  assert.notEqual(vmUuid, undefined)
  // srUuid is nullish for backup
  assert.equal(Object.keys(other).length, 0)

  return applyToVmAndVdis(xapi, vmRef, (type, ref) =>
    xapi.setFieldEntries(type, ref, 'other_config', {
      [REPLICATED_TO_SR_UUID]: srUuid,
      [DATETIME]: formatDateTime(timestamp),
      [JOB_ID]: jobId,
      [SCHEDULE_ID]: scheduleId,
      [VM_UUID]: vmUuid,
    })
  )
}
/**
 *
 * mark the export of he VM and its VDIs as successful
 *
 * @param {Xapi} xapi
 * @param {String} vmRef
 * @returns {Promise}
 */
export async function markExportSuccessfull(xapi, vmRef) {
  return applyToVmAndVdis(xapi, vmRef, (type, ref) =>
    xapi.setFieldEntry(type, ref, 'other_config', EXPORTED_SUCCESSFULLY, 'true')
  )
}
