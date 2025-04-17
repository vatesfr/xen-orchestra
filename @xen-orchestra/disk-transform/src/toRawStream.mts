import { Readable } from "stream";
import { RandomAccessDisk } from "./Disk.mjs";


export async function *toRaw({disk }: {disk:RandomAccessDisk}){
    const nbBlocks =  Math.ceil(disk.getVirtualSize()/disk.getBlockSize())

    const empty = Buffer.alloc(disk.getBlockSize(), 0)
    for(let i=0;i < nbBlocks; i++){
        if(disk.hasBlock(i)){
            const { data} = await disk.readBlock(i)
            yield data
        } else {
            yield empty
        }
    }
}

export function toRawStream({disk }: {disk:RandomAccessDisk}){
    return Readable.from(toRaw({disk}), {objectMode : false, highWaterMark: 10*1024*1024})
}