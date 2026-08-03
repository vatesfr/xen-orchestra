import { access, constants, readFile } from 'node:fs/promises'
import { createLogger } from '@xen-orchestra/log'
import { Task } from '@vates/task'
import pRetry from 'promise-toolbox/retry'

import LocalBlockDevice from './_LocalBlockDevice.mjs'
import { cacheLabel } from './_utils.mjs'

const { debug, info } = createLogger('xo:mixins:LiveMount')

// the cache device node is created by udev after the plug, so it lags a little
const DEVICE_POLL_DELAY = 500
const DEVICE_POLL_TRIES = 60

// `/sys/class/block/<name>/size` counts 512-byte sectors, always
const SECTOR_SIZE = 512

/**
 * Open the block device XAPI just plugged into this appliance. Polls
 * `/sys/class/block/<name>/size` rather than the device node's own reported
 * size: until the block frontend connects it reports 0 and reads hit EOF.
 */
export async function openLocalDevice({ name, size }) {
  const path = `/dev/${name}`
  const actual = await pRetry(
    async () => {
      await access(path, constants.R_OK | constants.W_OK)
      const sectors = Number.parseInt(await readFile(`/sys/class/block/${name}/size`, 'utf8'), 10)
      const bytes = sectors * SECTOR_SIZE
      if (!(bytes > 0)) {
        throw new Error(`${path} is not ready yet, it still reports no size`)
      }
      return bytes
    },
    {
      delay: DEVICE_POLL_DELAY,
      tries: DEVICE_POLL_TRIES,
      onRetry: error => debug('waiting for the cache device', { error, path }),
    }
  )
  if (actual < size) {
    throw new Error(`${path} holds ${actual} bytes, less than the ${size} bytes disk it is meant to cache`)
  }

  const device = new LocalBlockDevice({ path, size })
  await device.open()
  return device
}

/**
 * Create the disk backing the cache and plug it into this appliance, so its
 * bytes are reachable as a local block device.
 *
 * This is the only random-access write path into a VDI: XAPI's NBD export is
 * read-only, and `VDI_importContent` is a whole-stream HTTP PUT.
 *
 * @returns {Promise<{ device: object, vbdRef: string, vdiRef: string, vdiUuid: string }>}
 */
export async function createCache($defer, { diskPath, size, srRef, vmRef, xapi, openCache = openLocalDevice }) {
  return Task.run({ properties: { name: 'set up cache disk' } }, async () => {
    const vdiRef = await Task.run({ properties: { name: 'create cache VDI' } }, () =>
      xapi.VDI_create({
        name_description: `read cache for ${diskPath}`,
        name_label: `${cacheLabel(diskPath)}.raw`,
        SR: srRef,
        virtual_size: size,
      })
    )
    $defer.onFailure(() => xapi.VDI_destroy(vdiRef))

    // `throwVbdPlug` is not optional here: without it VBD_create only warns when
    // the plug fails, and we would carry on with a disk that is not attached
    const { vbdRef, name } = await Task.run({ properties: { name: 'plug cache VDI' } }, async () => {
      const vbdRef = await xapi.VBD_create({ mode: 'RW', throwVbdPlug: true, type: 'Disk', VDI: vdiRef, VM: vmRef })
      $defer.onFailure(() => xapi.VBD_destroy(vbdRef))

      // read back after the plug: the device name passed to VBD.create is
      // ignored for a running VM, XAPI assigns it
      const name = await xapi.getField('VBD', vbdRef, 'device')
      if (name === '') {
        throw new Error(`XAPI did not assign a device to the cache disk of ${diskPath}`)
      }
      return { vbdRef, name }
    })

    const device = await Task.run({ properties: { name: 'wait for cache device' } }, () => openCache({ name, size }))
    $defer.onFailure(() => device.close())

    const vdiUuid = await xapi.getField('VDI', vdiRef, 'uuid')
    info('cache disk plugged', { device: name, size, vdiUuid })

    return { device, vbdRef, vdiRef, vdiUuid }
  })
}
