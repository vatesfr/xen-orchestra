import { openVhd } from 'vhd-lib'
import { RemoteDisk } from "./RemoteDisk.mjs";
import { DISK_TYPES } from 'vhd-lib/_constants.js'

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
     * @returns {number}
     */
    getVirtualSize() {
        if (this.#vhd === undefined) {
        throw new Error(`can't call getvirtualsize of a RemoteVhd before init`)
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
     * Checks if the VHD contains a specific block.
     * @param {number} index
     * @returns {boolean}
     */
    hasBlock(index) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call hasblock of a RemoteVhd before init`)
        }
        return this.#vhd.containsBlock(index)
    }

    /**
     * Gets the indexes of all blocks in the VHD.
     * @returns {Array<number>}
     */
    getBlockIndexes() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call getBlockIndexes of a RemoteVhd before init`)
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
     */
    async writeBlock(index, data) {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
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
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        const { data } = await this.#vhd.readBlock(index)
        return {
            index,
            data,
        }
    }

    /**
     * Reads the VHD header.
     * @returns {Promise<DiskBlock>}
     */
    readHeader() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        return this.#vhd.header
    }


    /**
     * Reads the VHD footer.
     * @returns {Promise<DiskBlock>}
     */
    readFooter() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        return this.#vhd.footer
    }

    /**
     * Writes header back to the VHD
     */
    async writeHeader() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        await this.#vhd.writeHeader()
    }

    /**
     * Writes footer back to the VHD
     */
    async writeFooter() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        await this.#vhd.writeFooter()
    }

    /**
     * Writes block allocation table
     */
    async writeBlockAllocationTable() {
        if (this.#vhd === undefined) {
            throw new Error(`can't call readBlock of a RemoteVhd before init`)
        }
        await this.#vhd.writeBlockAllocationTable()
    }
}