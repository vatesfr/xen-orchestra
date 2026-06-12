//@ts-check
import { NbdDisk } from '@vates/nbd-client/NbdDisk.mjs'
import { ReadAhead } from "@xen-orchestra/disk-transform";


async function bench(){ 
    const HOST =  'localhost'
    const PORT =  11000
    const BLOCK_SIZE = 2*1024*1024
    const DISK_SIZE = 10*1024*1024*1024 
    const MAX_BENCH_DURATION  = 60000
    const BLOCK_INDEXES = [...Array(Math.ceil(DISK_SIZE /BLOCK_SIZE)).keys()]

    const dataMap = BLOCK_INDEXES
        .map(index => ({type: 0, offset: index*BLOCK_SIZE, length:BLOCK_SIZE}))

   // const readAhead = new ReadAhead(consumer)

 
    const CONSUMERS = [1, 2, 3, 4 , 8 ]
    const stats = [] 
        
    for(const nbConsumer of CONSUMERS ){ 
        let read = 0
        const start = performance.now()
        const consumer = new NbdDisk({address: HOST,port:PORT , exportname: 'disk'}, BLOCK_SIZE, {dataMap, nbdConcurrency:nbConsumer})
        await consumer.init() 
        const readAhead = new ReadAhead(consumer)
        for await (const block of readAhead.diskBlocks() ){
            read += block.data.length
            if(start - performance.now() > MAX_BENCH_DURATION){
                break
            }
        }
        const exactDuration = (performance.now() - start)/1000
        const duration = Math.round(exactDuration * 10)/10
        const speed = Math.round( read / 1024 /1024 / 1024/ exactDuration *10)/10
        stats.push({nbConsumer, duration, speed })
        await consumer.close()

        console.table(stats)
    }  
   
}   


bench()