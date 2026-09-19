import { randomUUID } from 'node:crypto'
import { forgetBrowserMediaSr } from '../browser-media-recovery.mjs'

function service(xo) {
  if (xo.browserMedia === undefined) throw new Error('Browser media is not enabled on this XO server')
  return xo.browserMedia
}

export function create({ vm, name, size }) {
  if (!['Running', 'Halted'].includes(vm.power_state)) throw new Error('VM must be running or halted')
  const media = service(this)
  const session = media.create({ owner: this.apiContext.user.id, vm: vm.id, name, size })
  return { id: session.id, socket: `/api/browser-media/${session.browserToken}/socket` }
}
create.permission = 'admin'
create.params = {
  id: { type: 'string' },
  name: { type: 'string', minLength: 1, maxLength: 255 },
  size: { type: 'integer' },
}
create.resolve = { vm: ['id', 'VM', 'operate'] }

export async function attach({ id }) {
  const media = service(this)
  const session = media.get(id, this.apiContext.user.id)
  if (session.operation !== undefined) throw new Error('Media already attached or attaching')
  if (session.socket?.readyState !== 1) throw new Error('Browser is not connected')
  const vm = this.getObject(session.vm, 'VM')
  const xapi = this.getXapi(vm)
  const resources = {}
  const cleanup = async () => {
    if (resources.srUuid !== undefined) {
      await forgetBrowserMediaSr(this.getXapi(vm), resources.srUuid, session.id)
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
      session.cleanup().catch(() => {
        if (!media.stopping) session.cleanupTimer = setTimeout(attempt, 30000).unref()
      })
    session.operation.catch(() => {}).then(attempt)
  }
  session.operation = (async () => {
    const record = await xapi.call('VM.get_record', vm._xapiRef)
    if (!['Running', 'Halted'].includes(record.power_state)) throw new Error('VM must be running or halted')
    let host = record.resident_on
    if (record.power_state === 'Halted') {
      const hosts = await xapi.call('VM.get_possible_hosts', vm._xapiRef)
      host = hosts.includes(record.affinity) ? record.affinity : hosts[0]
      if (host === undefined) throw new Error('No host can start this VM')
    }
    const vbds = await Promise.all(record.VBDs.map(ref => xapi.call('VBD.get_record', ref)))
    if (vbds.some(vbd => vbd.type === 'CD' && !vbd.empty)) throw new Error('Eject the current CD first')
    const cdIndex = vbds.findIndex(vbd => vbd.type === 'CD')
    if (record.power_state === 'Running' && (cdIndex === -1 || !vbds[cdIndex].currently_attached)) {
      throw new Error('Shut down the VM to initialize its CD drive, then connect the ISO before starting it')
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
        if ((await this.getXapi(vm).call('VDI.get_VBDs', resources.vdi)).length === 0) media.close(session)
      } catch (_) {
        // A temporary host outage does not revoke the browser session.
      } finally {
        // This guard is acquired synchronously before awaiting; only its owner clears it.
        // eslint-disable-next-line require-atomic-updates
        checking = false
      }
    }, 15000).unref()
    return { vdi }
  })()
  try {
    return await session.operation
  } catch (error) {
    media.close(session)
    throw error
  }
}
attach.permission = 'admin'
attach.params = { id: { type: 'string' } }

export async function disconnect({ id }) {
  const media = service(this)
  const session = media.get(id, this.apiContext.user.id, true)
  media.close(session)
  await session.operation?.catch(() => {})
  await session.cleanup?.()
}
disconnect.permission = 'admin'
disconnect.params = { id: { type: 'string' } }

export function isEnabled() {
  return this.browserMedia !== undefined
}
isEnabled.permission = 'admin'
