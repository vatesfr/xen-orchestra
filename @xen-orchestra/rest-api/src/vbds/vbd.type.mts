import type { VBD_MODE } from '@vates/types'

export interface CreateVbdBody {
  /** VM ID to attach the VDI to */
  vm: string
  /** VDI ID to attach */
  vdi: string
  /** Whether the VBD should be bootable (default: false) */
  bootable?: boolean
  /** Access mode: "RW" (read-write) or "RO" (read-only), default: "RW" */
  mode?: VBD_MODE
  /** Device position (e.g., "0", "1"). Auto-selected if not provided */
  position?: string
}
