import assert from 'assert'
import handlerPath from '@xen-orchestra/fs/path'
import { createLogger } from '@xen-orchestra/log'

import { basename, dirname } from 'path'
import { Disposable } from 'promise-toolbox'
import { asyncEach } from '@vates/async-each'
import { VhdSynthetic, openVhd, VhdAbstract } from 'vhd-lib'
import { asyncMap } from '@xen-orchestra/async-map'
import { isVhdAlias, resolveVhdAlias } from 'vhd-lib/aliases.js'

const { warn } = createLogger('vhd-lib:merge')

export class RemoteVhdChain {
  #remoteVhds
  #childrenRemotes
  #parentRemote
  #isResuming = false
  #lastStateWrittenAt = 0
  #logInfo
  #mergeBlockConcurrency
  #onProgress
  #removeUnused
  #state
  #statePath
  #handler

  constructor(handler, remoteVhds, { onProgress = () => { }, logInfo = () => { }, removeUnused = false, mergeBlockConcurrency = 2 }) {
    if (!Array.isArray(remoteVhds) || remoteVhds.length < 2) {
      throw new Error('mergeVhdChain expects at least two RemoteVhd instances [parent, child]')
    }

    this.#remoteVhds = remoteVhds
    this.#parentRemote = remoteVhds[0]
    this.#childrenRemotes = remoteVhds.slice(1)
    this.#logInfo = logInfo
    this.#onProgress = onProgress
    this.#removeUnused = removeUnused
    this.#mergeBlockConcurrency = mergeBlockConcurrency
    this.#handler = handler

    // state file next to the parent RemoteVhd.path
    const parentPath = this.#parentRemote.path
    this.#statePath = dirname(parentPath) + '/.' + basename(parentPath) + '.merge.json'
  }

