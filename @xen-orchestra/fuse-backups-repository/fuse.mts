import Fuse from 'fuse-native';
import * as fs from 'fs';
import * as path from 'path';
import { type  DiskBlock, RandomAccessDisk } from '@xen-orchestra/disk-transform';
import { DiskConsumerVhdDiscrete } from 'vhd-lib/disk-consumer/DiskConsumerRaw.mjs';
import fsP from 'fs/promises'
import { getHandler } from '@xen-orchestra/fs';
import { RemoteVhd } from '../backups/disks/RemoteVhd.mjs';

class FuseVHDPlugin {
    private fuse: Fuse.Fuse;
    private disks: Map<string, DiskConsumerVhdDiscrete>;
    private passthroughDir: string;
    private openHandles: Map<string, number>
    private  nextHandle:number = 1

    constructor(mountPoint: string,  passthroughDir: string) {
        this.passthroughDir = passthroughDir;
        this.disks = new Map<string, DiskConsumerVhdDiscrete>();
        this.openHandles = new Map<string, number>();

        // Initialize FUSE operations
        const ops: Fuse.Operations = {
            // File system operations
            getattr: this.getattr.bind(this),
            readdir: this.readdir.bind(this),
            access: this.access.bind(this),
            
            // File operations
            open: this.open.bind(this),
            release: this.release.bind(this),
            read: this.read.bind(this),
            unlink: this.unlink.bind(this),
            truncate: this.truncate.bind(this),
            ftruncate: this.ftruncate.bind(this),
            statfs: this.statfs.bind(this),
            
            // Fallback for unimplemented operations
            create: this.passthroughCreate.bind(this),
            write: this.passthroughWrite.bind(this),
            mkdir: this.passthroughMkdir.bind(this),
            rmdir: this.passthroughRmdir.bind(this),
            rename: this.passthroughRename.bind(this),
            chmod: this.passthroughChmod.bind(this),
            chown: this.passthroughChown.bind(this),
            utimens: this.passthroughUtimens.bind(this),
        };
        this.fuse = new Fuse(mountPoint, ops, {
            force: true,
            mkdir: true,
            debug: process.env.DEBUG === 'true'
        });
    }

    // Add a virtual VHD file to the filesystem
    public addDisk(pathInMount: string, disk:DiskConsumerVhdDiscrete): void {
        // @todo open the disk chain and init it
        this.disks.set(pathInMount, disk);
    }

    // Remove a virtual VHD file from the filesystem
    public async removeDisk(pathInMount: string): Promise<void> {
        const disk = this.getDisk(pathInMount)
        await disk.close()
        this.disks.delete(pathInMount);
    }

