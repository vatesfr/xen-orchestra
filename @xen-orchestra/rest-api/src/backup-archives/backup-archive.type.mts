/**
 * Body of `POST /backup-archives/{id}/actions/mountDisk`.
 *
 * The disk is identified by its path on the backup repository, which contains
 * slashes, so it cannot be a route parameter.
 */
export interface MountDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /** Host the SR is attached to. */
  host: string
}

/** Body of `POST /backup-archives/{id}/actions/unmountDisk`. */
export interface UnmountDiskBody {
  /** Identifier returned by the `mountDisk` action. */
  mountId: string
}
