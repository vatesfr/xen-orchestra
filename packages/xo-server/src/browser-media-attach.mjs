import { createLogger } from '@xen-orchestra/log'
import { incorrectState, invalidParameters, noHostsAvailable } from 'xo-common/api-errors.js'
import { randomUUID } from 'node:crypto'
import WebSocket from 'ws'
import { forgetBrowserMediaSr } from './browser-media-recovery.mjs'

const log = createLogger('xo:browser-media')

const ATTACHABLE_POWER_STATES = ['Running', 'Halted']
const MAX_NAME_LENGTH = 255
const CLEANUP_RETRY_DELAY = 30e3
// detects an ISO ejected by another client, to release the browser
const EJECT_CHECK_INTERVAL = 15e3

function assertAttachablePowerState(vm, powerState) {
  if (!ATTACHABLE_POWER_STATES.includes(powerState)) {
    throw incorrectState({ actual: powerState, expected: ATTACHABLE_POWER_STATES, object: vm, property: 'power_state' })
  }
}

/**
 * Open a session waiting for the browser to connect to its `socket` URL.
 *
 * @returns {{ id: string, socket: string }}
 */
export function createSession(media, { owner, vm, name, size }) {
  if (typeof name !== 'string' || name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw invalidParameters(`the ISO name must be between 1 and ${MAX_NAME_LENGTH} characters`)
  }
  assertAttachablePowerState(vm.id, vm.power_state)
  const session = media.create({ owner, vm: vm.id, name, size })
  return { id: session.id, socket: `/api/browser-media/${session.browserToken}/socket` }
}

/**
 * Synchronous, so that callers can report it before starting a task.
 *
 * @throws if the browser is not connected, or the session is already attached
 */
export function assertSessionAttachable(session) {
  if (session.operation !== undefined) {
    throw incorrectState({ actual: 'attached', expected: 'connected', object: session.id, property: 'status' })
  }
  if (session.socket?.readyState !== WebSocket.OPEN) {
    throw incorrectState({
      actual: 'waiting-for-browser',
      expected: 'connected',
      object: session.id,
      property: 'status',
    })
  }
}

/**
 * Serve the session's ISO as a read-only LUN and insert it in the VM CD drive.
 *
 * @returns {Promise<{ vdi: string }>} uuid of the VDI inserted in the CD drive
 */
