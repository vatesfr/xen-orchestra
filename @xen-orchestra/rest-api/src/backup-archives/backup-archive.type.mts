/**
 * Body of `POST /backup-archives/{id}/actions/mountLiveDisk`.
 *
 * The disk is identified by its path on the backup repository, which contains
 * slashes, so it cannot be a route parameter.
 */
export interface MountLiveDiskBody {
  /** One of the archive's `disks[].id`. */
  diskId: string
  /**
   * Host the disk is attached to. Defaults to the host running this XO when
   * `srId` is given (the cache disk must be plugged there), otherwise required.
   */
  hostId?: string
  /**
   * SR for a local read/write cache: a block read from the backup is kept there,
   * so re-reading it is local, and writes are accepted into it too. Omit for a
   * lower-performance, read-only mount that needs no local storage and can
   * target any host.
   */
  srId?: string
}

/** Body of `POST /backup-archives/{id}/actions/unmountLiveDisk`. */
export interface UnmountLiveDiskBody {
  /** Identifier returned by the `mountLiveDisk` action. */
  mountId: string
}

/** Body of `POST /backup-archives/{id}/actions/hydrateLiveDisk`. */
export interface HydrateLiveDiskBody {
  /** Identifier returned by the `mountLiveDisk` action; must have been mounted with `srId`. */
  mountId: string
}
