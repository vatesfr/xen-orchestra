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
