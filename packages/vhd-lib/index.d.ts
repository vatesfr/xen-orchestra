export const chainVhd: (parentHandler: any, parentPath: any, childHandler: any, childPath: any, force?: boolean) => Promise<void>;
export const checkFooter: (footer: any) => void;
export const checkVhdChain: (handler: any, path: any) => Promise<void>;
export const createReadableSparseStream: (diskSize: any, fragmentSize: any, fragmentLogicAddressList: any, fragmentIterator: any) => Promise<Function>;
export const createVhdStreamWithLength: (stream: any) => Promise<{
    _footerOffset: any;
    _footerBuffer: any;
    _position: number;
    _done: boolean;
    _transform(data: any, encoding: any, callback: any): void;
}>;
export const createVhdDirectoryFromStream: (handler: any, path: any, inputStream: any, { validator, concurrency, compression }?: {
    validator: any;
    concurrency?: number;
    compression: any;
}) => Promise<any>;
export const isVhdDifferencingDisk: (stream: any) => Promise<boolean>;
export const peekFooterFromVhdStream: (stream: any) => Promise<any>;
export const openVhd: (handler: any, path: any, opts: any) => Promise<{
    dispose: () => void;
    value: import("./Vhd/VhdDirectory").VhdDirectory;
} | {
    dispose: () => any;
    value: import("./Vhd/VhdFile").VhdFile;
}>;
export const VhdAbstract: {
    new (): import("./Vhd/VhdAbstract").VhdAbstract;
    open(): AbstractVhd;
    unlink(handler: any, path: any): Promise<void>;
    createAlias(handler: any, aliasPath: any, targetPath: any): Promise<void>;
};
export const VhdDirectory: {
    new (handler: any, path: any, opts: any): import("./Vhd/VhdDirectory").VhdDirectory;
    open(handler: any, path: any, { flags }?: {
        flags?: string;
    }): Promise<{
        dispose: () => void;
        value: import("./Vhd/VhdDirectory").VhdDirectory;
    }>;
    create(handler: any, path: any, { flags, compression }?: {
        flags?: string;
        compression: any;
    }): Promise<{
        dispose: () => void;
        value: import("./Vhd/VhdDirectory").VhdDirectory;
    }>;
    unlink(handler: any, path: any): Promise<void>;
    createAlias(handler: any, aliasPath: any, targetPath: any): Promise<void>;
};
export const VhdFile: {
    new (handler: any, path: any): import("./Vhd/VhdFile").VhdFile;
    open(handler: any, path: any, { flags, checkSecondFooter }?: {
        flags: any;
        checkSecondFooter?: boolean;
    }): Promise<{
        dispose: () => any;
        value: import("./Vhd/VhdFile").VhdFile;
    }>;
    create(handler: any, path: any, { flags }?: {
        flags: any;
    }): Promise<{
        dispose: () => any;
        value: import("./Vhd/VhdFile").VhdFile;
    }>;
    unlink(handler: any, path: any): Promise<void>;
    createAlias(handler: any, aliasPath: any, targetPath: any): Promise<void>;
};
export const VhdSynthetic: {
    new (vhds: import("./Vhd/VhdAbstract").VhdAbstract[]): {
        "__#4@#vhds": any[];
        readonly header: any;
        readonly footer: any;
        readonly compressionType: any;
        readBlockAllocationTable(): Promise<void>;
        containsBlock(blockId: any): boolean;
        readHeaderAndFooter(): Promise<void>;
        "__#4@#getVhdWithBlock"(blockId: any): any;
        readBlock(blockId: any, onlyBitmap?: boolean): Promise<any>;
        mergeBlock(child: any, blockId: any): Promise<void>;
        _readParentLocatorData(id: any): any;
        _getFullBlockPath(blockId: any): any;
        checkVhdsClass(cls: any): boolean;
        readonly bitmapSize: number;
        readonly fullBlockSize: any;
        readonly sectorsOfBitmap: number;
        readonly sectorsPerBlock: number;
        ensureBatSize(entries: number): void;
        writeFooter(onlyEndFooter?: boolean): void;
        writeHeader(): void;
        _writeParentLocatorData(parentLocatorId: any, platformDataOffset: any, data: any): void;
        readonly batSize: number;
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
    };
    fromVhdChain: any;
    open: any;
    unlink(handler: any, path: any): Promise<void>;
    createAlias(handler: any, aliasPath: any, targetPath: any): Promise<void>;
};
export const VhdNegative: typeof import("./Vhd/VhdNegative").VhdNegative;
export const Constants: typeof import("./_constants");
