/**
 * Body of `POST /backup-archives/{id}/live_disks`.
 *
 * The disk is identified by its path on the backup repository, which contains
 * slashes, so it cannot be a route parameter.
 */
export interface MountLiveDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /** Host to which the disk will be attached. */
  hostId: string
}
