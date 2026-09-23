# Troubleshoot a session

Everything Vectura has to say goes to standard error with a `vectura:`
prefix; standard output is data. Start there, and add `--verbose` to see
where in the session the run stopped. This guide lists the messages you
are most likely to meet, what each means and what to do.

## Exit codes

| Code | Meaning                                                                                                                           |
| ---- | --------------------------------------------------------------------------------------------------------------------------------- |
| 0    | The client disconnected with `NBD_CMD_DISC` and the session ended, or `fingerprint` printed its lines.                            |
| 1    | The host, the network or the client failed after the command started. The reason is on standard error.                            |
| 2    | Usage error: a bad or missing flag, `VECTURA_PASSWORD` unset or empty, an unreadable `--ca-file`. Reported before any connection. |

## Before the login

| Message                                                                            | Meaning                                                                                         | Do                                                                                                                          |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `VECTURA_PASSWORD is not set`                                                      | The variable is missing or empty in the environment of the process.                             | Export it in the shell that runs `serve`, or set it in the child's environment.                                             |
| `could not connect: ... timed out`                                                 | Nothing answered on port 443 within 10 seconds.                                                 | Check the address, the port and the path to the host.                                                                       |
| `certificate thumbprint mismatch: expected ..., the host presented ...`            | The management port's certificate is not the pinned one.                                        | Run `fingerprint`, check the new hash out of band, update the pin. See [Pin a host certificate](pin-a-host-certificate.md). |
| `tls handshake failed: ...`                                                        | With `--ca-file` or the system roots: the certificate does not chain or does not name the host. | Pin by thumbprint, or give `--host` the name the certificate carries.                                                       |
| `<host> is not an ESXi host (apiType VirtualCenter); connect to the host directly` | `--host` names a vCenter.                                                                       | Use the ESXi host's own address.                                                                                            |
| `Login: the host answered: ...`                                                    | The host refused the credentials; the text is the host's.                                       | Check the user and the password.                                                                                            |

## Opening the disk

| Message                                                                                                    | Meaning                                                                                                                               | Do                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `greeting: the host does not announce "SHA256 supported"; announced: [...]`                                | The data port belongs to a host older than ESXi 7, which Vectura does not support.                                                    | Use an ESXi 7.x or 8.x host.                                                                                                    |
| `greeting: the host does not announce "NFCSSL supported"; announced: [...]`                                | The host cannot carry the disk inside a second TLS session.                                                                           | Not seen on a supported host. `--transport nfc` would carry the disk in clear text; understand what that means before using it. |
| `open "[ds] vm/x.vmdk": the host reported error 11: NfcAioProcessOpenFileMsg: permission check failed ...` | The ticket covers the files of the virtual machine `--vm-id` names, and this path is not one of them, or the account may not read it. | Check `--vm-id` against `--disk`.                                                                                               |
| `... Thin/TBZ/Sparse disks cannot be opened in multiwriter mode`                                           | The disk is the link a running virtual machine writes to.                                                                             | Power the virtual machine off, or take a snapshot and read a base link.                                                         |
| `... DiskLib error 16392: Failed to lock the file`                                                         | Another reader holds the file, typically a datastore browser download.                                                                | Wait for it to finish.                                                                                                          |
| `the host closed the connection during the ...`                                                            | The data port dropped the session before the disk was open.                                                                           | Retry once; if it repeats, the host's log says why.                                                                             |

## While serving

| Symptom                                                                                         | Meaning                                                                                                                                                                                     | Do                                                                                           |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A read is answered `NBD_EIO`, then the process exits 1                                          | A host read failed, timed out after 60 seconds, or answered with a chunk that does not fit its read. Every command in flight got `NBD_EIO`, the disk was closed and the session logged out. | Read the message on standard error. A run is not resumed; start a new one.                   |
| A read is answered `NBD_EINVAL`                                                                 | The request is past the end of the export, longer than 32 MiB, carries a command flag, or is `NBD_CMD_FLUSH`.                                                                               | Fix the client's request.                                                                    |
| A write is answered `NBD_EPERM`                                                                 | The export is read-only.                                                                                                                                                                    | Nothing to do; this is the answer.                                                           |
| `the nbd client left without disconnecting`, exit 1                                             | The client closed standard input before `NBD_CMD_DISC`. The disk was closed and the session logged out.                                                                                     | Send `NBD_CMD_DISC` to end cleanly.                                                          |
| `logout: Logout: the host answered: The session is not authenticated.` after a long run, exit 0 | The management session expired during the run, which was longer than 30 to 52 minutes. The disk was served in full.                                                                         | Nothing. It is informational.                                                                |
| `nbdcopy [ vectura serve ... ]` or `nbdinfo [ ... ]` hangs, then exits 1                        | Those forms start the child with a listening socket, not its pipes.                                                                                                                         | Put a Unix socket in front; see [Copy a disk to a raw image](copy-a-disk-to-a-raw-image.md). |

## Reading a transcript

With `--verbose`, the last line before the error says how far the session
got: the management calls with their HTTP status, the greeting, the TLS
lines, the dialogue, the handshake message types, the `open` line, the
NBD options. [The transcript](../reference/transcript.md) explains each
line.

## Reporting

A bug report should carry the command line without the password, the
`--verbose` transcript, the host's version and the transport. The
transcript never contains the password, the ticket or the session cookie.
Anything touching certificate verification, credentials or how data from
the host is parsed is a vulnerability; report it to the maintainers in
private, not in a public issue.
