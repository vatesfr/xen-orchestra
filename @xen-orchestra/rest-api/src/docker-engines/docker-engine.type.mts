import type { XoDockerEngine } from '@vates/types'

/**
 * SSH connection to a Docker host
 *
 * The SSH user must be able to read and write the Docker socket (e.g. be in
 * the `docker` group): this is equivalent to root access on the Docker host.
 */
export interface CreateDockerEngineBody {
  /** VM running the engine, required without `host` */
  $VM?: string
  label?: string
  /** SSH host, without it the address is resolved from the VM's reported addresses */
  host?: string
  /** SSH port, default 22 */
  port?: number
  username: string
  /** a password or a private key is required */
  password?: string
  /** OpenSSH or PEM private key */
  privateKey?: string
  passphrase?: string
  /** default `/var/run/docker.sock` (rootless Docker: `/run/user/<uid>/docker.sock`) */
  socketPath?: string
  /**
   * `SHA256:…` as printed by `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub`
   * on the Docker host, or the `fingerprint` of a 409 `HOST_KEY_UNKNOWN` answer
   * once checked. Verified on connection.
   */
  hostKeyFingerprint?: string
  /**
   * without `hostKeyFingerprint`: trust and pin whatever host key is presented
   * (never stored). Prefer sending the checked fingerprint.
   */
  acceptUnknownHostKey?: boolean
}

/**
 * Omitted properties are kept, `null` or `''` clears them (`port` and
 * `socketPath` are reset to their defaults)
 */
export interface UpdateDockerEngineBody {
  $VM?: string | null
  label?: string | null
  host?: string | null
  port?: number | null
  username?: string
  password?: string | null
  privateKey?: string | null
  passphrase?: string | null
  socketPath?: string | null
  /**
   * replaces the pinned key, verified by connecting before saving; `null`
   * clears it: the host key is then checked like on creation
   */
  hostKeyFingerprint?: string | null
  /** see the creation */
  acceptUnknownHostKey?: boolean
}

export type DockerEngineId = XoDockerEngine['id']
