import { randomBytes } from 'node:crypto'
import { createLogger } from '@xen-orchestra/log'
import { XMLParser } from 'fast-xml-parser'

const { warn } = createLogger('xo:mixins:LiveMount')

// open-iscsi refuses a CHAP secret outside 12-16 characters
const CHAP_SECRET_LENGTH = 16

// SR.probe() answers the LUN list through a fault instead of a result when the
// device config does not name a SCSIid yet.
const PROBE_LUN_LIST_ERROR = 'SR_BACKEND_FAILURE_107'
const PROBE_NO_TARGET_ERROR = 'SR_BACKEND_FAILURE_141'

// The probe only performs iSCSI discovery, so `lvmoiscsi` is usable to enumerate
// LUNs whatever SR type is created afterwards.
const PROBE_SR_TYPE = 'lvmoiscsi'

const parseXml = (() => {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    ignoreDeclaration: true,
    parseTagValue: false,
    parseAttributeValue: false,
  })
  return xml => parser.parse(Buffer.isBuffer(xml) ? xml.toString() : xml)
})()

/** Random CHAP credentials for one mount; `id` only picks a readable username. */
export function createChapCredentials(id) {
  return {
    user: `xo-${id.slice(0, 8)}`,
    secret: randomBytes(CHAP_SECRET_LENGTH).toString('base64url').slice(0, CHAP_SECRET_LENGTH),
  }
}

/**
 * Ask the host which SCSIid it computes for our LUN. Passing an incomplete
 * device config makes SR.probe() answer with a fault holding the LUN list.
 */
export async function probeScsiId({ xapi, hostRef, deviceConfig, address }) {
  let xml
  try {
    const probed = await xapi.call('SR.probe', hostRef, deviceConfig, PROBE_SR_TYPE, {})
    // it answers the LUN list through a fault, so a plain result is unexpected
    warn('SR.probe returned instead of reporting the LUN list', { probed })
    throw new Error('SR.probe should have reported the LUN list')
  } catch (error) {
    if (error.code === PROBE_NO_TARGET_ERROR) {
      const wrapped = new Error(`the host cannot reach the iSCSI target at ${address}, check iscsi.advertisedAddress`)
      wrapped.cause = error
      throw wrapped
    }
    if (error.code !== PROBE_LUN_LIST_ERROR) {
      throw error
    }
    xml = parseXml(error.params[2])
  }

  const luns = xml['iscsi-target']?.LUN
  const lun = Array.isArray(luns) ? luns[0] : luns
  const SCSIid = lun?.SCSIid?.trim()
  if (SCSIid === undefined || SCSIid === '') {
    throw new Error(`no LUN reported by the host for target ${deviceConfig.targetIQN}`)
  }
  return SCSIid
}
