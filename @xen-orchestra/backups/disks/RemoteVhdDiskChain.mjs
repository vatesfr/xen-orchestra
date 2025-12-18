/**
 * @typedef {import('./RemoteDisk.mjs').DiskMetadata} DiskMetadata
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('./RemoteVhdDisk.mjs').RemoteVhdDisk} RemoteVhdDisk
 */

import { openVhd } from 'vhd-lib'
import { RemoteDisk } from "./RemoteDisk.mjs";
import { DISK_TYPES } from 'vhd-lib/_constants.js'
import { stringify } from 'uuid'

export class RemoteVhdDiskChain extends RemoteDisk {
    /**
     * @type {RemoteVhdDisk[]}
     */
    #disks

    /**
     * @param {Object} params
     * @param {FileAccessor} params.handler
     * @param {RemoteVhdDisk[]} params.disks
     */
    constructor({ disks }) {
        super()
        this.#disks = disks
    }

    /**
     * Initializes the VHD.
     * @returns {Promise<void>}
     */
    async init() {
        await Promise.all(this.#disks.map(disk => disk.init()))
    }

    /**
     * Closes the VHD.
     * @returns {Promise<void>}
     */
    async close() {
        await Promise.all(this.#disks.map(disk => disk.close()))
    }

    /**
     * @returns {number}
     */
    getVirtualSize() {
        return this.#disks[this.#disks.length - 1].getVirtualSize()
    }

    /**
     * @returns {number}
     */
    getBlockSize() {
        return this.#disks[0].getBlockSize()
    }

    /**
     * @returns {string}
     */
    getPath() {
        return this.#disks[0].getPath()
    }

    /**
     * @returns {string}
     */
    getUuid() {
        return this.#disks[0].getUuid()
    }

    /**
     * @returns {number}
     */
    getMaxTableEntries() {
        return this.#disks[this.#disks.length - 1].getMaxTableEntries()
    }

    /**
     * Checks if the VHD contains a specific block.
     * @param {number} index
     * @returns {boolean}
     */
    hasBlock(index) {
        for (let i = this.#disks.length - 1; i >= 0; i--) {
            if (this.#disks[i].hasBlock(index)) {
                return true
            }
        }

        return false
    }

    /**
     * Gets the indexes of all blocks in the VHD.
     * @returns {Array<number>}
     */
    getBlockIndexes() {
        const indexes = new Set()
        for (const disk of this.#disks) {
            for (const index of disk.getBlockIndexes()) {
                indexes.add(index)
            }
        }
        return [...indexes]
    }

    /**
     * Writes a full block into this VHD.
     * @param {number} index
     * @param {Buffer} data
     * @return {number}
     */
    async writeBlock(index, data) {
        throw new Error(`Can't write blocks into a disk chain`)
    }

    /**
     * Reads a specific block from the VHD.
     * @param {number} index
     * @returns {Promise<DiskBlock>}
     */
    async readBlock(index) {
        for (let i = this.#disks.length - 1; i >= 0; i--) {
            if (this.#disks[i].hasBlock(index)) {
                return this.#disks[i].readBlock(index)
            }
        }
        throw new Error(`Block ${index} not found in chain `)
    }

    /**
     * @returns {DiskMetadata}
     */
    getMetadata() {
        return this.#disks[this.#disks.length - 1].getMetadata()
    }

    /**
     * @param {RemoteDisk} child
     */
    mergeMetadata(child) {
        this.#disks[this.#disks.length - 1].mergeMetadata(child)
    }

    /**
     * @param {DiskMetadata} metadata
     */
    setMetadata(metadata) {
        this.#disks[this.#disks.length - 1].setMetadata(metadata)
    }

    /**
     * Writes block allocation table
     */
    async writeBlockAllocationTable() {
        await this.#disks[this.#disks.length - 1].writeBlockAllocationTable()
    }

    /**
     * Deletes all the disks
     */
    async unlink() {
        for (const disk of this.#disks) {
            await disk.unlink()
        }
    }
}