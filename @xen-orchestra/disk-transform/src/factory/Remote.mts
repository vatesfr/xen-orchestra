

/**
 * @todo 
 * open all the disk in a folder, and build chains (for clean vm) for clean vm 
 */

import { DiskChain } from "../DiskChain.mjs";
import { FileAccessor } from "../FileAccessor.mjs";
import { RandomAccessDisk } from "../PortableDisk.mjs";
import { RemoteVhd } from "../producer/RemoteVhd.mjs";


export async function openRemoteDisk(handler:FileAccessor, path: string):Promise<RandomAccessDisk>{
    let  disk = new RemoteVhd({handler, path})
    await disk.init()
    return disk
}

export async function openRemoteChain(handler:FileAccessor, childPath: string):Promise<RandomAccessDisk>{
    const disks = Array<RandomAccessDisk>()
    let  disk = new RemoteVhd({handler, path:childPath})
    await disk.init()
    while(disk.isDifferencing()){
        disk = await disk.openParent() as RemoteVhd
        disks.unshift(disk)
    }
    const chain = new DiskChain({disks})
    return chain
}