    // Mount the filesystem
    public mount(): Promise<void> {
        console.log('will mount')
        return new Promise((resolve, reject) => {
            this.fuse.mount(err => {
                console.log('mounted', err)
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Unmount the filesystem
    public unmount(): Promise<void> {
        // @todo dispose of all disks 
        return new Promise((resolve, reject) => {
            this.fuse.unmount(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    // Check if a path is a virtual VHD file
    private isDiskFile(filePath: string): boolean {        
        //console.log('isDiskFile', [...arguments])
        return this.disks.has(filePath);
    }
    // Check if a path is a virtual VHD file
    private getDisk(filePath: string): DiskConsumerVhdDiscrete {  
        //console.log('getDisk', [...arguments])
        const disk = this.disks.get(filePath)
        if(disk === undefined){
            throw new Error(`${filePath} is not mounted`)
        }
        return disk
    }

    // Get file attributes
    private async getattr(filePath: string, cb: (err: number, stat?: Fuse.Stats) => void): Promise<void> {
        //console.log('getattr', [...arguments])
        try {
            if (this.isDiskFile(filePath)) {
                const disk = this.getDisk(filePath)
                const size = disk.fileSize
                //console.log({filePath, size})
                const stats: Fuse.Stats = {
                    mtime: new Date(),
                    atime: new Date(),
                    ctime: new Date(),
                    size: size,
                    mode: 0o100644 | Fuse.S_IFREG, // Regular file with rw-r--r-- permissions
                    uid: process.getuid ? process.getuid() : 0,
                    gid: process.getgid ? process.getgid() : 0
                };
                cb(0, stats);
            } else {
                // Passthrough to underlying filesystem
                fs.stat(path.join(this.passthroughDir, filePath), (err, stats) => {
                    if (err) {
                        cb(Fuse.ENOENT);
                    } else {
                        cb(0, {
                            mtime: stats.mtime,
                            atime: stats.atime,
                            ctime: stats.ctime,
                            size: stats.size,
                            mode: stats.mode,
                            uid: stats.uid,
                            gid: stats.gid
                        });
                    }
                });
            }
        } catch (err) {
            cb(Fuse.ENOENT);
        }
    }

    // Read directory contents
    private readdir(filePath: string, cb: (err: number, contents?: string[]) => void): void {
        //console.log('readdir', [...arguments])
        // Combine virtual VHD files with underlying directory contents
        const combinedContents: string[] = [];
        
        // Add virtual files that are in this directory
        const dirPath = filePath === '/' ? '' : filePath;
        for (const vhdFile of this.disks.keys()) {
            if (path.dirname(vhdFile).startsWith(dirPath)) {
                combinedContents.push(path.basename(vhdFile));
            }
        }
        // Add real files from underlying directory
        fs.readdir(path.join(this.passthroughDir, filePath), (err, files) => {
            if (err && err.code !== 'ENOENT') {
                cb(Fuse.ENOENT);
                return;
            }
            
            if (!err) {
                combinedContents.push(...files);
            }
            cb(0, combinedContents);
        });
    }

    // Check file access permissions
    private access(filePath: string, mode: number, cb: (err: number) => void): void {
        console.log('access', [...arguments])
        if (this.isDiskFile(filePath)) {
            // For virtual files, just check if they exist
            cb(0);
        } else {
            // Passthrough to underlying filesystem
            fs.access(path.join(this.passthroughDir, filePath), mode, (err) => {
                cb(err ? Fuse.EACCES : 0);
            });
        }
    }

    // Open a file
    private async open(filePath: string, flags: number, cb: (err: number, fd?: number) => void): Promise<void> {
        console.log('open', [...arguments])
        try {
            if (this.isDiskFile(filePath)) { // file is alreay open 
                const handle = this.nextHandle ++
                this.openHandles.set(filePath, handle);
                cb(0, handle);
            } else {
                // Passthrough to underlying filesystem
                fs.open(path.join(this.passthroughDir, filePath), flags, (err, fd) => {
                    if (err) {
                        cb(Fuse.ENOENT);
                    } else {
                        cb(0, fd);
                    }
                });
            }
        } catch (err) {
            cb(Fuse.ENOENT);
        }
    }

    // Close a file
    private async release(filePath: string, fd: number, cb: (err: number) => void): Promise<void> {
        console.log('release', [...arguments])
        try {
            if (this.isDiskFile(filePath)) {
                this.openHandles.delete(filePath);
                cb(0);
            } else {
                // Passthrough to underlying filesystem
                fs.close(fd, (err) => {
                    cb(err ? Fuse.EIO : 0);
                });
            }
        } catch (err) {
            cb(Fuse.EIO);
        }
    }

    // Read from a file
    private async read(filePath: string, fd: number, buf: Buffer, len: number, pos: number, cb: (err: number, bytesRead?: number) => void): Promise<void> {
        try {
            if (this.isDiskFile(filePath)) {
                const bytesRead = await this.getDisk(filePath).read(pos, buf);
                cb(bytesRead);
            } else {
                // Passthrough to underlying filesystem
                fs.read(fd, buf, 0, len, pos, (err, bytesRead) => {
                    cb(err ? Fuse.EIO : 0, bytesRead);
                });
            }
        } catch (err) {
            console.error(err)
            cb(Fuse.EIO);
        }
    }

    // Delete a file
    private async unlink(filePath: string, cb: (err: number) => void): Promise<void> {
        console.log('unlink', [...arguments])
        try {
            if (this.isDiskFile(filePath)) {
                this.disks.delete(filePath);
                cb(0);
            } else {
                // Passthrough to underlying filesystem
                fs.unlink(path.join(this.passthroughDir, filePath), (err) => {
                    cb(err ? Fuse.ENOENT : 0);
                });
            }
        } catch (err) {
            cb(Fuse.ENOENT);
        }
    }

    // Truncate a file
    private truncate(filePath: string, size: number, cb: (err: number) => void): void {
        console.log('truncate', [...arguments])
        if (this.isDiskFile(filePath)) {
            // Virtual VHD files can't be truncated
            cb(Fuse.EPERM);
        } else {
            // Passthrough to underlying filesystem
            fs.truncate(path.join(this.passthroughDir, filePath), size, (err) => {
                cb(err ? Fuse.ENOENT : 0);
            });
        }
    }

    // Truncate an open file
    private ftruncate(filePath: string, fd: number, size: number, cb: (err: number) => void): void {
        console.log('fttruncate', [...arguments])
        if (this.isDiskFile(filePath)) {
            // Virtual VHD files can't be truncated
            cb(Fuse.EPERM);
        } else {
            // Passthrough to underlying filesystem
            fs.ftruncate(fd, size, (err) => {
                cb(err ? Fuse.ENOENT : 0);
            });
        }
    }

    // Get filesystem statistics
    private statfs(filePath: string, cb: (err: number, stat?: Fuse.StatVfs) => void): void {
        console.log('statfss', [...arguments])
        // Passthrough to underlying filesystem
        fs.statfs(path.join(this.passthroughDir, filePath), (err, stats) => {
            if (err) {
                cb(Fuse.ENOENT);
            } else {
                cb(0, {
                    bsize: stats.bsize,
                  //  frsize: stats.frsize,
                    blocks: stats.blocks,
                    bfree: stats.bfree,
                    bavail: stats.bavail,
                    files: stats.files,
                    ffree: stats.ffree,
                   // favail: stats.favail,
                   // fsid: stats.fsid,
                   // flag: stats.flags,
                   // namemax: stats.namemax
                });
            }
        });
    }

    // Passthrough implementations for other operations
    private passthroughCreate(filePath: string, mode: number, cb: (err: number, fd?: number) => void): void {
        fs.open(path.join(this.passthroughDir, filePath), mode | Fuse.O_CREAT, (err, fd) => {
            cb(err ? Fuse.EACCES : 0, fd);
        });
    }

    private passthroughWrite(filePath: string, fd: number, buf: Buffer, len: number, pos: number, cb: (err: number, written?: number) => void): void {
        fs.write(fd, buf, 0, len, pos, (err, written) => {
            cb(err ? Fuse.EIO : 0, written);
        });
    }

    private passthroughMkdir(filePath: string, mode: number, cb: (err: number) => void): void {
        fs.mkdir(path.join(this.passthroughDir, filePath), mode, (err) => {
            cb(err ? Fuse.EACCES : 0);
        });
    }

    private passthroughRmdir(filePath: string, cb: (err: number) => void): void {
        fs.rmdir(path.join(this.passthroughDir, filePath), (err) => {
            cb(err ? Fuse.ENOENT : 0);
        });
    }

    private passthroughRename(srcPath: string, destPath: string, cb: (err: number) => void): void {
        fs.rename(
            path.join(this.passthroughDir, srcPath),
            path.join(this.passthroughDir, destPath),
            (err) => {
                cb(err ? Fuse.ENOENT : 0);
            }
        );
    }

    private passthroughChmod(filePath: string, mode: number, cb: (err: number) => void): void {
        fs.chmod(path.join(this.passthroughDir, filePath), mode, (err) => {
            cb(err ? Fuse.ENOENT : 0);
        });
    }

    private passthroughChown(filePath: string, uid: number, gid: number, cb: (err: number) => void): void {
        fs.chown(path.join(this.passthroughDir, filePath), uid, gid, (err) => {
            cb(err ? Fuse.ENOENT : 0);
        });
    }

    private passthroughUtimens(filePath: string, atime: Date | number, mtime: Date | number, cb: (err: number) => void): void {
        fs.utimes(path.join(this.passthroughDir, filePath), atime, mtime, (err) => {
            cb(err ? Fuse.ENOENT : 0);
        });
    }
}

/*
class FakeDisk extends RandomAccessDisk{
    nbBlocks = 3
    blockSize = 2*1024*1024
    index = [1,2,4]
    virtualSize = 100*1024*1024
    async readBlock(index: number): Promise<DiskBlock> {
        return {
            index,
            data:Buffer.alloc(this.blockSize, 101)
        }
    }
    getVirtualSize(): number {
        return this.virtualSize
    }
    getBlockSize(): number {
        return this.blockSize
    }
    async init(): Promise<void> { 
        console.log('init')
    }
    async close(): Promise<void> { 
        console.log('closed')
    }
    isDifferencing(): boolean {
        return false
    }
    getBlockIndexes(): Array<number> {
        return this.index
    }
    hasBlock(index: number): boolean {
        return this.index.includes(index)
    }

}*/

const test = new  FuseVHDPlugin('./mount', '/tmp')

test.mount().catch(console.error)

/*
test.addDisk('/vhd0', new DiskConsumerVhdDiscrete(new FakeDisk()))
await new Promise(resolve =>setTimeout(resolve,2000))
const fd = await fsP.open('./mount/vhd0', 'r')
const source = fd.createReadStream()
let length = 0
for await (const data of source){
    length += data.length
}
console.log({length})
export default FuseVHDPlugin;*/

const handler = getHandler({url:'file:///mnt/ssd/vhdblock'})
await handler.sync()

const disk = new RemoteVhd({handler , path: 'xo-vm-backups/d1aa0fbb-8de7-f3a5-5edd-c62faa2ec8fa/vdis/c6f5fd08-69b6-4514-a461-9a9a77fc3327/db01a21c-b1d4-4317-9694-a45da55ff89a/data/5825dd96-4414-4efa-992a-c6d96ea40958.vhd'})

await disk.init()
console.log(disk, disk.getBlockIndexes())
test.addDisk('/660c15cb-1643-4d32-b034-6e5b346a9c20.vhd', new DiskConsumerVhdDiscrete(disk))