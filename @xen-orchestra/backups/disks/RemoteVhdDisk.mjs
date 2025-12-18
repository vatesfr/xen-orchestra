import { openVhd } from 'vhd-lib'
import { RemoteDisk } from "./RemoteDisk.mjs";
import { DISK_TYPES } from 'vhd-lib/_constants.js'
import { stringify } from 'uuid'

/**
 * @typedef {import('./RemoteDisk.mjs').DiskMetadata} DiskMetadata
 * @typedef {import('./RemoteDisk.mjs').RemoteDisk} RemoteDisk
 * @typedef {import('@xen-orchestra/disk-transform').DiskBlock} DiskBlock
 */

export class RemoteVhdDisk extends RemoteDisk {
    /**
     * @type {string}
     */
    #path

    /**
     * @type {FileAccessor}
     */
    #handler

    /**
     * @type {VhdFile | VhdDirectory | undefined}
     */
    #vhd

    /**
     * @type {boolean | undefined}
     */
    #isDifferencing

    /**
     * @type {() => any}
     */
    #dispose = () => { }

    /**
     * @param {Object} params
     * @param {FileAccessor} params.handler
     * @param {string} params.path
     */
    constructor({ handler, path }) {
        super()
        // @todo : ensure this is the full path from the root of the remote
        this.#path = path
        this.#handler = handler
    }

    /**
     * Initializes the VHD.
     * @returns {Promise<void>}
     */
    async init() {
        if (this.#vhd === undefined) {
            const { value, dispose } = await openVhd(this.#handler, this.#path)
            this.#vhd = value
            this.#dispose = dispose
            await this.#vhd.readBlockAllocationTable()
            this.#isDifferencing = value.footer.diskType === DISK_TYPES.DIFFERENCING
        }
    }

    /**
     * Closes the VHD.
     * @returns {Promise<void>}
     */
    async close() {
        await this.#dispose()
    }

    /**
     * @returns {number}
     */
    getVirtualSize() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call getVirtualSize of a RemoteVhdDisk before init`)
        }
        return this.#vhd.footer.currentSize
    }

    /**
     * @returns {number}
     */
    getBlockSize() {
        return 2 * 1024 * 1024
    }

    /**
     * @returns {string}
     */
    getPath() {
        return this.#path
    }

    /**
     * @returns {string}
     */
    getUuid() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call getUid of a RemoteVhdDisk before init`)
        }

        return stringify(this.#vhd.footer.uuid)
    }

    /**
     * @returns {number}
     */
    getMaxTableEntries() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call getMaxTableEntries of a RemoteVhdDisk before init`)
        }

        return this.#vhd.header.maxTableEntries
    }

    /**
     * Checks if the VHD contains a specific block.
     * @param {number} index
     * @returns {boolean}
     */
    hasBlock(index) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call hasblock of a RemoteVhdDisk before init`)
        }
        return this.#vhd.containsBlock(index)
    }

    /**
     * Gets the indexes of all blocks in the VHD.
     * @returns {Array<number>}
     */
    getBlockIndexes() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call getBlockIndexes of a RemoteVhdDisk before init`)
        }
        const index = []
        for (let blockIndex = 0; blockIndex < this.#vhd.header.maxTableEntries; blockIndex++) {
            if (this.hasBlock(blockIndex)) {
                index.push(blockIndex)
            }
        }
        return index
    }

    /**
     * Writes a full block into this VHD.
     * @param {number} index
     * @param {Buffer} data
     * @return {number}
     */
    async writeBlock(index, data) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
        }
        await this.#vhd.writeEntireBlock({ id: index, buffer: data })
        await this.#vhd.writeBlockAllocationTable()

        return this.getBlockSize();
    }

    /**
     * Reads a specific block from the VHD.
     * @param {number} index
     * @returns {Promise<DiskBlock>}
     */
    async readBlock(index) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
        }
        const { data } = await this.#vhd.readBlock(index)
        return {
            index,
            data,
        }
    }

    /**
     * @returns {DiskMetadata}
     */
    getMetadata() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call setvirtualsize of a RemoteVhdDisk before init`)
        }
        
        return this.#vhd.footer;
    }

    /**
     * @param {RemoteDisk} child
     */
    mergeMetadata(child) {
        const childMetadata = child.getMetadata();

        if (this.#vhd === undefined) {
            throw new Error(`can't call mergeMetadata of a RemoteVhdDisk before init`)
        }

        this.#vhd.footer.currentSize = childMetadata.currentSize
        this.#vhd.footer.diskGeometry = { ...childMetadata.diskGeometry }
        this.#vhd.footer.originalSize = childMetadata.originalSize
        this.#vhd.footer.timestamp = childMetadata.timestamp
        this.#vhd.footer.uuid = childMetadata.uuid
    }

    /**
     * @param {DiskMetadata} metadata
     */
    setMetadata(metadata) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call setvirtualsize of a RemoteVhdDisk before init`)
        }

        this.#vhd.footer.currentSize = metadata.currentSize ?? this.#vhd.footer.currentSize
        this.#vhd.footer.diskGeometry = metadata.diskGeometry ?? this.#vhd.footer.diskGeometry
        this.#vhd.footer.originalSize = metadata.originalSize ?? this.#vhd.footer.originalSize
        this.#vhd.footer.timestamp = metadata.timestamp ?? this.#vhd.footer.timestamp
        this.#vhd.footer.uuid = metadata.uuid ?? this.#vhd.footer.uuid
    }

    /**
     * Writes block allocation table
     */
    async writeBlockAllocationTable() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhdDisk before init`)
        }
        await this.#vhd.writeBlockAllocationTable()
    }

    /**
     * Deletes disk
     */
    async unlink() {
        await this.close()
        await this.#handler.unlink(this.#path)
    }
}