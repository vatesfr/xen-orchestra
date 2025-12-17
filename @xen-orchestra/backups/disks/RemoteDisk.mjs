import { RandomAccessDisk } from "@xen-orchestra/disk-transform"

/**
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
    getUuid() {}

    /**
     * Abstract
     * @returns {number}
     */
    getMaxTableEntries() {}

    /**
     * Writes a full block.
     * @param {number} index
     * @param {Buffer} data
     * @return {number
     */
    writeBlock(index, data) {}

    /**
     * Abstract
     * @returns {DiskMetadata}
     */
    getMetadata() {}

    /**
     * Abstract
     * @param {DiskMetadata} metadata
     */
    setMetadata(metadata) {}

    /**
     * Abstract
     * @param {RemoteDisk} child
     */
    mergeMetadata(child) {}
}