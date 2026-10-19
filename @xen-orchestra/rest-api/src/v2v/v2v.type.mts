import type { VmwareInventory } from '@vates/types'

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

/** the raw inventory of the source, tagged with its platform */
export type V2vVmwareInventory = VmwareInventory & { platform: 'vmware' }

export type V2vInventory = V2vVmwareInventory

/** how the guest is prepared to boot on XCP-ng by the repair ISO */
export type V2vRepairOptions = {
  /** `standard` leaves the VMware components on disk, disabled, `full` removes them. Default: `standard` */
  windowsCleanup?: 'standard' | 'full'
  /** `;`-separated patterns of the packages of the guest tools ISO to install, in order. Default: `*.msi` */
  windowsMsiPatterns?: string
  /**
   * build of the repair ISO to use, deployed as `xo-repair-<build>-<commit>.iso`: its date (`YYYYMMDD`) or a release
   * tag. Default: the build this version of XO is tested with
   */
  isoVersion?: string
}

/** options which can be set for the whole launch, then overridden for a VM */
export type V2vVmOptions = {
  /** stop the source VM before the last delta, which completes the import */
  stopSource?: boolean
  /**
   * once the import is complete, boot the VM on the repair ISO deployed on the pool (`xo-repair-<build>-<commit>.iso`),
   * which prepares the guest to run on XCP-ng. Off by default. Needs a complete import: a source stopped, or
   * stopped by `stopSource`. A failed repair does not fail the import
   */
  repair?: boolean | V2vRepairOptions
  /**
   * start the VM once its import is complete. With `repair`, the first boot of the guest is followed: Windows
   * installs its drivers and agent, then Secure Boot is enabled again when the source had it. Needs a complete
   * import. A failed first boot does not fail the import
   */
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
   * number of VMs imported in parallel
   * @isInt
   * @minimum 1
   */
  concurrency?: number
}

/** UUID of the XCP-ng VM, by VMware VM id */
export type V2vStartResult = Record<string, string>
