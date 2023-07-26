import VHDEsxiSparse2 from './VHDEsxiSparse2.mjs'
import VHDEsxiSparse from './VhdEsxiSeSparse.mjs'
import VhdEsxiRaw from './VhdEsxiRaw.mjs'
import {open } from 'fs/promises'
import { createWriteStream } from 'fs'

let log = false
const esxi = {
    async download(datastore, path, range ){
        let start=0
        let end = Infinity
        if(range){
            [start, end] = range.split('-').map(s=>parseInt(s,10))
        }
        const fd = await open(datastore+'/'+path);
        const stream = fd.createReadStream({start, end})
        const {size } = await fd.stat(datastore+'/'+path)

        const fake = {
            buffer:function buffer(){
                return new Promise(function (resolve, reject){
                    var bufs = [];
                    stream.on('data', function(d){ bufs.push(d) })
                    stream.on('error', function(err){ reject(err); fd.close() })
                    stream.on('end', function(){
                        resolve(Buffer.concat(bufs)) 
                    })
                })
            },
            headers: {
                get(key){
                    return key === 'content-length'  ? size : undefined
                }
            } ,
            body: stream
        }
        return fake
    }
}

 

async function read(){
    const flat =  await VhdEsxiRaw.open(esxi, '/home/florent/Téléchargements', 'test-flat.vmdk',{thin: false})
    await flat.readBlockAllocationTable()

    const sesparse1 = await VHDEsxiSparse2.open(esxi, '/home/florent/Téléchargements', 'test-000001-sesparse.vmdk' , flat)
    await sesparse1.readBlockAllocationTable()

    
    const sesparse2 = await VHDEsxiSparse2.open(esxi, '/home/florent/Téléchargements', 'test-000002-sesparse.vmdk' , sesparse1)
    await sesparse2.readBlockAllocationTable()

    const nBlocks = sesparse2.header.maxTableEntries
    const out = createWriteStream('/tmp/outsesparse.raw')
    log = false
    
    for (let blockId = 0; blockId < nBlocks; ++blockId) {
        if (await sesparse2.containsBlock(blockId)) {
           const block = await sesparse2.readBlock(blockId)
           await out.write(Buffer.from(block.data))
        } else {
            await out.write(Buffer.alloc(2*1024*1024,0))
        }
      } 
      out.close()

}

read()