
import NbdClient from "./index.mjs";



async function bench(){
    const client = new NbdClient({
        address:'172.16.210.14',
        port: 8077,
        exportname: 'bench_export'
    })
    await client.connect()
    console.log('connected', client.exportSize)

    for(let chunk_size=16*1024; chunk_size < 16*1024*1024; chunk_size *=2){


    let i=0
    const start = + new Date()
    for await(const block of client.readBlocks(chunk_size) ){
        i++
        if((i*chunk_size) % (16*1024*1024) ===0){
                process.stdout.write('.')
        }
        if(i*chunk_size > 1024*1024*1024) break
    }
    console.log(chunk_size,Math.round( (i*chunk_size/1024/1024*1000)/ (new Date() - start)))

    }
}

bench()
