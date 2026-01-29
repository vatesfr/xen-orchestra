// @ts-check
import { getSyncedHandler } from '@xen-orchestra/fs'
import * as path from 'node:path'
import { resolve } from 'node:path'
import { isValidXva } from '../_isValidXva.mjs'


class VmBackupArchive {
    handler
    metadata = new Map()
    vdis = new Map()
    diskLineages = new Map()
    vdiChains = new Map()
    disks = {
        'files': [],
        'metadata': [],
        'full': new Map(),
        'delta': new Map(),
        'unlinked': new Set()
    }

    /**
     * @param {any} handler
     * @param {string} vmUuid
     * @param {string} backupJobUuid
     */
    constructor(handler, vmUuid, backupJobUuid) {
        this.handler = handler
        this.vmUuid = vmUuid
        this.backupJobUuid = backupJobUuid
    }

    async init() {
        const vmBackupPath = `xo-vm-backups/${this.vmUuid}`
        this.disks.files = await this.handler.list(vmBackupPath, { prependDir: true })
        console.log(this.disks.files)
        this.disks.metadata = this.disks.files.filter(entry => entry.endsWith('.json'))
        for (const entry of this.disks.metadata) {
            const metadata = JSON.parse(await this.handler.readFile(entry))
            const entryBase = path.parse(entry).base
            if (metadata.mode === 'full') {
                this.disks.full.set(entryBase, resolve('/', vmBackupPath, metadata.xva))
            } else {
                const vhds = metadata.vhds
                this.disks.delta.set(entryBase, Object.keys(vhds).map(key => resolve('/', vmBackupPath, vhds[key])))
            }
        }
        this.check()
    }

    /**
     * Check links between json and disks
     */
    async check() {
        const allXvas = new Set(this.disks.files.filter(entry => entry.endsWith('.xva')))
        this.disks.unlinked = allXvas
        for (const [jsonPath, xvaPath] of this.disks.full.entries()) {
            // keep only unlinked xva to delete them
            if(allXvas.has(xvaPath)) {
                this.disks.unlinked.delete(xvaPath)
            // add json if xva missing
            } else {
                this.disks.unlinked.add(jsonPath)
                console.warn('the XVA linked to the backup is missing', { backup: jsonPath, xva: xvaPath })
            }
        }
        for(const [metadata, diskPath] of this.disks.full) {
            try {
                if(!(await this.isValidDisk(diskPath))) {
                    console.warn('XVA might be broken', { path: diskPath, backup: metadata })
                }
                
            } catch (error) {
                console.warn(error, { path: diskPath, backup: metadata })
            }
        }
    }

    async clean() {

        // clean XVAs
        for(const filePath of this.disks.unlinked) {
            this.handler.unlink(filePath)
        }
    }

    /**
     * @param {string} path disk path to check
     */
    async isValidDisk(path) {
        if(path.endsWith('.xva')) {
            return isValidXva(path)
        } else {
            throw new Error('Disk format not supported')
        }
    }
}
const url = "nfs://172.16.211.212:/mnt/data"
// const url = "s3+http://K2UI6IVTXNJAHIZQCUAG:WarCEOguZMA9XRDX6H5srI3zyHdEg4yr5CXpkSYc@10.10.0.102/vateslab?useVhdDirectory=true"
// const url = 'file://tmp/xo-fs-mounts/45ln9qqwkh3'
// const url = "s3+http://test:test@localhost:4566/xo-backups?useVhdDirectory=true"
const handler = await getSyncedHandler({ url })
// console.log(await handler.value.list("xo-vm-backups/"))
// console.log(await handler.value.tree("xo-vm-backups/"))
// console.log(await handler.value.list("xo-vm-backups/99408233-6887-bb96-6c12-865f7b848798/vdis/43cda9b1-2185-48b6-9704-6665b18e6a66/2252b990-2ff5-45ec-b14a-b10ea3cd17a0"))
// console.log(await handler.value.list("xo-vm-backups/93b88999-8b61-7207-138b-1ef389491e71/vhds/93b88999-8b61-7207-138b-1ef389491e71"))
// const backupArchive = new VmBackupArchive(handler.value, "99408233-6887-bb96-6c12-865f7b848798", "")
const backupArchive = new VmBackupArchive(handler.value, "7b894929-273e-15f4-b7df-88a497d90c14", "")

await backupArchive.init()
// console.log(backupArchive.vdiChains)
// for(const [entry, diskLineage] of backupArchive.vdiChains) {
//     console.log()
//     console.log(entry, ": ", diskLineage.disks)
// }
