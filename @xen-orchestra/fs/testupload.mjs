import fs from 'fs/promises'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    S3Client,
    UploadPartCommand,
  } from '@aws-sdk/client-s3'

  import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { Agent as HttpAgent } from 'http'
import { Agent as HttpsAgent } from 'https'
import { parse } from 'xo-remote-parser'
import { join, split } from './dist/path.js'

import guessAwsRegion from './dist/_guessAwsRegion.js'
import { PassThrough } from 'stream'
import { readChunk } from '@vates/read-chunk'
import { pFromCallback } from 'promise-toolbox'

async function v2(url, inputStream){
    const {
        allowUnauthorized,
        host,
        path,
        username,
        password,
        protocol,
        region = guessAwsRegion(host),
      } = parse(url)
    const client = new S3Client({
        apiVersion: '2006-03-01',
        endpoint: `${protocol}://s3.us-east-2.amazonaws.com`,
        forcePathStyle: true,
        credentials: {
          accessKeyId: username,
          secretAccessKey: password,
        },
        region,
        requestHandler: new NodeHttpHandler({
          socketTimeout: 600000,
          httpAgent: new HttpAgent({
            keepAlive: true,
          }),
          httpsAgent: new HttpsAgent({
            rejectUnauthorized: !allowUnauthorized,
            keepAlive: true,
          }),
        }),
      })
      
    const pathParts = split(path)
    const bucket = pathParts.shift()
    const dir = join(...pathParts)

    const command = new CreateMultipartUploadCommand({
        Bucket: bucket, Key: join(dir, 'flov2')
    })
    const multipart = await client.send(command)
    console.log({multipart})

    const parts = []
    // monitor memory usage
    const intervalMonitorMemoryUsage = setInterval(()=>console.log(Math.round(process.memoryUsage().rss/1024/1024)), 2000)

    const CHUNK_SIZE = Math.ceil(5*1024*1024*1024*1024/10000) // smallest chunk allowing 5TB upload

    function read(inputStream, maxReadSize){
        if(maxReadSize === 0){
            return null
        }
        return readChunk(inputStream, maxReadSize)
    }

    async function write(data, chunkStream, remainingBytes){
        const ready = chunkStream.write(data)
        if(!ready){
            await pFromCallback(cb=> chunkStream.once('drain', cb))
        }
        remainingBytes -= data.length
        process.stdout.write('.')
        return remainingBytes
    }

    
    async function uploadChunk(inputStream){
        const PartNumber = parts.length +1
        let done = false
        let remainingBytes = CHUNK_SIZE
        const maxChunkPartSize = Math.round(CHUNK_SIZE / 100)
        const chunkStream = new PassThrough()
        console.log({maxChunkPartSize,CHUNK_SIZE})
        const command = new UploadPartCommand({
            ...multipart,
            PartNumber,
        })
        const presignedUrl = await getSignedUrl(client, command,{ expiresIn: 3600 });

        const promise =  fetch(presignedUrl, {
            method: 'PUT',
            body:chunkStream,
            duplex: "half",
            headers:{
                "content-length": CHUNK_SIZE
            } 
        })


        let data
        try{
            while((data = await read(inputStream, Math.min(remainingBytes, maxChunkPartSize))) !== null){
                remainingBytes  = await write(data, chunkStream, remainingBytes)
            }
            const fullBuffer = Buffer.alloc(maxChunkPartSize,0)
            done = remainingBytes > 0
            // add padding at the end of the file (not a problem for tar like : xva/ova)
            while(remainingBytes > maxChunkPartSize){
                remainingBytes  = await write(fullBuffer,chunkStream, remainingBytes)
            }
            await write(Buffer.alloc(remainingBytes,0))
            // wait for the end of the upload
            const res = await promise

            parts.push({ ETag: res.headers.get('etag'), PartNumber })
        }catch(err){
            console.error(err)
            throw err
        }
        return done
    }

    while(!await uploadChunk(inputStream)){
        console.log('uploaded one chunk', parts.length)
    }

    // mark the upload as complete and ask s3 to glue the chunk together
    const completRes = await client.send(
        new CompleteMultipartUploadCommand({
          ...multipart,
          MultipartUpload: { Parts: parts },
        })
      )
      console.log({completRes})
    clearInterval(intervalMonitorMemoryUsage)

}

const input = await fs.open('/tmp/60G') // big ass file 
const inputStream = input.createReadStream()
const remoteUrl = ""

v2(remoteUrl,inputStream)