export async function attachSession(xo, media, session) {
  assertSessionAttachable(session)
  const vm = xo.getObject(session.vm, 'VM')
  const xapi = xo.getXapi(vm)
  const resources = {}
  const cleanup = async () => {
    if (resources.srUuid !== undefined) {
      await forgetBrowserMediaSr(xo.getXapi(vm), resources.srUuid, session.id)
      await media.recovery?.forget(resources.srUuid)
      delete resources.srUuid
    }
    if (resources.target !== undefined) {
      await resources.target.close()
      delete resources.target
    }
    media.release(session)
  }
  // Keep the target and resource references until detach succeeds, so a failed
  // cleanup can be retried. Never destroy or format the raw LUN.
  let cleaning
  session.cleanup = () =>
    cleaning ??
    (cleaning = cleanup().finally(() => {
      cleaning = undefined
    }))
  session.onClose = () => {
    clearInterval(session.monitor)
    const attempt = () =>
      session.cleanup().catch(error => {
        log.warn('could not release browser media storage, will retry', { error, session: session.id })
        if (!media.stopping) session.cleanupTimer = setTimeout(attempt, CLEANUP_RETRY_DELAY).unref()
      })
    // a failed attachment was already reported to its caller
    session.operation.catch(() => {}).then(attempt)
  }
  session.operation = (async () => {
    const record = await xapi.call('VM.get_record', vm._xapiRef)
    assertAttachablePowerState(vm.id, record.power_state)
    let host = record.resident_on
    if (record.power_state === 'Halted') {
      const hosts = await xapi.call('VM.get_possible_hosts', vm._xapiRef)
      host = hosts.includes(record.affinity) ? record.affinity : hosts[0]
      if (host === undefined) throw noHostsAvailable()
    }
    const vbds = await Promise.all(record.VBDs.map(ref => xapi.call('VBD.get_record', ref)))
    const inserted = vbds.find(vbd => vbd.type === 'CD' && !vbd.empty)
    if (inserted !== undefined) {
      throw incorrectState({ actual: false, expected: true, object: inserted.uuid, property: 'empty' })
    }
    const cdIndex = vbds.findIndex(vbd => vbd.type === 'CD')
    if (record.power_state === 'Running' && (cdIndex === -1 || !vbds[cdIndex].currently_attached)) {
      // a CD drive can only be created or plugged while the VM is halted
      throw incorrectState({ actual: 'Running', expected: 'Halted', object: vm.id, property: 'power_state' })
    }
    resources.target = await media.createTarget(session)
    if (session.closed) throw new Error('Browser disconnected during attachment')
    resources.srUuid = randomUUID()
    await media.recovery?.remember(session, xapi, resources.srUuid)
    resources.sr = await xapi.call(
      'SR.introduce',
      resources.srUuid,
      `Browser media: ${session.name}`,
      'Ephemeral browser ISO; single host, no migration support',
      'iscsi',
      'user',
      false,
      { 'xo:browser-media': session.id }
    )
    await xapi.call('SR.add_to_other_config', resources.sr, 'xo:browser-media', session.id)
    await xapi.call('SR.add_to_other_config', resources.sr, 'auto-scan', 'false')
    const pbd = await xapi.call('PBD.create', {
      host,
      SR: resources.sr,
      device_config: resources.target.deviceConfig,
    })
    await xapi.callAsync('PBD.plug', pbd)
    if (session.closed) throw new Error('Browser disconnected during attachment')
    // As in live mount, introduce before any scan to retain the raw format.
    // The stock driver derives its own UUID/SCSIid from LUN 0; SR.forget also
    // removes that metadata if introduction fails after creating the VDI.
    const uuid = randomUUID()
    await xapi.call(
      'VDI.introduce',
      uuid,
      session.name,
      'Read-only browser ISO',
      resources.sr,
      'user',
      false,
      true,
      {},
      uuid,
      {},
      { LUNid: '0', type: 'raw' },
      true,
      String(session.size),
      '0',
      'OpaqueRef:NULL',
      false,
      '19700101T00:00:00Z',
      'OpaqueRef:NULL'
    )
    const vdis = await xapi.call('SR.get_VDIs', resources.sr)
    if (vdis.length !== 1) throw new Error('Expected one browser ISO LUN')
    resources.vdi = vdis[0]
    // The stock driver creates LUN metadata with its own name during introduction.
    await xapi.call('VDI.set_name_label', resources.vdi, session.name)
    if (session.closed) throw new Error('Browser disconnected during attachment')
    // Use the normal XAPI CD lifecycle. A fresh drive is bootable; existing drive
    // boot order is left to the VM's settings.
    const cd = record.VBDs[cdIndex]
    if (cd === undefined) {
      await xapi.VBD_create({
        VM: vm._xapiRef,
        VDI: resources.vdi,
        type: 'CD',
        mode: 'RO',
        bootable: true,
        throwVbdPlug: true,
      })
    } else {
      await xapi.call('VBD.insert', cd, resources.vdi)
    }
    const vdi = await xapi.call('VDI.get_uuid', resources.vdi)
    if (session.closed) throw new Error('Browser disconnected during attachment')
    // Also release the browser after an eject through another XAPI client.
    let checking = false
    session.monitor = setInterval(async () => {
      if (checking || session.closed) return
      checking = true
      try {
        if ((await xo.getXapi(vm).call('VDI.get_VBDs', resources.vdi)).length === 0) media.close(session)
      } catch (error) {
        if (error.code === 'HANDLE_INVALID') {
          media.close(session)
        } else {
          // a temporary host outage does not revoke the browser session
          log.debug('could not check whether the browser media is still inserted', { error, session: session.id })
        }
      } finally {
        // This guard is acquired synchronously before awaiting; only its owner clears it.
        // eslint-disable-next-line require-atomic-updates
        checking = false
      }
    }, EJECT_CHECK_INTERVAL).unref()
    return { vdi }
  })()
  try {
    return await session.operation
  } catch (error) {
    media.close(session)
    throw error
  }
}

/** Stop serving the ISO and release its storage, even if attaching failed. */
export async function disconnectSession(media, session) {
  media.close(session)
  // a failed attachment was already reported to its caller
  await session.operation?.catch(() => {})
  await session.cleanup?.()
}
