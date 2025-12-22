import { RandomAccessDisk } from "@xen-orchestra/disk-transform"

/**
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 * @typedef {import('./RemoteDisk.mjs').DiskMetadata} DiskMetadata
 * 
 * @typedef {(Object)} DiskMetadata
 * @property {(string)} uuid
 * @property {(string)} parentId
 * @property {(number)} virtualSize
 * @property {(string)} parentLocation
 */


export class RemoteDisk extends RandomAccessDisk {
    /**
     * Abstract
     * @returns {string}
     */
    getPath() { }

    /**
     * Abstract
     * @returns {string}
     */
    getUuid() { }

    /**
     * Abstract
     * @returns {number}
     */
    getMaxTableEntries() { }

    /**
     * Abstract
     * Writes a full block.
     * @param {number} index
     * @param {Buffer} data
     * @return {number
     */
    async writeBlock(index, data) { }


    /**
     * Abstract
     * Reads a specific block.
     * @param {number} index
     * @returns {Promise<DiskBlock>}
     */
    async readBlock(index) { }

    /**
     * Abstract
     * @returns {DiskMetadata}
     */
    getMetadata() { }

    /**
     * Abstract
     * @param {RemoteDisk} child
     */
    mergeMetadata(child) { }

    /**
     * Abstract
     * @param {DiskMetadata} metadata
     */
    setMetadata(metadata) { }

    /**
     * Abstract
     * Writes block allocation table
     */
    async writeBlockAllocationTable() { }

    /**
     * Abstract
     * Deletes disk
     */
    async unlink() { }
}