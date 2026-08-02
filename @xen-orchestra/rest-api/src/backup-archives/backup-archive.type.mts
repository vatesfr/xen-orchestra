/**
 * Body of `POST /backup-archives/{id}/actions/mountDisk`.
 *
 * The disk is identified by its path on the backup repository, which contains
 * slashes, so it cannot be a route parameter.
 */
export interface MountDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /**
   * SR holding the disk that caches what has been read from the backup. It must
   * be writable and reachable from the host running this XO, which is also the
   * host the mount is served to.
   */
  srId: string
}

/** Body of `POST /backup-archives/{id}/actions/unmountDisk`. */
export interface UnmountDiskBody {
  /** Identifier returned by the `mountDisk` action. */
  mountId: string
}
