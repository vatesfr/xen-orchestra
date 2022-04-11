'use strict'

const { asyncMap } = require('@xen-orchestra/async-map')
const { createLogger } = require('@xen-orchestra/log')
const { Disposable } = require('promise-toolbox')
const { resolveVhdAlias } = require('./aliases')
const { VhdDirectory } = require('./Vhd/VhdDirectory.js')
const { VhdFile } = require('./Vhd/VhdFile.js')
const { VhdSynthetic } = require('./Vhd/VhdSynthetic')

const { warn } = createLogger('vhd-lib:openVhd')

async function openVhds(handler, paths, opts) {
  const disposableVhds = await asyncMap(paths, async path => {
    return openVhd(handler, path, opts)
  })
  const disposables = await Disposable.all(disposableVhds)

  let disposed = false
  const disposeOnce = async () => {
    if (!disposed) {
      disposed = true

      try {
        await disposables.dispose()
      } catch (error) {
        warn('openVhd: failed to dispose VHDs', { error })
      }
    }
  }
  return {
    value: new VhdSynthetic(disposables.value),
    dispose: disposeOnce,
  }
}

const openVhd = async function openVhd(handler, path, opts) {
  if (Array.isArray(path)) {
    return openVhds(handler, path, opts)
  }
  const resolved = await resolveVhdAlias(handler, path)
  try {
    return await VhdFile.open(handler, resolved, opts)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, resolved, opts)
  }
}

exports.openVhd = openVhd
