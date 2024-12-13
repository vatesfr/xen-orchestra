export class VhdAbstract {
    /**
     * instantiate a Vhd
     *
     * @returns {AbstractVhd}
     */
    static open(): AbstractVhd;
    static unlink(handler: any, path: any): Promise<void>;
    static createAlias(handler: any, aliasPath: any, targetPath: any): Promise<void>;
    get bitmapSize(): number;
    get fullBlockSize(): any;
    get sectorsOfBitmap(): number;
    get sectorsPerBlock(): number;
    get header(): void;
    get footer(): void;
    /**
     * Check if this vhd contains a block with id blockId
     * Must be called after readBlockAllocationTable
     *
     * @param {number} blockId
     * @returns {boolean}
     *
     */
    containsBlock(blockId: number): boolean;
    /**
     * Read the header and the footer
     * check their integrity
     * if checkSecondFooter also checks that the footer at the end is equal to the one at the beginning
     *
     * @param {boolean} checkSecondFooter
     */
    readHeaderAndFooter(checkSecondFooter?: boolean): void;
    readBlockAllocationTable(): void;
    /**
     * @typedef {Object} BitmapBlock
     * @property {number} id
     * @property {Buffer} bitmap
     *
     * @typedef {Object} FullBlock
     * @property {number} id
     * @property {Buffer} bitmap
     * @property {Buffer} data
     * @property {Buffer} buffer - bitmap + data
     *
     * @param {number} blockId
     * @param {boolean} onlyBitmap
     * @returns {Promise<BitmapBlock | FullBlock>}
     */
    readBlock(blockId: number, onlyBitmap?: boolean): Promise<{
        id: number;
        bitmap: Buffer;
    } | {
        id: number;
        bitmap: Buffer;
        data: Buffer;
        /**
         * - bitmap + data
         */
        buffer: Buffer;
    }>;
    /**
     * coalesce the block with id blockId from the child vhd into
     * this vhd
     *
     * @param {AbstractVhd} child
     * @param {number} blockId
     *
     * @returns {number} the merged data size
     */
    mergeBlock(child: AbstractVhd, blockId: number): number;
    /**
     * ensure the bat size can store at least entries block
     * move blocks if needed
     * @param {number} entries
     */
    ensureBatSize(entries: number): void;
    writeFooter(onlyEndFooter?: boolean): void;
    writeHeader(): void;
    _writeParentLocatorData(parentLocatorId: any, platformDataOffset: any, data: any): void;
    _readParentLocatorData(parentLocatorId: any, platformDataOffset: any, platformDataSpace: any): void;
    get batSize(): number;
    writeParentLocator({ id, platformCode, data }: {
        id: any;
        platformCode?: number;
        data?: Buffer;
    }): Promise<void>;
    readParentLocator(id: any): Promise<{
        platformCode: any;
        id: any;
        data: void;
    }>;
    setUniqueParentLocator(fileNameString: any): Promise<void>;
    blocks(): AsyncGenerator<{
        id: number;
        bitmap: Buffer;
    } | {
        id: number;
        bitmap: Buffer;
        data: Buffer;
        /**
         * - bitmap + data
         */
        buffer: Buffer;
    }, void, unknown>;
    streamSize(): number;
    stream({ onProgress }?: {
        onProgress: any;
    }): any;
    rawContent(): any;
    containsAllDataOf(child: any): Promise<boolean>;
    readRawData(start: any, length: any, cache: any, buf: any): Promise<number>;
}
