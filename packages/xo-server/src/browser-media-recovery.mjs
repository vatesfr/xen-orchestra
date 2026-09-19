import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:browser-media')
const KEY = 'xo:browser-media:resources'

// Forget metadata only. In particular, never destroy a raw LUN or eject a
// replacement that another client inserted into the same CD drive.
export async function forgetBrowserMediaSr(xapi, uuid, sessionId) {
  let sr
  try {
    sr = await xapi.call('SR.get_by_uuid', uuid)
  } catch (error) {
    if (error.code === 'UUID_INVALID') return
    throw error
  }
  const record = await xapi.call('SR.get_record', sr)
  if (record.type !== 'iscsi' || record.sm_config['xo:browser-media'] !== sessionId) {
    throw new Error('Browser media SR ownership mismatch')
  }
  for (const vdi of await xapi.call('SR.get_VDIs', sr)) {
    for (const vbd of await xapi.call('VDI.get_VBDs', vdi)) {
      const record = await xapi.call('VBD.get_record', vbd)
      if (record.VDI !== vdi) continue
      if (record.type !== 'CD') throw new Error('Browser media is attached to a non-CD device')
      await xapi.call('VBD.eject', vbd)
    }
  }
  for (const pbd of await xapi.call('SR.get_PBDs', sr)) {
    if (await xapi.call('PBD.get_currently_attached', pbd)) await xapi.callAsync('PBD.unplug', pbd)
    await xapi.call('PBD.destroy', pbd)
  }
  await xapi.call('SR.forget', sr)
}

export class BrowserMediaRecovery {
  constructor(xo, media) {
    this.xo = xo
    this.media = media
  }

  async remember(session, xapi, srUuid) {
    // Write before SR.introduce: a crash or a lost reply must not orphan storage.
    // The journal belongs to this XO database; other XO instances are untouched.
    await this.xo._redis.hSet(KEY, srUuid, JSON.stringify({ pool: xapi.pool.uuid, session: session.id }))
  }

  async forget(srUuid) {
    await this.xo._redis.hDel(KEY, srUuid)
  }

  reconcile() {
    return (this.running ??= this._reconcile().finally(() => {
      this.running = undefined
    }))
  }

  async _reconcile() {
    const entries = await this.xo._redis.hGetAll(KEY)
    for (const [uuid, serialized] of Object.entries(entries)) {
      try {
        const { pool, session } = JSON.parse(serialized)
        if (this.media.sessions.has(session)) continue
        const xapi = Object.values(this.xo.getAllXapis()).find(xapi => xapi.pool?.uuid === pool)
        if (xapi === undefined) continue
        await forgetBrowserMediaSr(xapi, uuid, session)
        await this.forget(uuid)
      } catch (error) {
        log.warn('could not reconcile browser media; will retry', { uuid, error })
      }
    }
  }
}
