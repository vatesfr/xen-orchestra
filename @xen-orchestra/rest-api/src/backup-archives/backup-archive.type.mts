/**
 * Body of `POST /backup-archives/{id}/actions/mountLiveDisk`.
 *
 * The disk is identified by its path on the backup repository, which contains
 * slashes, so it cannot be a route parameter.
 */
export interface MountLiveDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /** Host the disk is attached to. */
  hostId: string
}

/** Body of `POST /backup-archives/{id}/actions/unmountLiveDisk`. */
export interface UnmountLiveDiskBody {
  /** Identifier returned by the `mountLiveDisk` action. */
  mountId: string
}
