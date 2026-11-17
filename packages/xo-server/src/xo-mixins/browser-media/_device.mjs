const SECTOR_SIZE = 512

/**
 * The ISO of a browser media session, as an `@vates/iscsi` LUN: every read is
 * served by the browser, nothing is cached.
 *
 * Read-only: the LUN is reported write-protected, so writes are refused before
 * they reach this device.
 */
export class BrowserIsoDevice {
  readOnly = true

  /** @param {import('./_session.mjs').BrowserMediaSession} session */
  constructor(session) {
    this.session = session
  }

  getSize() {
    return this.session.size
  }

  getBlockSize() {
    return SECTOR_SIZE
  }

  read(offset, length) {
    return this.session.read(offset, length)
  }

  async write() {
    throw new Error('a browser ISO is read-only')
  }

  async flush() {}
  async close() {}
}

/**
 * Stands for the ISO of a session whose browser is gone, e.g. after a restart
 * of xo-server: it has the same capacity, so that a host still logged in can
 * identify it and detach it cleanly, and every read fails.
 */
export class UnavailableIsoDevice {
  readOnly = true

  /** @param {number} size */
  constructor(size) {
    this.size = size
  }

  getSize() {
    return this.size
  }

  getBlockSize() {
    return SECTOR_SIZE
  }

  async read() {
    throw new Error('the browser serving this ISO is gone')
  }

  async write() {
    throw new Error('a browser ISO is read-only')
  }

  async flush() {}
  async close() {}
}
