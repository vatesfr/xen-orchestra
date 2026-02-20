declare module '@xen-orchestra/backups' {
  import type RemoteHandlerAbstract from '@xen-orchestra/fs'

  /**
   * Represents a disk stored on a remote backup location
   */
  export class RemoteDisk {
    /** Path to the disk file on the remote */
    path: string
    
    /** Reference to the remote handler */
    handler: RemoteHandlerAbstract
    
    /** UUID of the disk */
    uuid?: string
    
    /** Size of the disk in bytes */
    size?: number
    
    /** Parent disk path (for delta chains) */
    parent?: string
    
    constructor(handler: RemoteHandlerAbstract, path: string)
    
    /** Initialize the disk metadata */
    init(): Promise<void>
    
    /** Get the disk content as a readable stream */
    getStream(): Promise<NodeJS.ReadableStream>
  }

  /**
   * Represents a local disk (on XenServer/XCP-ng)
   */
  export class LocalDisk {
    path: string
    uuid?: string
    size?: number
    
    constructor(path: string)
  }

  /**
   * Adapter for interacting with remote backup storage
   */
  export class RemoteAdapter {
    handler: RemoteHandlerAbstract
    
    constructor(handler: RemoteHandlerAbstract, options?: RemoteAdapterOptions)
    
    /** List all VM backups on the remote */
    listVmBackups(): Promise<VmBackupMetadata[]>
    
    /** Get metadata for a specific backup */
    getBackupMetadata(path: string): Promise<VmBackupMetadata>
    
    /** Delete old backups based on retention policy */
    cleanVm(vmDir: string, options?: CleanVmOptions): Promise<void>
  }

  export interface RemoteAdapterOptions {
    debounceDelay?: number
    dirMode?: number
  }

  export interface CleanVmOptions {
    remove?: boolean
    merge?: boolean
    logWarn?: (message: string) => void
  }

  export interface VmBackupMetadata {
    mode: 'full' | 'delta'
    timestamp: number
    jobId: string
    scheduleId: string
    vm: {
      name_label: string
      uuid: string
    }
    xva?: string
    vhds?: Record<string, string>
  }

  export function openVhd(handler: RemoteHandlerAbstract, path: string): Promise<any>
  export function createVhdStreamWithLength(stream: NodeJS.ReadableStream): Promise<{ stream: NodeJS.ReadableStream; length: number }>
}

declare module '@xen-orchestra/backups/disks' {
  import type RemoteHandlerAbstract from '@xen-orchestra/fs'
  
  export { RemoteDisk, LocalDisk } from '@xen-orchestra/backups'
}