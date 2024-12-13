export class VhdFile extends VhdAbstract {
    static open(handler: any, path: any, { flags, checkSecondFooter }?: {
        flags: any;
        checkSecondFooter?: boolean;
    }): Promise<{
        dispose: () => any;
        value: VhdFile;
    }>;
    static create(handler: any, path: any, { flags }?: {
        flags: any;
    }): Promise<{
        dispose: () => any;
        value: VhdFile;
    }>;
    constructor(handler: any, path: any);
    footer: any;
    set header(arg: any);
    get header(): any;
    _handler: any;
    _path: any;
    _read(start: any, n: any): Promise<any>;
    _getEndOfHeaders(): number;
    _getBatEntry(blockId: any): any;
    _getEndOfData(): number;
    containsBlock(id: any): boolean;
    readHeaderAndFooter(checkSecondFooter?: boolean): Promise<void>;
    readBlockAllocationTable(): Promise<void>;
    readBlock(blockId: any, onlyBitmap?: boolean): Promise<{
        id: any;
        bitmap: any;
        data?: undefined;
        buffer?: undefined;
    } | {
        id: any;
        bitmap: any;
        data: any;
        buffer: any;
    }>;
    _write(data: any, offset: any): Promise<any>;
    _freeFirstBlockSpace(spaceNeededBytes: any): any;
    ensureBatSize(entries: any): Promise<void>;
    _setBatEntry(block: any, blockSector: any): Promise<any>;
    _createBlock(blockId: any): Promise<number>;
    _writeBlockBitmap(blockAddr: any, bitmap: any): Promise<void>;
    writeEntireBlock(block: any): Promise<void>;
    _writeBlockSectors(block: any, beginSectorId: any, endSectorId: any, parentBitmap: any): Promise<void>;
    writeFooter(onlyEndFooter?: boolean): Promise<void>;
    writeHeader(): Promise<any>;
    writeBlockAllocationTable(): Promise<any>;
    writeData(offsetSectors: any, buffer: any): Promise<void>;
    _ensureSpaceForParentLocators(neededSectors: any): Promise<number>;
    _readParentLocatorData(parentLocatorId: any): Promise<any>;
    _writeParentLocatorData(parentLocatorId: any, data: any): Promise<void>;
    getSize(): Promise<any>;
    #private;
}
import { VhdAbstract } from "./VhdAbstract";
