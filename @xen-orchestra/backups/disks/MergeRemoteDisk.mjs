
/**
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 */

import assert from 'assert'
import { createLogger } from '@xen-orchestra/log'

import { basename, dirname } from 'path'
import { asyncEach } from '@vates/async-each'
import { RemoteVhdDisk } from './RemoteVhdDisk.mjs'

const { warn } = createLogger('remote-disk:merge')

/**
 * 
 * @typedef {Object} MergeState
 * @property {{ uuid: number }} child
 * @property {{ uuid: number }} parent
 * @property {number} currentBlock
 * @property {number} mergedDataSize
 * @property {'mergeBlocks' | 'cleanup'} step
 * @property {number} diskSize
 */

export class MergeRemoteDisk {
    /**
     * @type {MergeState}
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
    constructor(handler, { onProgress = () => { }, logInfo = () => { }, mergeBlockConcurrency = 2 }) {
        this.#handler = handler
        this.#logInfo = logInfo
        this.#onProgress = onProgress
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

        try {
            const mergeStateContent = await this.#handler.readFile(this.#statePath)
            this.#state = JSON.parse(mergeStateContent)

            // work-around a bug introduce in 97d94b795
            //
            // currentBlock could be `null` due to the JSON.stringify of a `NaN` value
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
            case 'cleanup':
                await this.#step_cleanup(parentDisk, childDisk)
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
        const getMaxBlockCount = childDisk.getMaxBlockCount()

        if (!this.#state) {
            this.#state = {
                child: { uuid: childDisk.getUuid() ?? 0 },
                parent: { uuid: parentDisk.getUuid() ?? 0 },
                currentBlock: 0,
                mergedDataSize: 0,
                step: 'mergeBlocks',
            }

            // finds first allocated block for the 2 following loops
            while (this.#state.currentBlock < getMaxBlockCount && !childDisk.hasBlock(this.#state.currentBlock)) {
                ++this.#state.currentBlock
            }
            await this.#writeState()
        }

        await this.#mergeBlocks(parentDisk, childDisk)
        await parentDisk.flushMetadata()
        parentDisk.mergeMetadata(childDisk)
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #mergeBlocks(parentDisk, childDisk) {
        if(parentDisk instanceof RemoteVhdDisk || childDisk instanceof RemoteVhdDisk){
            this.#mergeBlockConcurrency = 1 // TODO: TEST
        }

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

                const blockSize = await parentDisk.writeBlock((await childDisk.readBlock(blockId)))
                this.#state.mergedDataSize += blockSize

                this.#state.currentBlock = Math.min(...merging)
                merging.delete(blockId)

                this.#onProgress({ total: nBlocks, done: counter + 1 })
                counter++
                await this.#writeStateThrottled()
            },
            { concurrency: this.#mergeBlockConcurrency }
        )

        await this.#writeState()
        
        this.#state.diskSize = childDisk.getSize()

        this.#onProgress({ total: nBlocks, done: nBlocks })
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #step_cleanup(parentDisk, childDisk) {
        assert.notEqual(this.#state, undefined)
        this.#state.step = 'cleanup'
        await this.#writeState()

        const newPath = childDisk.getPath()

        await childDisk.unlink()

        try {
            await this.#handler.rename(parentDisk.getPath(), newPath)
        } catch (error) {
            if (error.code === 'ENOENT' && this.#isResuming) {
                this.#logInfo(`the parent disk was already renamed`, { parent: parentDisk.getPath(), mergeTarget: newPath })
            } else {
                throw error
            }
        }
    }

    /**
     * @param {RemoteDisk} parentDisk
     * @param {RemoteDisk} childDisk
     */
    async #cleanup(parentDisk, childDisk) {
        console.log('close')
        const finalDiskSize = this.#state?.diskSize ?? 0
        const mergedDataSize = this.#state?.mergedDataSize ?? 0
        await this.#handler.unlink(this.#statePath).catch(warn)
        await parentDisk.close().catch(warn)
        await childDisk.close().catch(warn)
        return { mergedDataSize, finalDiskSize }
    }
}