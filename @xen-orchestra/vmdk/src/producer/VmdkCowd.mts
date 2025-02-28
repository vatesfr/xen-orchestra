import { Disk, DiskBlock, RandomAccessDisk } from "@xen-orchestra/disk-transform";



export class VmdkCowd extends RandomAccessDisk{
    
    readBlock(index: number): Promise<DiskBlock> {
        throw new Error("Method not implemented.");
    }
    getVirtualSize(): number {
        throw new Error("Method not implemented.");
    }
    getBlockSize(): number {
        throw new Error("Method not implemented.");
    }
    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    close(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    isDifferencing(): boolean {
        throw new Error("Method not implemented.");
    }
    openParent(): Promise<Disk> {
        throw new Error("Method not implemented.");
    }
    getBlockIndexes(): Array<number> {
        throw new Error("Method not implemented.");
    }
    hasBlock(index: number): boolean {
        throw new Error("Method not implemented.");
    }
    
}