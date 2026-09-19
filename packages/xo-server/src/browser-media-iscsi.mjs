import { IscsiTarget } from '@vates/iscsi'
import { randomBytes } from 'node:crypto'

const CHUNK_SIZE = 1024 * 1024
const MAX_READ = 8 * CHUNK_SIZE

// Flat ISO bytes over the same BlockDevice interface used by live mount.
// No VHD interpretation or read cache: the browser is the only data source.
export class BrowserIsoDevice {
  constructor(media, session) {
    this.media = media
    this.session = session
  }

  getSize() {
    return this.session.size
  }

  getBlockSize() {
    return 512
  }

  async read(offset, length) {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      length > MAX_READ ||
      offset % 512 !== 0 ||
      length % 512 !== 0 ||
      offset + length > this.session.size
    ) {
      throw new Error('Invalid ISO block read')
    }
    if (this.session.closed) throw new Error('Media disconnected')
    const buffer = Buffer.allocUnsafe(length)
    for (let done = 0; done < length; ) {
      const count = Math.min(CHUNK_SIZE, length - done)
      const bytes = await this.media.read(this.session, offset + done, count)
      if (bytes.length !== count) throw new Error('Short ISO block read')
      bytes.copy(buffer, done)
      done += count
    }
    return buffer
  }

  async write() {
    throw new Error('Browser ISO is read-only')
  }

  async flush() {}
  async close() {}
}

export async function createBrowserMediaTarget(media, session) {
  const chap = { user: `xo-${session.id.slice(0, 8)}`, secret: randomBytes(12).toString('base64') }
  const iqn = `iqn.2026-09.tech.vates.xo:browser-media-${session.id}`
  const target = new IscsiTarget({
    chap,
    host: media.bindAddress,
    identity: { serial: `xo-browser-${session.id}` },
    iqn,
    lun: new BrowserIsoDevice(media, session),
    port: 0,
    readConcurrency: 8,
  })
  await target.listen()
  media.targets.add(target)
  return {
    deviceConfig: {
      target: media.advertisedAddress,
      port: String(target.address().port),
      targetIQN: iqn,
      chapuser: chap.user,
      chappassword: chap.secret,
    },
    async close() {
      await target.close()
      media.targets.delete(target)
    },
  }
}
