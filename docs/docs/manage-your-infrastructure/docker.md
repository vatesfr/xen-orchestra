---
sidebar_position: 7
---

# Docker containers

Xen Orchestra can show and manage the Docker containers running inside your VMs: list them with their ports, state, uptime, CPU and memory usage, read their logs, start, stop, restart, pause, resume and remove them.

There is nothing to install in the VM: Xen Orchestra connects to it over **SSH** and talks to the Docker daemon through its Unix socket (`/var/run/docker.sock` by default), exactly like `docker -H ssh://user@vm` would. A connection to a Docker daemon is called a **Docker engine**; there is at most one per VM.

The feature is available in XO 6, on the VM page (**Containers** tab), and through the [REST API](#rest-api). Only administrators can use it.

:::warning
Access to the Docker socket is equivalent to **root access** on the VM (`docker run -v /:/host --privileged …`). The SSH credentials you give to Xen Orchestra are therefore root-equivalent on that VM: read the [security model](#security-model) before configuring an engine.
:::

## Prerequisites in the VM

- **OpenSSH server 6.7 or newer**: Xen Orchestra forwards the Docker socket with a `direct-streamlocal` channel (the equivalent of `ssh -L /local.sock:/var/run/docker.sock`), which appeared in OpenSSH 6.7. Other SSH servers (e.g. Dropbear) are not supported.
- **Stream local forwarding allowed** for the SSH user: `AllowStreamLocalForwarding` must be `yes` (the default), `all` or `local` in `/etc/ssh/sshd_config`, and neither `DisableForwarding yes` nor a `Match` block may disable it for that user. With `AllowStreamLocalForwarding no`, the connection works but the socket cannot be reached (`DOCKER_SOCKET_UNREACHABLE`).
- **Access to the Docker socket** for the SSH user, either:
  - membership in the `docker` group (rootful Docker, the default socket `/var/run/docker.sock`):

    ```sh
    sudo usermod -aG docker xo
    ```

    The membership applies to new sessions only.
  - or a **rootless** Docker daemon run by that user: its socket is `/run/user/<uid>/docker.sock` (`echo $XDG_RUNTIME_DIR/docker.sock`), to be set as the socket path of the engine. The daemon must keep running without an open session: `sudo loginctl enable-linger xo`.
- **An SSH key** (recommended) or a password for that user. Key types supported: Ed25519, ECDSA and RSA, in OpenSSH or PEM format, optionally protected by a passphrase.
- Docker Engine API 1.24 or newer (Docker 1.12, 2016). Xen Orchestra uses at most API 1.43 (Docker 24).

The **Test** action of an engine (`POST /rest/v0/docker-engines/<id>/actions/test`) tells whether the socket is missing, not a socket, not accessible to the user (`permission-denied`), or whether the forwarding is disabled.

### Brute-force protections: PerSourcePenalties and fail2ban

Xen Orchestra keeps one SSH connection per engine, opened on demand and closed after 5 minutes without use, and does not retry a failed engine for 30 seconds. Still, failed attempts are counted by the protections of the VM:

- **OpenSSH 9.8 and newer** enable `PerSourcePenalties` by default: each failed authentication, and each connection closed before authentication (which is what a rejected host key looks like to the server), adds a penalty to the source address. A few wrong keys in a row and the server refuses **every** connection from Xen Orchestra's address for a while (Xen Orchestra then reports `SSH_REFUSED_PENALTY`). To prevent this, exempt Xen Orchestra's address in the VM's `/etc/ssh/sshd_config`:

  ```
  PerSourcePenaltyExemptList 192.0.2.10
  ```

  Xen Orchestra also refuses by itself, for 10 seconds (`authFailureCooldown`), a new attempt with the same parameters after such a failure (`SSH_COOLDOWN`, HTTP 429 with `Retry-After`).
- **fail2ban** (or a similar tool) may ban Xen Orchestra's address after failed authentications: add it to `ignoreip` in `/etc/fail2ban/jail.local`, or make sure the credentials are right before saving them.

## Host key verification

Xen Orchestra verifies the SSH host key of the VM on every connection, so that the credentials are never sent to another machine (e.g. one which took over the VM's address). The key is pinned in the engine configuration when the engine is created.

Two ways to provide it:

1. **Paste the fingerprint** (recommended). Run this command **on the VM** (in its console, not through the network):

   ```sh
   ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
   ```

   and paste the `SHA256:…` part in the **Host key fingerprint** field. The connection is refused if the key presented does not match.

2. **Trust on first use**. Without a fingerprint, Xen Orchestra connects, does **not** save anything, and shows the fingerprint of the key presented by the VM (HTTP 409 `HOST_KEY_UNKNOWN` in the API). Compare it with the output of the command above, then confirm: the engine is saved with this fingerprint, which is verified again on that connection.

When the host key of the VM changes later (VM reinstalled, keys regenerated), the connections are refused with `HOST_KEY_MISMATCH`, which shows the expected and the presented fingerprints. If the change is legitimate, edit the engine and set the new fingerprint.

`[docker] strictHostKeyChecking = false` makes Xen Orchestra accept and pin an unknown key on the first connection instead of asking; a changed key is refused anyway. There is no mode which never verifies the key.

## Security model

- **Root-equivalent credentials.** Anyone able to use the engine can run any container on the VM, including a privileged one mounting the VM's root filesystem. Use a dedicated SSH user, and a dedicated key for Xen Orchestra.
- **Stored credentials.** The password, private key and passphrase of the engines are stored in Xen Orchestra's database (redis). They are **in plain text** unless `encryptCredentialDatabase` is enabled in the `[redis]` section of xo-server's configuration, like the credentials of the pool masters. They are never returned by the API (only `hasPassword` and `hasPrivateKey`), nor stored in task logs.
- **Administrators only.** Every Docker route requires an administrator in this version (no ACL, no resource set, no self-service).
- **License.** The feature requires the `DOCKER` feature of the XOA license (403 otherwise).
- **Raw passthrough disabled by default.** `[docker] allowRawApi = true` exposes the whole Docker Engine API of an engine at `/rest/v0/docker-engines/<id>/_raw/…` to administrators, which gives full control of the daemon (images, volumes, networks, exec…). Every call is logged (`xo:rest-api:docker-raw`). It is limited in size and duration, refuses attach, exec start and connection upgrades, and never forwards the XO cookie or credentials to the daemon.
- **No background connection.** Listing the engines never opens SSH; connections are opened when someone looks at the containers of a VM, and stats are only sampled while someone reads them.

## Configuration

These options go in the `[docker]` section of xo-server's configuration (`/etc/xo-server/config.toml`, or `~/.config/xo-server/config.toml`). Durations are a number of milliseconds or a string like `'30s'` or `'5 min'`; sizes a number of bytes or a string like `'1MiB'`.

| Option | Default | Description |
| --- | --- | --- |
| `allowRawApi` | `false` | Expose the raw Docker Engine API passthrough (administrators only) |
| `strictHostKeyChecking` | `true` | Ask for confirmation of an unknown host key; when `false`, the key presented on the first connection is pinned |
| `maxConnections` | `20` | Max SSH connections open at once (then 503 with `Retry-After`) |
| `connectionIdleTimeout` | `'5 min'` | An unused connection is closed after this delay |
| `connectTimeout` | `'15s'` | SSH handshake and authentication |
| `requestTimeout` | `'30s'` | One Docker API request |
| `failureTtl` | `'30s'` | A failed engine is not retried before this delay |
| `authFailureCooldown` | `'10s'` | After an authentication or host key failure, a new attempt with the same parameters is refused for this long (0 disables it) |
| `cacheExpiresIn` | `'10s'` | Container lists are cached for this long |
| `inspectThreshold` | `200` | Above this number of containers, a list does not inspect each of them |
| `maxListedEngines` | `10` | Max engines a single container list may cover |
| `statsIdleTimeout` | `'90s'` | Stats are sampled until nobody reads them for this long |
| `maxStatsContainers` | `100` | Max containers of an engine whose stats are sampled |
| `defaultLogsTail` | `100` | Default number of log lines |
| `maxLogsTail` | `10000` | Max number of log lines |
| `maxLogsSize` | `'5MiB'` | Logs responses are cut above this size |
| `logsTimeout` | `'30s'` | Reading the logs stops after this delay… |
| `logsIdleTimeout` | `'10s'` | …or after this delay without data |
| `maxRawRequestSize` | `'1MiB'` | Raw passthrough: max request body (413 above) |
| `maxRawResponseSize` | `'10MiB'` | Raw passthrough: max response (502 or cut above) |
| `rawRequestTimeout` | `'5 min'` | Raw passthrough: max duration of a request, response included (0: none) |

Example:

```toml
[docker]
allowRawApi = false
authFailureCooldown = '10s'
```

## REST API

The Docker objects are two flat collections: `docker-engines` (the SSH connections, stored by Xen Orchestra) and `docker-containers` (read live from the daemons). A container id is `<engine id>_<64-hex Docker id>`. See the [REST API](../automation/restapi.md) page for authentication, and `/rest/v0/docs` on your Xen Orchestra for the full reference. In the examples below, `$TOKEN` is an authentication token of an administrator.

### Configure an engine

```sh
# the engine of a VM, if any (no SSH connection is opened)
curl -b authenticationToken=$TOKEN \
  'https://xo.example.org/rest/v0/docker-engines?filter=$VM:613f541c-4bed-fc77-7ca8-2db6b68f079c&fields=id,label,resolvedHost,connectionStatus'

# create it, with the fingerprint checked on the VM
curl -b authenticationToken=$TOKEN -X POST -H 'Content-Type: application/json' \
  https://xo.example.org/rest/v0/docker-engines \
  -d "$(jq -n --rawfile key ~/.ssh/xo_docker \
    '{ "$VM": "613f541c-4bed-fc77-7ca8-2db6b68f079c", username: "xo", privateKey: $key,
       hostKeyFingerprint: "SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA" }')"
# → 201 {"id":"8d834412-eb40-4328-a815-3fcc0989bd07"}
```

Without `hostKeyFingerprint`, the answer is a 409 and nothing is saved:

```json
{
  "error": "the SSH host key is unknown",
  "data": {
    "fingerprint": "SHA256:G+4RawxzV+6SGkxauQY8Vqmu2KZ4ENCQu/YuxBIARDA",
    "algorithm": "ssh-ed25519",
    "code": "HOST_KEY_UNKNOWN"
  }
}
```

Check the fingerprint on the VM, then send the same request again with `"hostKeyFingerprint"` set to it.

`host` (default: an address reported by the VM's guest tools), `port` (22), `password`, `passphrase`, `socketPath` (`/var/run/docker.sock`) and `label` are optional. `PATCH /rest/v0/docker-engines/<id>` updates an engine (omitted secrets are kept, `null` clears them; a new connection parameter is verified by connecting before saving), `DELETE` removes it.

```sh
# connection test, with a diagnostic of the Docker socket on failure
curl -b authenticationToken=$TOKEN -X POST \
  'https://xo.example.org/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07/actions/test?sync=true'

# engine details: Docker version, counters, Compose projects
curl -b authenticationToken=$TOKEN \
  https://xo.example.org/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07/info
```

### Containers

A container list must be scoped with a `filter` on `$engine`, `$VM` or `$pool` (422 otherwise), covering at most `maxListedEngines` engines. Engines which cannot be reached are listed in the `x-docker-errors` response header.

```sh
curl -b authenticationToken=$TOKEN \
  'https://xo.example.org/rest/v0/docker-containers?filter=$VM:613f541c-4bed-fc77-7ca8-2db6b68f079c&fields=id,name,image,state,status,ports&stats=true'
```

With `stats=true`, running and paused containers get a `stats` object (`cpuPercent`, 100 meaning one full CPU, `memoryUsage`, `memoryLimit`, network and block I/O…), and `statsPending: true` during the first seconds, while the samples are collected.

```sh
C=8d834412-eb40-4328-a815-3fcc0989bd07_8f2e6c3a9b1d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789ab

curl -b authenticationToken=$TOKEN https://xo.example.org/rest/v0/docker-containers/$C
curl -b authenticationToken=$TOKEN "https://xo.example.org/rest/v0/docker-containers/$C/logs?tail=50"
curl -b authenticationToken=$TOKEN https://xo.example.org/rest/v0/docker-containers/$C/stats

# start, stop, restart, pause, unpause (a task is returned without sync=true)
curl -b authenticationToken=$TOKEN -X POST "https://xo.example.org/rest/v0/docker-containers/$C/actions/restart?sync=true"

# removal, force stops it first
curl -b authenticationToken=$TOKEN -X DELETE "https://xo.example.org/rest/v0/docker-containers/$C?force=true"
```

### Raw passthrough

With `allowRawApi = true`, any [Docker Engine API](https://docs.docker.com/reference/api/engine/) path can be called after `/_raw/` (prefixed with the negotiated API version unless it starts with `v1.xx/`):

```sh
curl -b authenticationToken=$TOKEN \
  'https://xo.example.org/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07/_raw/images/json?all=1'

# streams are passed through as they come, until rawRequestTimeout
curl -N -b authenticationToken=$TOKEN \
  https://xo.example.org/rest/v0/docker-engines/8d834412-eb40-4328-a815-3fcc0989bd07/_raw/events
```

### Errors

SSH and Docker failures come with a `data.code`:

| Code | HTTP | Meaning |
| --- | --- | --- |
| `HOST_KEY_UNKNOWN`, `HOST_KEY_MISMATCH` | 409 | See [host key verification](#host-key-verification) |
| `SSH_AUTH_FAILED` | 502 | Wrong username, key, passphrase or password |
| `SSH_UNREACHABLE` | 502 | The VM cannot be reached on its SSH port |
| `SSH_REFUSED_PENALTY` | 502 | The SSH server is refusing Xen Orchestra's address (PerSourcePenalties) |
| `SSH_COOLDOWN` | 429 | Same parameters as a failed attempt a few seconds ago, see `Retry-After` |
| `DOCKER_SOCKET_UNREACHABLE` | 502 | Socket missing, not accessible to the user, or forwarding disabled (see the test action) |
| `STREAM_LOCAL_UNSUPPORTED` | 502 | The SSH server is not OpenSSH |
| `DOCKER_API_VERSION_UNSUPPORTED` | 502 | Docker too old |
| `DOCKER_API_ERROR` | 400, 404, 409 or 502 | Error returned by Docker (`data.statusCode`): the request errors 400, 404 and 409 are passed through, the others give 502 |
| `TIMEOUT` | 504 | No answer in time |
| `POOL_EXHAUSTED` | 503 | Too many busy connections, see `Retry-After` |
