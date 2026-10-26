import type { XoV2vInventory, XoV2vStatus } from '@vates/types'

/** only VMware in v1, other platforms will follow */
export type V2vPlatform = 'vmware'

/**
 * Credentials are never stored: every request needing the source carries them
 */
export type V2vConnection = {
  /** address of the vCenter or of the ESXi */
  host: string
  /**
   * @isInt
   * @minimum 1
   * @maximum 65535
   */
  port?: number
  username: string
  password: string
  /** do not verify the certificate of the source, for a self-signed one */
  skipSslCheck?: boolean
}

export type V2vInventoryBody = {
  platform: V2vPlatform
  connection: V2vConnection
}

/** the prerequisites of a migration on this XO: an error carries the reason to show */
export type V2vStatus = XoV2vStatus

/** the inventory of the source, as the migration wizard shows it */
export type V2vInventory = XoV2vInventory

/** options which can be set for the whole launch, then overridden for a VM */
export type V2vVmOptions = {
  /** stop the source VM before the last delta, which completes the import */
  stopSource?: boolean
  /** not supported yet */
  startVm?: boolean
  /** not supported yet */
  cleanup?: boolean
}

export type V2vDefaults = V2vVmOptions & {
  sr: string
  network: string
  template: string
}

export type V2vStartVm = V2vVmOptions & {
  /** VMware managed object reference of the VM */
  id: string
  /** SR of a disk, by disk key (e.g. `scsi0:0`), when it is not the default one. Ignored for a disk already imported */
  disks?: Record<string, string>
  /** network of a card, by NIC key (e.g. `4000`), when it is not the default one. Ignored when resuming an import */
  nics?: Record<string, string>
  template?: string
  /** not supported yet: must be empty */
  tags?: string[]
  /** only `true` is supported for now: the MAC addresses are always kept */
  keepMac?: boolean
}

export type V2vStartBody = {
  platform: V2vPlatform
  connection: V2vConnection
  pool: string
  defaults: V2vDefaults
  /**
   * @minItems 1
   */
  vms: V2vStartVm[]
  /** stop at the first failed VM instead of importing the others */
  stopOnError?: boolean
  /**
   * number of VMs imported in parallel, each one opens its own ESXi session and a host only
   * accepts a limited number of them
   * @isInt
   * @minimum 1
   * @maximum 8
   */
  concurrency?: number
}

/** UUID of the XCP-ng VM, by VMware VM id */
export type V2vStartResult = Record<string, string>