  async #writeState() {
    try {
      await this.#handler.writeFile(this.#statePath, JSON.stringify(this.#state), { flags: 'w' })
    } catch (err) {
      warn('failed to write merge state', { error: err })
    }
  }

  async #writeStateThrottled() {
    const delay = 10e3
    const now = Date.now()
    if (now - this.#lastStateWrittenAt > delay) {
      this.#lastStateWrittenAt = now
      await this.#writeState()
    }
  }

  async merge() {
    // Try to load previous state (resume support)
    try {
      const mergeStateContent = await this.#handler.readFile(this.#statePath)
      this.#state = JSON.parse(mergeStateContent)
      if (this.#state.currentBlock === null) this.#state.currentBlock = 0
      this.#isResuming = true
    } catch (error) {
      if (error.code !== 'ENOENT') {
        warn('problem while checking the merge state', { error })
      }
    }

    /* eslint-disable no-fallthrough */
    switch (this.#state?.step ?? 'mergeBlocks') {
      case 'mergeBlocks':
        await this.#step_mergeBlocks()
      case 'cleanupVhds':
        await this.#step_cleanVhds()
        return this.#cleanup()
      default:
        warn(`Step ${this.#state.step} is unknown`, { state: this.#state })
    }
    /* eslint-enable no-fallthrough */
  }

  async #step_mergeBlocks() {
    await Disposable.use(async function* () {
      const parentRemote = this.#parentRemote
      const childRemote = this.#childrenRemotes.length === 1
        ? this.#childrenRemotes[0]
        : undefined // multiple children handled below

      let childVhd
      if (!childRemote) {
        // multiple children: create synthetic VHD from paths
        const childPaths = this.#childrenRemotes.map(r => r.path)
        childVhd = yield VhdSynthetic.open(this.#handler, childPaths)
      } else {
        childVhd = childRemote
      }

      const maxTableEntries = childVhd.readHeader()?.maxTableEntries

      if (!this.#state) {
        const chain = this.#remoteVhds.map(r => handlerPath.relativeFromFile(this.#statePath, r.path))
        this.#state = {
          child: { header: childVhd.readHeader()?.checksum ?? 0 },
          parent: { header: parentRemote.readHeader()?.checksum ?? 0 },
          currentBlock: 0,
          mergedDataSize: 0,
          step: 'mergeBlocks',
          chain,
        }
        while (this.#state.currentBlock < maxTableEntries && !childVhd.hasBlock(this.#state.currentBlock)) {
          ++this.#state.currentBlock
        }
        await this.#writeState()
      }

      await this.#mergeBlocks(parentRemote, childVhd)
      await this.#updateHeaders(parentRemote, childVhd)
    }.bind(this))
  }

  async #mergeBlocks(parentRemote, childRemote) {
    const toMerge = []
    for (const block of childRemote.getBlockIndexes()) {
      if (childRemote.hasBlock(block)) toMerge.push(block)
    }

    const nBlocks = toMerge.length
    this.#onProgress({ total: nBlocks, done: 0 })

    const merging = new Set()
    let counter = 0

    await asyncEach(
      toMerge,
      async blockId => {
        merging.add(blockId)
        this.#state.mergedDataSize += await parentRemote.writeBlock(blockId, (await childRemote.readBlock(blockId)).data)

        this.#state.currentBlock = Math.min(...merging)
        merging.delete(blockId)

        this.#onProgress({ total: nBlocks, done: counter + 1 })
        counter++
        await this.#writeStateThrottled()
      },
      { concurrency: this.#mergeBlockConcurrency }
    )

    await this.#writeState()
    this.#state.vhdSize = await parentRemote.getVirtualSize()

    this.#onProgress({ total: nBlocks, done: nBlocks })
  }

  async #updateHeaders(parentRemote, childRemote) {
    await parentRemote.writeBlockAllocationTable()
    const cFooter = childRemote.readFooter()
    const pFooter = parentRemote.readFooter()

    pFooter.currentSize = cFooter.currentSize
    pFooter.diskGeometry = { ...cFooter.diskGeometry }
    pFooter.originalSize = cFooter.originalSize
    pFooter.timestamp = cFooter.timestamp
    pFooter.uuid = cFooter.uuid

    await parentRemote.writeFooter(pFooter)
  }

  async #step_cleanVhds() {
    assert.notEqual(this.#state, undefined)
    this.#state.step = 'cleanupVhds'
    await this.#writeState()

    const remotes = this.#remoteVhds
    const parentRemote = remotes[0]
    const childrenRemotes = remotes.slice(1, -1)
    const mergeTargetRemote = remotes[remotes.length - 1]

    const parent = parentRemote.path
    const children = childrenRemotes.map(r => r.path)
    const mergeTarget = mergeTargetRemote.path

    let oldTarget
    if (isVhdAlias(mergeTarget)) {
      oldTarget = await resolveVhdAlias(this.#handler, mergeTarget)
    }

    try {
      await this.#handler.rename(parent, mergeTarget)
      if (oldTarget) {
        await VhdAbstract.unlink(this.#handler, oldTarget).catch(warn)
      }
    } catch (error) {
      if (error.code === 'ENOENT' && this.#isResuming) {
        await Disposable.use(openVhd(this.#handler, mergeTarget), vhd => {
          assert.strictEqual(vhd.header.checksum, this.#state.parent.header)
        })
        this.#logInfo(`the VHD parent was already renamed`, { parent, mergeTarget })
      } else {
        throw error
      }
    }

    await asyncMap(children, child => {
      this.#logInfo(`the VHD child is already merged`, { child })
      if (this.#removeUnused) {
        this.#logInfo(`deleting merged VHD child`, { child })
        return VhdAbstract.unlink(this.#handler, child)
      }
    })
  }

  async #cleanup() {
    const finalVhdSize = this.#state?.vhdSize ?? 0
    const mergedDataSize = this.#state?.mergedDataSize ?? 0
    await this.#handler.unlink(this.#statePath).catch(warn)
    await Promise.all(this.#remoteVhds.map(r => r.close().catch(warn)))
    return { mergedDataSize, finalVhdSize }
  }
}
