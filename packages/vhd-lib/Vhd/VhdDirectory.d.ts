export class VhdDirectory extends VhdAbstract {
    static open(handler: any, path: any, { flags }?: {
        flags?: string;
    }): Promise<{
        dispose: () => void;
        value: VhdDirectory;
    }>;
    static create(handler: any, path: any, { flags, compression }?: {
        flags?: string;
        compression: any;
    }): Promise<{
        dispose: () => void;
        value: VhdDirectory;
    }>;
    constructor(handler: any, path: any, opts: any);
    footer: any;
    get compressionType(): any;
    set header(arg: any);
    get header(): any;
    _handler: any;
    _path: any;
    _opts: any;
    writeBlockAllocationTable(): Promise<any>;
    readBlockAllocationTable(): Promise<void>;
    containsBlock(blockId: any): boolean;
    _readChunk(partName: any): Promise<{
        buffer: any;
    }>;
    _writeChunk(partName: any, buffer: any): Promise<any>;
    _getFullBlockPath(blockId: any): string;
    readHeaderAndFooter(): Promise<void>;
    readBlock(blockId: any, onlyBitmap?: boolean): Promise<{
        id: any;
        bitmap: any;
        data: any;
        buffer: any;
    }>;
    ensureBatSize(): void;
    writeFooter(): Promise<void>;
    writeHeader(): Promise<void>;
    mergeBlock(child: any, blockId: any, isResumingMerge?: boolean): Promise<number>;
    writeEntireBlock(block: any): Promise<void>;
    _readParentLocatorData(id: any): Promise<any>;
    _writeParentLocatorData(id: any, data: any): Promise<void>;
    #private;
}
import { VhdAbstract } from "./VhdAbstract";
