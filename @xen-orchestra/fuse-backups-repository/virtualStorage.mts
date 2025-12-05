
import path from 'node:path'
import { exec } from 'node:child_process'

export class VirtualStorage {
    #xoAddress
    #localPath
    #xapi
    #fuse
    #srRef
    #pool

    #mounted = new Map()//localDiskPath=> {uuid,vhd, mountedAt}


    constructor({localPath, xoaddress, xapi, backupRepository}) {
        this.#localPath = path.resolve(path.join(localPath, 'xo-instant-start'))
        this.#xoAddress = xoaddress
        this.#xapi = xapi
        let pool
        Object.values(xapi.objects.all).forEach(object: Object => {
            if (object.$type === 'pool') {
                pool = object
            }
        })
        this.#pool = pool
    }
    async #listNfsExports() {
        return new Promise((resolve, reject) => {
            exec('showmount -e --no-headers', (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr))
                    return;
                }
                resolve(stdout.split("\n")
                    .filter(_ => _ !== '')
                    .map(_ => _.split(" ")))
            });
        })
    }
    async #isAlreadyInNfsExports(basePath) {
        const exports = await this.#listNfsExports()
        return exports.findIndex(entry => entry[0] === basePath) >= 0
    }

    #addToNfsExports(basePath) {
        return new Promise((resolve, reject) => {
            // @todo : use the host ip instead of the star
            // @todo : add the mandatory options to improve reliability
            exec(`exportfs 192.168.1.45:${basePath} -o rw,sync,no_root_squash,no_subtree_check`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr))
                    return;
                }
                resolve(stdout.split("\n").filter(_ => _ !== ''))
            });
        })
    }

    async init(){
        await this.#addToNfsExports(sharePath) 
        // attach SR to host 

        const hostRef = this.#xapi.getObject(this.#pool.master).$ref
        const deviceConfig = {
            server: this.#xoAddress, // ip of XO
            serverpath: sharePath,
        }

        this.#srRef = await this.#xapi.SR_create({
            device_config: deviceConfig,
            host: hostRef,
            name_description: 'instant start',
            name_label: 'xo-instant-start',
            shared: true,
            type: 'nfs'
          })
        
        const sr = await this.#xapi.call('SR.get_record', this.#srRef)
    
    }

}