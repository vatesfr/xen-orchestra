/**
 * Build an incremental VHD which can be applied to a child to revert to the state of its parent.
 * @param {*} parent
 * @param {*} descendant
 */
export class VhdNegative extends VhdAbstract {
    constructor(parent: any, child: any);
    get header(): any;
    get footer(): any;
    readBlockAllocationTable(): Promise<[any, any]>;
    containsBlock(blockId: any): any;
    readHeaderAndFooter(): Promise<[any, any]>;
    readBlock(blockId: any, onlyBitmap?: boolean): Promise<any>;
    mergeBlock(child: any, blockId: any): void;
    _readParentLocatorData(id: any): any;
    #private;
}
import { VhdAbstract } from "./VhdAbstract";
