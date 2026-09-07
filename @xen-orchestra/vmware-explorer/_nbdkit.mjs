import { connect, createServer } from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

/**
 * Command line of an nbdkit server exporting one disk of a VM through the vddk plugin.
 *
 * @param {object} params
 * @returns {Array<string>}
 */
export function formatNbdkitArgs({
  compression,
  diskPath,
  host,
  libdir,
  passFile,
  port,
  singleLink,
  threads,
  thumbprint,
  user,
  vmId,
}) {
  return [
    '-r', // readonly
    '-v',
    '-f',
    '--exit-with-parent', // implies -f , ensure we don't leave orphans
    `--threads=${threads}`,
    `--port=${port}`,
    'vddk', // the vddk plugin
    `compression=${compression}`,
    `thumbprint=${thumbprint}`,
    `server=${host}`,
    `user=${user}`,
    `password=+${passFile}`,
    `libdir=${libdir}`,
    `vm=moref=${vmId}`,
    // `single-link` restricts the export to the top delta. An empty argument used to be passed
    // when it is disabled: nbdkit tolerates it, but it sits in the slot of the magic positional
    // parameter of the plugin, right before the disk to export
    ...(singleLink ? ['single-link=true'] : []),
    diskPath,
  ]
}

/**
 * Reserves a port by letting the system pick a free one.
 *
 * The port is released before being handed out, so the caller must be able to cope with a
 * concurrent process taking it in the meantime.
 *
 * @returns {Promise<number>}
 */
export function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      server.close(error => (error != null ? reject(error) : resolve(port)))
    })
  })
}

const tryConnect = (port, host) =>
  new Promise((resolve, reject) => {
    const socket = connect({ port, host })
    socket.once('connect', () => {
      socket.destroy()
      resolve()
    })
    socket.once('error', error => {
      socket.destroy()
      reject(error)
    })
  })

/**
 * Waits until something listens on a port.
 *
 * nbdkit binds its port once its plugin is configured, so this is what tells that the server is
 * usable — the previous implementation waited a fixed two seconds, which was both too long for a
 * fast host and too short for a slow one.
 *
 * @param {number} port
 * @param {object} [options]
 * @param {string} [options.host]
 * @param {number} [options.probeDelay] - in ms, between two attempts
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeout] - in ms
 * @returns {Promise<void>}
 */
export async function waitForPort(port, { host = '127.0.0.1', probeDelay = 50, signal, timeout = 30e3 } = {}) {
  const start = Date.now()
  for (;;) {
    signal?.throwIfAborted()
    try {
      return await tryConnect(port, host)
    } catch (error) {
      if (Date.now() - start >= timeout) {
        const wrapped = new Error(`nothing is listening on ${host}:${port} after ${timeout}ms`)
        wrapped.cause = error
        throw wrapped
      }
    }
    await delay(probeDelay, undefined, { signal })
  }
}
