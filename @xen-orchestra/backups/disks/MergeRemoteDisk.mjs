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

export class MergeRemoteDisk {
    /**
     * @type { 
     *  {
     *      child: { header: number },
     *      parent: { header: number }, 
     *      currentBlock: number, 
     *      mergedDataSize: number, 
     *      step: 'mergeBlocks' | 'cleanupVhds'
     *  }
     * }
     */
    #state

    /**
     * @type {string}
     */
    #statePath

    /**
     * @type {boolean}
     */
    #isResuming

    /**
     * @type {Logger}
     */
    #logInfo

    /**
     * @type {number}
     */
    #mergeBlockConcurrency

    /**
     * @type {Function}
     */
    #onProgress

    /**
     * @type {boolean}
     */
    #removeUnused

    /**
     * @type {number}
     */
    #lastStateWrittenAt

    /**
     * @type {FileAccessor}
     */
    #handler

    /**
     * @param {FileAccessor} handler
     * @param {Object} params
     * @param {Function} params.onProgress
     * @param {Logger} params.logInfo
     * @param {boolean} params.removeUnused
     * @param {number} params.mergeBlockConcurrency
     */
    constructor(handler, { onProgress = () => { }, logInfo = () => { }, removeUnused = false, mergeBlockConcurrency = 2 }) {
        this.#handler = handler
        this.#logInfo = logInfo
        this.#onProgress = onProgress
        this.#removeUnused = removeUnused
        this.#mergeBlockConcurrency = mergeBlockConcurrency

        this.#isResuming = false
        this.#lastStateWrittenAt = 0
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async merge(parentDisk, childDisk) {
        this.#statePath = dirname(parentDisk.getPath()) + '/.' + basename(parentDisk.getPath()) + '.merge.json'

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
                await this.#step_mergeBlocks(parentDisk, childDisk)
            case 'cleanupVhds':
                await this.#step_cleanVhds(parentDisk, childDisk)
                return this.#cleanup(parentDisk, childDisk)
            default:
                warn(`Step ${this.#state.step} is unknown`, { state: this.#state })
        }
        /* eslint-enable no-fallthrough */
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

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #step_mergeBlocks(parentDisk, childDisk) {
        const maxTableEntries = childDisk.readHeader()?.maxTableEntries

        if (!this.#state) {
            this.#state = {
                child: { header: childDisk.readHeader()?.checksum ?? 0 },
                parent: { header: parentDisk.readHeader()?.checksum ?? 0 },
                currentBlock: 0,
                mergedDataSize: 0,
                step: 'mergeBlocks',
            }
            while (this.#state.currentBlock < maxTableEntries && !childDisk.hasBlock(this.#state.currentBlock)) {
                ++this.#state.currentBlock
            }
            await this.#writeState()
        }

        await this.#mergeBlocks(parentDisk, childDisk)
        await this.#updateHeaders(parentDisk, childDisk)
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #mergeBlocks(parentDisk, childDisk) {
        const toMerge = []
        for (const block of childDisk.getBlockIndexes()) {
            if (childDisk.hasBlock(block)) toMerge.push(block)
        }

        const nBlocks = toMerge.length
        this.#onProgress({ total: nBlocks, done: 0 })

        const merging = new Set()
        let counter = 0

        await asyncEach(
            toMerge,
            async blockId => {
                merging.add(blockId)
                this.#state.mergedDataSize += await parentDisk.writeBlock(blockId, (await childDisk.readBlock(blockId)).data)

                this.#state.currentBlock = Math.min(...merging)
                merging.delete(blockId)

                this.#onProgress({ total: nBlocks, done: counter + 1 })
                counter++
                await this.#writeStateThrottled()
            },
            { concurrency: this.#mergeBlockConcurrency }
        )

        await this.#writeState()
        this.#state.vhdSize = await parentDisk.getVirtualSize()

        this.#onProgress({ total: nBlocks, done: nBlocks })
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #updateHeaders(parentDisk, childDisk) {
        await parentDisk.writeBlockAllocationTable()
        const cFooter = childDisk.readFooter()
        const pFooter = parentDisk.readFooter()

        pFooter.currentSize = cFooter.currentSize
        pFooter.diskGeometry = { ...cFooter.diskGeometry }
        pFooter.originalSize = cFooter.originalSize
        pFooter.timestamp = cFooter.timestamp
        pFooter.uuid = cFooter.uuid

        await parentDisk.writeFooter(pFooter)
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #step_cleanVhds(parentDisk, childDisk) {

        console.log(parentDisk.getPath(), childDisk.getPath())

        assert.notEqual(this.#state, undefined)
        this.#state.step = 'cleanupVhds'
        await this.#writeState()

        let oldTarget
        if (isVhdAlias(childDisk.getPath())) {
            oldTarget = await resolveVhdAlias(this.#handler, childDisk.getPath())
        }

        try {
            await this.#handler.rename(parentDisk.getPath(), childDisk.getPath())
            if (oldTarget) {
                await VhdAbstract.unlink(this.#handler, oldTarget).catch(warn)
            }
        } catch (error) {
            if (error.code === 'ENOENT' && this.#isResuming) {
                await Disposable.use(openVhd(this.#handler, childDisk.getPath()), vhd => {
                    assert.strictEqual(vhd.header.checksum, this.#state.parent.header)
                })
                this.#logInfo(`the VHD parent was already renamed`, { parent: parentDisk.getPath(), mergeTarget: childDisk.getPath() })
            } else {
                throw error
            }
        }

        /*this.#logInfo(`the VHD child is already merged`, { child: childDisk.getPath() })
        if (this.#removeUnused) {
            this.#logInfo(`deleting merged VHD child`, { child: childDisk.getPath() })
            return VhdAbstract.unlink(this.#handler, childDisk.getPath())
        }*/
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #cleanup(parentDisk, childDisk) {
        const finalVhdSize = this.#state?.vhdSize ?? 0
        const mergedDataSize = this.#state?.mergedDataSize ?? 0
        await this.#handler.unlink(this.#statePath).catch(warn)
        await parentDisk.close().catch(warn)
        await childDisk.close().catch(warn)
        return { mergedDataSize, finalVhdSize }
    }
}
