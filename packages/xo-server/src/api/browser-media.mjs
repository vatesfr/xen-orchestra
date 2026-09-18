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
    if (resources.findSr) {
      const records = await xapi.call('SR.get_all_records')
      resources.sr = Object.keys(records).find(ref => records[ref].sm_config['browser-media-session'] === session.id)
      delete resources.findSr
    }
    // Only eject our own medium; never eject a replacement inserted by another client.
    if (resources.vdi !== undefined) {
      for (const vbd of await xapi.call('VDI.get_VBDs', resources.vdi)) {
        if ((await xapi.call('VBD.get_VDI', vbd)) === resources.vdi) await xapi.call('VBD.eject', vbd)
      }
      await xapi.call('VDI.destroy', resources.vdi)
      delete resources.vdi
    }
    if (resources.sr !== undefined) {
      for (const pbd of await xapi.call('SR.get_PBDs', resources.sr)) {
        await xapi.call('PBD.unplug', pbd)
        await xapi.call('PBD.destroy', pbd)
      }
      await xapi.call('SR.forget', resources.sr)
      delete resources.sr
    }
  }
  // Retry cleanup after an unavailable host. The SR label also makes abandoned
  // sessions discoverable after an XO restart; see the prototype runbook.
  let cleaning
  session.cleanup = () =>
    cleaning ??
    (cleaning = cleanup().finally(() => {
      cleaning = undefined
    }))
  session.onClose = () => {
    clearInterval(session.monitor)
    const attempt = () => session.cleanup().catch(() => setTimeout(attempt, 30000).unref())
    session.operation.catch(() => {}).then(attempt)
  }
  session.operation = (async () => {
    const record = await xapi.call('VM.get_record', vm._xapiRef)
    if (!['Running', 'Halted'].includes(record.power_state)) throw new Error('VM must be running or halted')
    const host =
      record.power_state === 'Running'
        ? record.resident_on
        : await xapi.call('pool.get_master', (await xapi.call('pool.get_all'))[0])
    const vbds = await Promise.all(record.VBDs.map(ref => xapi.call('VBD.get_record', ref)))
    if (vbds.some(vbd => vbd.type === 'CD' && !vbd.empty)) throw new Error('Eject the current CD first')
    const cdIndex = vbds.findIndex(vbd => vbd.type === 'CD')
    if (record.power_state === 'Running' && (cdIndex === -1 || !vbds[cdIndex].currently_attached)) {
      throw new Error('Shut down the VM to initialize its CD drive, then connect the ISO before starting it')
    }
    // SR.create can leave PBDs behind if a pool host fails to attach.
    resources.findSr = true
    resources.sr = await xapi.SR_create({
      host,
      name_label: `Browser media: ${session.name}`,
      name_description: 'Ephemeral shared browser media prototype; migration is not yet validated',
      type: 'browseriso',
      content_type: 'iso',
      shared: true,
      sm_config: { 'browser-media-session': session.id },
      device_config: {
        url: `${media.origin}/api/browser-media/${session.readToken}/iso`,
        size: String(session.size),
        ...(media.origin.startsWith('http:') ? { allow_http: 'true' } : {}),
      },
    })
    delete resources.findSr
    const pbds = await xapi.call('SR.get_PBDs', resources.sr)
    const attached = await Promise.all(pbds.map(pbd => xapi.call('PBD.get_currently_attached', pbd)))
    if (pbds.length === 0 || attached.some(value => !value)) {
      throw new Error('Browser media must be reachable and the adapter installed on every pool host')
    }
    resources.vdi = await xapi.VDI_create({
      SR: resources.sr,
      name_label: session.name,
      virtual_size: session.size,
      type: 'user',
      read_only: true,
      sharable: false,
    })
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
        if ((await xapi.call('VDI.get_VBDs', resources.vdi)).length === 0) media.close(session)
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
  const session = media.get(id, this.apiContext.user.id)
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
