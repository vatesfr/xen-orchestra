'use strict'

const { asyncMap } = require('@xen-orchestra/async-map')

exports.DurablePartition = class DurablePartition {
  // private resource API is used exceptionally to be able to separate resource creation and release
  #partitionDisposers = {}

  flushAll() {
    const partitionDisposers = this.#partitionDisposers
    return asyncMap(Object.keys(partitionDisposers), path => {
      const disposers = partitionDisposers[path]
      delete partitionDisposers[path]
      return asyncMap(disposers, d => d(path).catch(noop => {}))
    })
  }

  async mount(adapter, diskId, partitionId) {
    const { value: path, dispose } = await adapter.getPartition(diskId, partitionId)

    const partitionDisposers = this.#partitionDisposers
    if (partitionDisposers[path] === undefined) {
      partitionDisposers[path] = []
    }
    partitionDisposers[path].push(dispose)

    return path
  }

  async unmount(path) {
    const partitionDisposers = this.#partitionDisposers
    const disposers = partitionDisposers[path]
    if (disposers === undefined) {
      throw new Error(`No partition corresponding to the path ${path} found`)
    }

    await disposers.pop()()
    if (disposers.length === 0) {
      delete partitionDisposers[path]
    }
  }
}
