import assert, { deepEqual, strictEqual } from 'node:assert'
import { createServer } from 'node:net'
import { fromCallback } from 'promise-toolbox'
import { readChunkStrict } from '@vates/read-chunk'
import fs from 'fs/promises'
import {
  INIT_PASSWD,
  NBD_CMD_READ,
  NBD_DEFAULT_PORT,
  NBD_FLAG_FIXED_NEWSTYLE,
  NBD_FLAG_HAS_FLAGS,
  NBD_OPT_EXPORT_NAME,
  NBD_OPT_REPLY_MAGIC,
  NBD_REPLY_ACK,
  NBD_REQUEST_MAGIC,
  OPTS_MAGIC,
  NBD_CMD_DISC,
  NBD_REP_ERR_UNSUP,
  NBD_CMD_WRITE,
  NBD_OPT_GO,
  NBD_OPT_INFO,
  NBD_INFO_EXPORT,
  NBD_REP_INFO,
  NBD_SIMPLE_REPLY_MAGIC
} from './constants.mjs'


let size =0
export default class NbdServer{
    #server
    constructor(port=NBD_DEFAULT_PORT){
        this.#server = createServer()
        this.#server.listen(port)
        this.#server.on('connection', client => this.#handleNewConnection(client));
    }

    #read(client, length) {
        return readChunkStrict(client, length)
    }
    async #readInt32(client){
        const buffer = await this.#read(client,4)
        return buffer.readUInt32BE()
    }

    #write(client,buffer){
        return fromCallback.call(client, 'write', buffer)
    }
    async #writeInt16(client, int16){
        const buffer = Buffer.alloc(2)
        buffer.writeUInt16BE(int16) 
        return this.#write(client, buffer)
    }
    async #writeInt32(client, int32){
        const buffer = Buffer.alloc(4)
        buffer.writeUInt32BE(int32) 
        return this.#write(client, buffer)
    }
    async #writeInt64(client, int64){
        const buffer = Buffer.alloc(8)
        buffer.writeBigUInt64BE(int64) 
        return this.#write(client, buffer)
    }

    async #handleExportNameOption(client){
        // handle export
        // read export length
        const exportNameLength = await this.#readInt32(client)
        // read the export name
        const exportName = (await this.#read(client, exportNameLength)).toString('utf8') 
        client.fd = await fs.open('/home/florent/Téléchargements/Xenosorus_etido(1).vhd')
        // @todo check if this export name is available and authorized
        
        const { size: exportSize} = await  client.fd.stats()
        await this.#writeInt64(client,exportSize)
        await this.#writeInt16(client,NBD_FLAG_HAS_FLAGS/* transmission flag */)
        await this.#write(client,Buffer.alloc(124)/* padding */)

        // go in transmission phase, no more options
        return this.#readCommand(client)
    }

    /**
     * 
     * @param {Socket} client 
     * @returns true if server is waiting for more options
     */
    async #readOption(client){
        console.log('wait for option')
        const magic = await this.#read(client, 8)
        console.log(magic.toString('ascii'), magic.length,OPTS_MAGIC.toString('ascii'))
        deepEqual(magic, OPTS_MAGIC)
        const option = await this.#readInt32(client)
        const length = await this.#readInt32(client)
        console.log({option,length})
        const data = length > 0 ? await this.#read(client, length) : undefined
        switch(option){
            case NBD_OPT_EXPORT_NAME:
                console.log('export name')
                await this.#handleExportNameOption(client)
                return false
            /*
            case NBD_OPT_STARTTLS:
                console.log('starttls')
                // @todo not working
                return true 
            */

                case NBD_OPT_GO:
                case NBD_OPT_INFO: 
                    {
                    const exportNameLength = data.readInt32BE()
                    const exportName = data.slice(4,exportNameLength+4).toString()
                    const nInfoRequests = data.readInt16BE(exportNameLength+4)
                    console.log({exportName, nInfoRequests})
                    console.log('NBD_OPT_GO', option, length, data?.toString())
                    let exportSize
                    if(exportName === 'read'){
                        client.fd = await fs.open('/home/florent/Téléchargements/Xenosorus_etido(1).vhd')
                        
                        exportSize = (await  client.fd.stat({bigint: true})).size
                    }
                    if(exportName === 'write'){
                        client.fd = await fs.open('/tmp/outnbd', 'w')
                        exportSize = BigInt(2* 1024*1024*1024*1024)

                    }
                    // @todo check if this export name is available and authorized
                    
                    if(option === NBD_OPT_INFO) {
                        console.log(' CLOSE')
                        await client.fd.close()
                    }
                    await this.#writeInt64(client,NBD_OPT_REPLY_MAGIC)
                    await this.#writeInt32(client,option )
                    await this.#writeInt32(client, NBD_REP_INFO)
                    await this.#writeInt32(client,12)  
                    // the export info 
                    await this.#writeInt16(client, NBD_INFO_EXPORT)
                    await this.#writeInt64(client,exportSize)
                    await this.#writeInt16(client,NBD_FLAG_HAS_FLAGS/* transmission flag */)
 
                    // an ACK at the end of the infos  
                    await this.#writeInt64(client,NBD_OPT_REPLY_MAGIC)
                    await this.#writeInt32(client,option )
                    await this.#writeInt32(client,NBD_REPLY_ACK )
                    await this.#writeInt32(client,0 ) // no additionnal data 
                    return option === NBD_OPT_INFO // we stays in option phase is option is INFO
                    
            }
            default: 
                // not supported
                console.log('not supported', option, length, data?.toString())
                await this.#writeInt64(client,NBD_OPT_REPLY_MAGIC)
                await this.#writeInt32(client,option)
                await this.#writeInt32(client,NBD_REP_ERR_UNSUP )
                await this.#writeInt32(client,0 ) // no additionnal data 
                // wait for next option
                return true
        }
    }

    async #readCommand(client){
        const buffer = await this.#read(client, 28)
        const magic = buffer.readInt32BE(0)
        strictEqual(magic,NBD_REQUEST_MAGIC)
        /* const commandFlags = */ buffer.readInt16BE(4)
        const command = buffer.readInt16BE(6)
        const cookie = buffer.readBigUInt64BE(8)
        const offset = buffer.readBigUInt64BE(16)
        const length = buffer.readInt32BE(24)
        switch(command){
            case NBD_CMD_DISC:
                console.log('gotdisconnect',size)
                await client.fd.close()
                // @todo : disconnect
                return false
            case NBD_CMD_READ:{
                /** simple replies  */
                // read length byte from offset in export
                const reply = Buffer.alloc(16+length)
                reply.writeInt32BE(NBD_SIMPLE_REPLY_MAGIC)
                reply.writeInt32BE(0,4)// no error
                reply.writeBigInt64BE(cookie,8)

                // read length byte from offset in export directly in the given buffer
                // may do multiple read in parallel on the same export
                size += length
                client.fd.read(reply, 16, length, Number(offset))
                    .then(()=>{
                        return this.#write(client, reply)
                    })
                    .catch(err => console.error('NBD_CMD_READ',err))
                return true
            }
            case NBD_CMD_WRITE: {
                const data = await this.#read(client, length)
                size += length
                // ensure only one write per export at a time
                // may be slower, but less data loss risk 
                client.fd.write(data, 0, length, Number(offset))
                const reply = Buffer.alloc(16)
                reply.writeInt32BE(NBD_SIMPLE_REPLY_MAGIC)
                reply.writeInt32BE(0,4)// no error
                reply.writeBigInt64BE(cookie,8)
                await this.#write(client, reply)
                return true

            }
            default:
                console.log('GOT unsupported command ', command)
                // fail to handle
                return true
        }
        
    }

    async #handleNewConnection(client){
        const remoteAddress = client.remoteAddress + ':' + client.remotePort;  
        console.log('new client connection from %s', remoteAddress);

        client.on('close', ()=>{
            console.log('client ', remoteAddress, 'is done')
        })
        client.on('error', error=>{
            throw error
        })
        // handshake
        await this.#write(client, INIT_PASSWD)
        await this.#write(client, OPTS_MAGIC)

        // send flags , the bare minimum
        await this.#writeInt16( client, NBD_FLAG_FIXED_NEWSTYLE)
        const clientFlag = await this.#readInt32(client)
        assert.strictEqual(clientFlag & NBD_FLAG_FIXED_NEWSTYLE, NBD_FLAG_FIXED_NEWSTYLE) // only FIXED_NEWSTYLE one is supported from the server options


        // read client response flags
        let waitingForOptions = true
        while(waitingForOptions){
            waitingForOptions = await this.#readOption(client)
        }

        let waitingForCommand = true
        while(waitingForCommand){
            waitingForCommand = await this.#readCommand(client)
        }
 

 

    }

    #handleClientData(client, data){

    }
}