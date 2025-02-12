
import { DiskBlock, PortableDisk } from "../PortableDisk.mjs";
import { XapiVhdCbtSource } from "./XapiVhdCbt.mjs";
import { XapiVhdStreamNbdSource } from "./XapiVhdStreamNbd.mjs";
import { XapiVhdStreamSource } from "./XapiVhdStreamSource.mjs";

// import { createLogger } from '@xen-orchestra/log' 

// @todo : I can't find the right type for createLogger with it's dynamic properties
const warn = console.error

/**
 * meta class that handle the fall back logic when trying to export a disk from xapi 
 * use nbd , change block tracking and stream export depending of capabilities
 */
export class XapiDiskSource extends PortableDisk{

    #vdiRef:string
    #baseRef?:string
    #preferNbd:boolean
    #nbdConcurrency:number
    #xapi:any // @todo do a better type here 

    #source:PortableDisk
  
    constructor({xapi, vdiRef, baseRef, preferNbd=true, nbdConcurrency=2}){
        super()
        this.#vdiRef = vdiRef
        this.#baseRef = baseRef
        this.#preferNbd = preferNbd
        this.#nbdConcurrency = nbdConcurrency
        this.#xapi = xapi

    }
    getVirtualSize(): number {
        return this.#source.getVirtualSize()
    }
    getBlockSize(): number {
        return this.#source.getBlockSize()
    }
    /**
     * create a disk source using stream export + NBD 
     * on failure fall back to a full 
     * 
     * @returns {Promise<XapiVhdStreamSource>}
     */
    async #openNbdStream():Promise<XapiVhdStreamNbdSource>{
        console.log('open nbd stream')
        const xapi = this.#xapi
        const baseRef = this.#baseRef
        const vdiRef = this.#vdiRef
        let source = new XapiVhdStreamNbdSource({vdiRef, baseRef, xapi, nbdConcurrency:this.#nbdConcurrency})
        try{
            await source.init()
        }catch(err){
            await source.close()
            if(err.code === 'VDI_CANT_DO_DELTA'){
                warn(`can't compute delta of XapiVhdStreamNbdSource ${vdiRef} from ${baseRef}, fallBack to a full`)
                source = new XapiVhdStreamNbdSource({vdiRef, baseRef, xapi})
                await source.init()
            } else {
                throw err
            }
        }        
        return source
    }

    /**
     * create a disk source using stream export
     * on failure fall back to a full 
     * 
     * @returns {Promise<XapiVhdStreamSource>}
     */
    
    async #openExportStream():Promise<XapiVhdStreamSource>{
        console.log('open export stream')
        const xapi = this.#xapi
        const baseRef = this.#baseRef
        const vdiRef = this.#vdiRef
        let source = new XapiVhdStreamSource({vdiRef, baseRef, xapi})
        try{
            await source.init()
        }catch(err){
            await source.close()
            if(err.code === 'VDI_CANT_DO_DELTA'){
                warn(`can't compute delta of XapiVhdStreamSource ${vdiRef} from ${baseRef}, fallBack to a full`)
                source = new XapiVhdStreamSource({vdiRef, baseRef, xapi})
                await source.init()
            } else {
                throw err
            }
        }
        return source

    }

    /**
     * create a disk source using nbd and CBT
     * on failure fall back to stream + nbd 
     * 
     * @returns {Promise<XapiVhdCbtSource|XapiVhdStreamNbdSource>}
     */

    async #openNbdCbt():Promise<XapiVhdCbtSource|XapiVhdStreamNbdSource>{
        console.log('open nbdcbt')
        const xapi = this.#xapi
        const baseRef = this.#baseRef
        const vdiRef = this.#vdiRef
        let source = new XapiVhdCbtSource({vdiRef, baseRef, xapi, nbdConcurrency:this.#nbdConcurrency})
        try{
            await source.init()
            return source
        }catch(error){
            warn('opennbdCBT',error)
            await source.close()
            // a lot of things can go wrong with cbt: 
                // no enabled on the basref
                // not anebaled on the vdi
                // disabled/enabled in between
                // sr not supporting it 
                // Plus the standard failures 

            // try without CBT on failure 
            return this.#openNbdStream()
        }
    }

    
    async init(): Promise<void> {
        console.log('INIT XAPI export', {
            preferNbd:this.#preferNbd,
            baseRef:this.#baseRef,
            vdiRef:this.#vdiRef,
        })
        if(this.#preferNbd){
            if(this.#baseRef !== undefined){
                this.#source = await this.#openNbdCbt() 
            } else {
                // pure CBT/nbd is not available for base  :
                // the base incremental needs the block list to work efficiently 
                this.#source = await this.#openNbdStream()
            }
        } else {
            this.#source = await this.#openExportStream()
        }
    }
    close(): Promise<void> {
        return this.#source?.close()
    }
    isDifferencing(): boolean {
        return this.#source?.isDifferencing()
    }
    openParent(): Promise<PortableDisk> {
        return this.#source?.openParent()
    }
    getBlockIndexes(): Array<number> {
        return this.#source?.getBlockIndexes()
    }
    hasBlock(index: number): boolean {
        return this.#source?.hasBlock(index)
    }
    buildDiskBlockGenerator(): Promise<AsyncGenerator<DiskBlock>> | AsyncGenerator<DiskBlock> {
        return this.#source?.buildDiskBlockGenerator()
    }
    
}
