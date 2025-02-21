
import { getHandler } from '@xen-orchestra/fs'
import {  fromCallback } from 'promise-toolbox'


import Fuse from 'fuse-native'
import LRU from 'lru-cache'
import { v4 as uuidv4 } from 'uuid'

import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { VhdFile, VhdSynthetic } from 'vhd-lib'
import { Xapi } from '@xen-orchestra/xapi'

    // make an overlayfs with 
    //  lowerDir localPath/xo-instant-start/vhds (will contains the links to vhds)
    //  workDir  localPath/xo-instant-start/workDir
    //  upperDir localPath/xo-instant-start/upper
    // purge any data of workdDir, upper
    // mount to localPath/xo-instant-start/merged
    // shareable path is localPath/xo-instant-start/merged


// build a s stat object from https://github.com/fuse-friends/fuse-native/blob/master/test/fixtures/stat.js
const stat = st => ({
    mtime: st.mtime || new Date(),
    atime: st.atime || new Date(),
    ctime: st.ctime || new Date(),
    size: st.size !== undefined ? st.size : 0,
    mode: st.mode === 'dir' ? 16877 : st.mode === 'file' ? 33188 : st.mode === 'link' ? 41453 : st.mode,
    uid: st.uid !== undefined ? st.uid : process.getuid(),
    gid: st.gid !== undefined ? st.gid : process.getgid(),
  })
  

class FuseBackupRepositories{
    #xoAddress 
    #localPath
    #xapi
    #fuse
    #srRef
    #pool

    #mounted = new Map()//localDiskPath=> {uuid,vhd, mountedAt}


    constructor(localPath, xoaddress, xapi){
        this.#localPath = path.resolve(path.join(localPath, 'xo-instant-start') )
        this.#xoAddress = xoaddress
        this.#xapi = xapi
        let pool 
        Object.values(xapi.objects.all).forEach(object => {
            if (object.$type === 'pool') {
                pool = object
            }
          })
        this.#pool = pool
    }
     
