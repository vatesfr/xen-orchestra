import { createLogger } from '@xen-orchestra/log'
import { stat as fsStat } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'

const { debug } = createLogger('xo:mixins:LiveMount')

const DEFAULT_POLL_INTERVAL_MS = 200
const DEFAULT_DEVICE_FIELD_TIMEOUT_MS = 30e3
const DEFAULT_DEVICE_NODE_TIMEOUT_MS = 30e3

/**
 * Where a hot-plugged VBD surfaces in the guest.
 *
 * Two waits rather than one, because they fail for unrelated reasons and only a
 * separate message says which happened:
 *
 * 1. XAPI reports the device name once the hotplug scripts have run. It is
 *    usually already set by the time the `VBD.plug` task completes, but nothing
 *    says it must be, and an empty name is indistinguishable from a plug which
 *    silently did nothing.
 * 2. udev creates the node asynchronously afterwards, so the name can be known
 *    while `/dev` has not caught up yet.
 *
 * Whether the node can be *opened* is not checked here — a scanner may still
 * hold it briefly — that is the block device's own concern, and it retries.
 *
 * `getField` and `stat` are injectable for tests, like the mixin's other
 * seams.
 *
 * @param {object} xapi - XAPI connection owning the VBD
 * @param {string} vbdRef - opaque ref of the plugged VBD
 * @param {object} [options]
 * @param {number} [options.deviceFieldTimeout] - ms to wait for XAPI to name the device
 * @param {number} [options.deviceNodeTimeout] - ms to wait for udev to create the node
 * @param {number} [options.pollInterval] - ms between two polls
 * @param {(path: string) => Promise<import('node:fs').Stats>} [options.stat]
 * @returns {Promise<string>} path of the device node, e.g. `/dev/xvdc`
 */
export async function waitForVbdDevice(
  xapi,
  vbdRef,
  {
    deviceFieldTimeout = DEFAULT_DEVICE_FIELD_TIMEOUT_MS,
    deviceNodeTimeout = DEFAULT_DEVICE_NODE_TIMEOUT_MS,
    pollInterval = DEFAULT_POLL_INTERVAL_MS,
    stat = fsStat,
  } = {}
) {
  const device = await poll(
    async () => {
      const device = await xapi.getField('VBD', vbdRef, 'device')
      return device === '' || device == null ? undefined : device
    },
    { pollInterval, timeout: deviceFieldTimeout }
  )
  if (device === undefined) {
    throw new Error(`the cache VBD ${vbdRef} was plugged but XAPI never named its device after ${deviceFieldTimeout}ms`)
  }

  // XAPI reports a bare name (`xvdc`); anything else is not one, and must not
  // be turned into a path we then open read/write
  if (!/^[a-z0-9]+$/i.test(device)) {
    throw new Error(`XAPI reported an unusable device name for the cache VBD ${vbdRef}: ${JSON.stringify(device)}`)
  }
  const path = `/dev/${device}`
  debug('cache VBD named its device', { device, vbdRef })

  const found = await poll(
    async () => {
      try {
        return (await stat(path)).isBlockDevice() || undefined
      } catch (error) {
        if (error.code === 'ENOENT') {
          return undefined
        }
        throw error
      }
    },
    { pollInterval, timeout: deviceNodeTimeout }
  )
  if (found === undefined) {
    throw new Error(`${path} never appeared after ${deviceNodeTimeout}ms — check that udev runs in this appliance`)
  }

  return path
}

/**
 * Call `fn` until it returns something other than `undefined`, or `timeout`
 * elapsed — in which case `undefined` is returned and the caller says what was
 * being waited for. Always calls `fn` at least once, so a zero timeout still
 * means "check now" rather than "give up immediately".
 */
async function poll(fn, { pollInterval, timeout }) {
  const deadline = Date.now() + timeout
  for (;;) {
    const result = await fn()
    if (result !== undefined) {
      return result
    }
    if (Date.now() >= deadline) {
      return undefined
    }
    await sleep(pollInterval)
  }
}
