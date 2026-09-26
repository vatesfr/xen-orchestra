import { createLogger } from '@xen-orchestra/log'

const log = createLogger('xo:browser-media')
// SR uuid -> { pool, session }, local to this XO: other XO instances are untouched
const STORE_NAMESPACE = 'browserMedia'

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
  pending = new Map()
  #store

  constructor(xo, media) {
    this.xo = xo
    this.media = media
  }

  #getStore() {
    this.#store ??= this.xo.getStore(STORE_NAMESPACE)
    return this.#store
  }

  async remember(session, xapi, srUuid) {
    // Written before SR.introduce: a crash or a lost reply must not orphan storage.
    await (await this.#getStore()).put(srUuid, { pool: xapi.pool.uuid, session: session.id })
  }

  async forget(srUuid) {
    await (await this.#getStore()).del(srUuid)
  }

  async reconcile() {
    const entries = []
    for await (const entry of (await this.#getStore()).createReadStream()) {
      entries.push(entry)
    }
    await Promise.all(
      entries.map(({ key: uuid, value }) => {
        if (this.pending.has(uuid)) return undefined
        const pending = this._reconcile(uuid, value).finally(() => this.pending.delete(uuid))
        this.pending.set(uuid, pending)
        return pending
      })
    )
  }

  async _reconcile(uuid, { pool, session }) {
    try {
      if (this.media.stopping || this.media.sessions.has(session)) return
      const xapi = Object.values(this.xo.getAllXapis()).find(xapi => xapi.pool?.uuid === pool)
      if (xapi === undefined) return
      await forgetBrowserMediaSr(xapi, uuid, session)
      await this.forget(uuid)
    } catch (error) {
      log.warn('could not reconcile browser media; will retry', { uuid, error })
    }
  }
}
