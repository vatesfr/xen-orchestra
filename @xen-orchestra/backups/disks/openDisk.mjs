import { RemoteDisk } from "./RemoteDisk.mjs";


/**
 * open a disk on a remote , wether it's a RemoteVhd or a hashed disk
 * refactor to use this method anywhere we use openVhd at least on @xen-orchestra/backups
 * 
 * @param {*} handler 
 * @param {*} path
 * @returns {Promise<RemoteDisk>} 
 */
export async function openDisk(handler,path){}