    async #listNfsExports(){
        return new Promise((resolve, reject)=>{
            exec('showmount -e --no-headers', (error, stdout, stderr) => {
                if (error) {
                  reject(new Error(stderr))
                  return;
                }
                resolve(stdout.split("\n")
                    .filter(_=> _ !== '')
                    .map(_=>_.split(" ")))
              });
        })
    }
    async #isAlreadyInNfsExports(basePath){
        const exports = await this.#listNfsExports()
        return exports.findIndex(entry=>entry[0] === basePath) >= 0 
    }

    #addToNfsExports(basePath){
        return new Promise((resolve, reject)=>{
            // @todo : use the host ip instead of the star
            // @todo : add the mandatory options to improve reliability
            exec(`exportfs 192.168.1.45:${basePath} -o rw,sync,no_root_squash,no_subtree_check`, (error, stdout, stderr) => {
                if (error) {
                  reject(new Error(stderr))
                  return;
                }
                resolve(stdout.split("\n").filter(_=> _ !== ''))
              });
        })
    }

    #createOverlay({vhdsPath, workPath, writePath, sharePath }){
        return new Promise((resolve, reject)=>{
            // @todo : use the host ip instead of the star
            
            // options from https://serverfault.com/questions/949892/nfs-export-an-overlay-of-ext4-and-btrfs
            exec(`
                mount -t overlay overlay -o nfs_export=on,index=on -o lowerdir=${vhdsPath} -o upperdir=${writePath} -o workdir=${workPath}  ${sharePath}
                
                `, (error, stdout, stderr) => {
                if (error) {
                  reject(new Error(stderr))
                  return;
                }
                resolve(stdout)
              });
        })
    }

    async #createFuseMount(vhdsPath, srPath){
        const self = this
        this.#fuse = new Fuse(vhdsPath, {
            async readdir(path, cb) {
              console.log('will list', path, self.#mounted.keys())
              if (path === '/') {
                return cb(null, [srPath])
              }
              if(path === '/'+srPath){
                return cb(null, [...self.#mounted.keys()].map(_=>_.substr(1)))
              }
              cb(Fuse.ENOENT)
            },
            async getattr(p, cb) {
              console.log('will getattr', p, [...self.#mounted.keys()])
              
              if (p === '/') {
                console.log('got /')
                return cb(
                  null,
                  stat({
                    mode: 'dir',
                    size: 4096,
                  })
                )
              }
              if (p === '/'+srPath) {
                console.log('got srPath')
                return cb(
                  null,
                  stat({
                    mode: 'dir',
                    size: 4096,
                  })
                )
              }
              console.log('path.dirname',path.dirname(p), path.basename(p))
              if(p.startsWith('/'+srPath)){
                console.log('inside sr', {p,srPath})
                let filePath = p.substr(('/'+srPath).length)
                if(self.#mounted.has(filePath)){
                    console.log('got a file')
                    const size = self.#mounted.get(filePath).size
                    return cb(
                        null,
                        stat({
                          mode: 'file',
                          size,
                        })
                      )
                }
              }
   
              cb(Fuse.ENOENT)
            },
            async read(p, fd, buf, len, pos, cb) {
                console.log(' will read')
                if(p.startsWith('/'+srPath)){
                  console.log('inside sr', {p,srPath})
                  let filePath = p.substr(('/'+srPath).length)
                  if(self.#mounted.has(filePath)){
                    console.log('read inside a file',{len, pos})
                    const remoteDiskPath = self.#mounted.get(filePath).remoteDiskPath
                    const fd = await fs.open('/mnt/ssd/vhdfile/'+remoteDiskPath, 'r')
                    const { bytesRead } = await fd.read(buf,0,len,pos)
                    console.log(' GOT ', bytesRead)
                    await fd.close()
                    cb(bytesRead) //buffer is ready
                    // @todo iplement open close instead of reopening each time 
                    // @todo implement readRVhdData , especially for VhdDirectory/VhdSynthetic
                  
                }
                }
              if(self.#mounted.has('/'+path)){
                  const size = self.#mounted.get(path).size
                  // for vhdfile it is a simple fs.read 
                 
              }
              cb(Fuse.ENOENT)
            },
          })
        await fromCallback(cb => this.#fuse.mount(cb))
    }

    async initialize(){ 

        try{
            await fs.rm(this.#localPath,  { recursive: true, force: true })
        }catch(err){
            if(err.code !== 'ENOENT' && err.code !=='ENOTDIR'){
                throw err
            }
        }
        await fs.mkdir(this.#localPath)
        const vhdsPath = path.join(this.#localPath, 'vhds')
        await fs.mkdir(vhdsPath)
        const workPath = path.join(this.#localPath, 'work')
        await fs.mkdir(workPath)
        const writePath = path.join(this.#localPath, 'write')
        await fs.mkdir(writePath)
        const sharePath = path.join(this.#localPath, 'share')
        await fs.mkdir(sharePath) 
 
        

        // add share as a NFS export 
 
        await this.#addToNfsExports(sharePath) 


        // attach SR to host 

        const hostRef = this.#xapi.getObject(this.#pool.master).$ref
        const deviceConfig = {
            server: this.#xoAddress, // ip of XO
            serverpath: sharePath,
        }

        this.#srRef = await xapi.SR_create({
            device_config: deviceConfig,
            host: hostRef,
            name_description: 'instant start',
            name_label: 'xo-instant-start',
            shared: true,
            type: 'nfs'
          })
    

        
        const sr = await xapi.call('SR.get_record', this.#srRef)

        // create vhds virtual layer in the sr.uuid sub folder
        // created by xapi 
        await this.#createFuseMount(vhdsPath, sr.uuid)

        // create overlay fs 
        await this.#createOverlay({vhdsPath,workPath,writePath,sharePath}) 



        // @todo add a watcher on sharePath 
        //  => if one of the mountedVhd path is removed
        //      => dismount it 
    }

    async cleanup(){
        // purge 
        //  localPath/xo-instant-start/*
        // unmount all the vhds
        // remove share from host SR
        // remove share 
    }

    async mount(handler,remoteDiskPath){ 

        // we can't reuse the fuse-vhd logic directly since we want to mount an arbitrary
        // number of vhds 
        
        const diskUuid = uuidv4()
        console.log({diskUuid})
        const path = `/${diskUuid}.vhd`
        const disposableVhd = await VhdFile.open(handler, remoteDiskPath)
        console.log({disposableVhd})
        const vhd = disposableVhd.value


        await vhd.readBlockAllocationTable() 
        // to do : use stream size for vhd directory.synthetic
        const size = await handler.getSize(remoteDiskPath)
        this.#mounted.set(path, {disposableVhd, mountedAt : new Date() , diskUuid,size, remoteDiskPath})
         // not sure why do the disk only reappear after I forget and reattach the SR 

        // scan the SR to add this disk
    
        const xapi = this.#xapi
        let vdiRef/*
        for(let i=0; i < 10 && vdiRef === undefined; i ++){
            console.log('waiting')
            try{
                vdiRef = await xapi.getRecordByUuid('VDI', diskUuid) 
                break
            }catch(err){}
            await new Promise(resolve=>setTimeout(resolve, 5000))
        } 
        console.log({vdiRef})
        // take a snapshot of this disk to ensure xcp don't try to write inside
       // await xapi.callAsync('VDI.snapshot', vdiRef)
         */
        return diskUuid
    }

 
}

const xapi  = new Xapi({
    allowUnauthorized: true,
    url: 'http://192.168.1.45',
    auth: {
      user: 'root',
      password: '',
    },
  })

await xapi.connect()
console.log ('connected')
await xapi.objectsFetched 
  
const fbr = new FuseBackupRepositories('./mount', '192.168.1.180', xapi)
await fbr.initialize()
const handler = getHandler({url:'file:///mnt/ssd/vhdfile/'})
await handler.sync()
console.log(handler)
await fbr.mount(handler, 
    'xo-vm-backups/93454bd8-d763-96f7-d230-50b6545122be/vdis/d8ddef60-d9a4-4cec-9546-522e9c75e356/3b60f2e8-c07a-4fd3-826f-1310368cd664/20241021T145449Z.vhd'
)