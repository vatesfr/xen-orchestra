import fs from 'fs/promises'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createHash } from "crypto";
import {
    CompleteMultipartUploadCommand,
    CreateMultipartUploadCommand,
    GetObjectLockConfigurationCommand,
    PutObjectCommand,
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

    async function read(inputStream, maxReadSize){
        if(maxReadSize === 0){
            return null
        }
        process.stdout.write('+')
        const chunk = await readChunk(inputStream, maxReadSize)
        process.stdout.write('@')
        return chunk
    }

    async function write(data, chunkStream, remainingBytes){
        const ready = chunkStream.write(data)
        if(!ready){
            process.stdout.write('.')
            await pFromCallback(cb=> chunkStream.once('drain', cb))
            process.stdout.write('@')
        }
        remainingBytes -= data.length
        process.stdout.write(remainingBytes+' ')
        return remainingBytes
    }

    
    async function uploadChunk(inputStream){
        const PartNumber = parts.length +1
        let done = false
        let remainingBytes = CHUNK_SIZE
        const maxChunkPartSize = Math.round(CHUNK_SIZE / 1000)
        const chunkStream = new PassThrough()
        console.log({maxChunkPartSize,CHUNK_SIZE})
        


        let data
        let chunkBuffer = []
        const hash = createHash('md5');
        try{
            while((data = await read(inputStream, Math.min(remainingBytes, maxChunkPartSize))) !== null){
                chunkBuffer.push(data)
                hash.update(data)
                remainingBytes -= data.length
                //remainingBytes  = await write(data, chunkStream, remainingBytes)
            }
            console.log('data put')
            const fullBuffer = Buffer.alloc(maxChunkPartSize,0)
            done = remainingBytes > 0
            // add padding at the end of the file (not a problem for tar like : xva/ova)
            // if not content length will not match and we'll have UND_ERR_REQ_CONTENT_LENGTH_MISMATCH error
            console.log('full padding')
            while(remainingBytes > maxChunkPartSize){
                chunkBuffer.push(fullBuffer)
                hash.update(fullBuffer)
                remainingBytes -= maxChunkPartSize
                //remainingBytes  = await write(fullBuffer,chunkStream, remainingBytes)
            }
            console.log('full padding done ')
            chunkBuffer.push(Buffer.alloc(remainingBytes,0))
            hash.update(Buffer.alloc(remainingBytes,0))
            console.log('md5 ok ')
            //await write(Buffer.alloc(remainingBytes,0),chunkStream, remainingBytes)
            // wait for the end of the upload

            const command = new UploadPartCommand({
                ...multipart,
                PartNumber,
                ContentLength:CHUNK_SIZE,
                Body: chunkStream,
                ContentMD5 : hash.digest('base64')
            })
            const promise = client.send(command)
            for (const buffer of chunkBuffer){
                await write(buffer, chunkStream, remainingBytes)
            }
            chunkStream.on('error', err => console.error(err))
            const res = await  promise

            console.log({res, headers : res.headers })
            parts.push({ ETag:/*res.headers.get('etag')  */res.ETag, PartNumber })
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

async function simplePut(url , inputStream){
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

    //const hasObjectLock = await client.send(new GetObjectLockConfigurationCommand({Bucket: bucket}))
    //console.log(hasObjectLock.ObjectLockConfiguration?.ObjectLockEnabled === 'Enabled')


    const md5 = await createMD5('/tmp/1g')
    console.log({md5})
    const command = new PutObjectCommand({
        Bucket: bucket, Key: join(dir, 'simple'),
        ContentMD5: md5,
        ContentLength: 1024*1024*1024,
        Body: inputStream
    })
    const intervalMonitorMemoryUsage = setInterval(()=>console.log(Math.round(process.memoryUsage().rss/1024/1024)), 2000)

    const res = await client.send(command)
    /*
    const presignedUrl = await getSignedUrl(client,  command,{ expiresIn: 3600 });
    const res = await fetch(presignedUrl, {
        method: 'PUT',
        body:inputStream,
        duplex: "half",
        headers:{
            "x-amz-decoded-content-length": 1024*1024*1024,
            "content-md5" : md5
        } 
    })*/
    clearInterval(intervalMonitorMemoryUsage)

    console.log(res)
}

async function createMD5(filePath) {
    const input = await fs.open(filePath) // big ass file 
    return new Promise((res, rej) => {
      const hash = createHash('md5');
      
      const rStream = input.createReadStream(filePath);
      rStream.on('data', (data) => {
        hash.update(data);
      });
      rStream.on('end', () => {
        res(hash.digest('base64'));
      });
    })
  }
const input = await fs.open('/tmp/1g') // big ass file 
const inputStream = input.createReadStream()
const remoteUrl = ""

v2(remoteUrl,inputStream)

//simplePut(remoteUrl,inputStream)