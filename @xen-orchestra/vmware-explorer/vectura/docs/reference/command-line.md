# Command line

```
vectura <command> [flags]
vectura --version
vectura --help
```

Two commands: `fingerprint` and `serve`. Every message for a person goes
to standard error, prefixed `vectura: `. `serve` writes the NBD stream to
standard output and nothing else.

## `vectura fingerprint`

Prints the hashes of the certificates a host presents on its management
and data ports, then exits. Any certificate is accepted; nothing is sent
after the TLS handshake.

| Flag         | Value                       | Default            | Meaning                                                                                |
| ------------ | --------------------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `--host`     | `<name>` or `<name>:<port>` | required, port 443 | The host, with its management port. A bare IPv6 address keeps the default port.        |
| `--nfc-port` | port number                 | 902                | The data port, where the host greets before TLS starts.                                |
| `--verbose`  |                             | off                | Also write the negotiated TLS version and cipher suite of each port to standard error. |

Output, one line per port and hash, hex in upper case with colons:

```
443 sha256 <hash>
443 sha1 <hash>
902 sha256 <hash>
902 sha1 <hash>
```

Exit code 0 when the four lines were printed, 1 when a port could not be
reached or did not complete a handshake, 2 for a usage error.

## `vectura serve`

Exports one virtual disk, read-only, as a fixed-newstyle NBD server on
standard input and output. The password is read from `VECTURA_PASSWORD`.

| Flag            | Value                       | Default            | Meaning                                                                                                                      |
| --------------- | --------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `--host`        | `<name>` or `<name>:<port>` | required, port 443 | The ESXi host and its management port. With `--ca-file` or the system roots, the name is checked against the certificate.    |
| `--user`        | user name                   | required           | The account to log in with.                                                                                                  |
| `--vm-id`       | managed object reference    | required           | The virtual machine that owns the disk, such as `3` or `vm-42`.                                                              |
| `--disk`        | datastore path              | required           | The disk to export, such as `[datastore1] vm/vm.vmdk`. Quote it: the path holds a space.                                     |
| `--thumbprint`  | `sha256:<64 hex digits>`    | none               | Pin the management port's certificate to this hash. Colons between pairs and either case are accepted. Excludes `--ca-file`. |
| `--ca-file`     | path to a PEM bundle        | none               | Verify the management port's certificate against this bundle instead of the system roots. Excludes `--thumbprint`.           |
| `--depth`       | 1 to 32                     | 16                 | Host reads kept in flight at once. The limit is per host: lower it when several processes read from the same host.           |
| `--compression` | `skipz`, `zlib`, `none`     | `skipz`            | How the host packs each chunk: runs of zeros left out, deflated, or as stored.                                               |
| `--transport`   | `nfcssl`, `nfc`             | `nfcssl`           | Whether the disk session runs inside a second TLS session on the data connection, or in clear. `nfc` prints a warning.       |
| `--verbose`     |                             | off                | Write the session transcript to standard error.                                                                              |

Without `--thumbprint` or `--ca-file`, the management port's certificate
is verified against the system's root store. There is no flag that skips
verification. The data port is verified against the thumbprint carried by
the ticket and confirmed in the ticket dialogue, with no flag involved.

### Environment

| Variable           | Meaning                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `VECTURA_PASSWORD` | The password of `--user`. Required and non-empty; checked before any connection. Never read from a flag, a file or a prompt. |

### Exit codes

| Code | When                                                                                                                                                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | The NBD client sent `NBD_CMD_DISC`; the disk was closed and the session logged out.                                                                                                                                                                                     |
| 1    | The host, the network or the client failed after the command started: a connection refused or timed out, a certificate that did not match, a host error, a malformed reply, a client that closed standard input without disconnecting. The reason is on standard error. |
| 2    | Usage error: unknown or conflicting flags, a value out of range, `VECTURA_PASSWORD` unset or empty, a `--ca-file` that does not parse. Reported before any connection.                                                                                                  |

### Warnings

`--transport nfc` prints, before the session starts:

```
vectura: warning: --transport nfc carries the disk in clear text after the ticket dialogue
```

### Timeouts

| Timeout                               | Value      |
| ------------------------------------- | ---------- |
| Connecting to a port                  | 10 seconds |
| A read or write on a connected socket | 60 seconds |

Either one, expired, ends the run with exit code 1.
