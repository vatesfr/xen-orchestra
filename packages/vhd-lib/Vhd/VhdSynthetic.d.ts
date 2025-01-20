export const VhdSynthetic: {
    new (vhds: Array<VhdAbstract>): {
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
import { VhdAbstract } from "./VhdAbstract";
