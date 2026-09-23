export interface MountLiveDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /** Host to which the disk will be attached. */
  hostId: string
}
