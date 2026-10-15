# Host requirements and limits

What the ESXi host has to be and do for `vectura serve` to read a disk,
and the limits it imposes. Measurements were taken on ESXi 7.0.3 and
8.0.1 hosts, and on an ESXi 6.0.0 host for the legacy dialect; VMware's
documentation is cited where it states the limit.

## The host

| Requirement                                                            | Detail                                                                                                                                                                |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ESXi 7.x or 8.x, directly or through a vCenter; ESXi 6.x directly      | With a vCenter, `--host` names the vCenter and the ticket names the ESXi host that holds the virtual machine; the data port is opened on that host.                   |
| `SHA256 supported` in the data port's greeting, for the modern dialect | The ticket dialogue confirms the data port's certificate by its SHA-256. A host that does not announce it, ESXi 6.x, is read in the [legacy dialect](#esxi-6x-hosts). |
| `NFCSSL supported` in the greeting, for `--transport nfcssl`           | Without it, only `--transport nfc` can run, in clear text. Every host measured, 6.0 included, announces it.                                                           |
| Port 443 and port 902 reachable                                        | 443 for the management calls, on the vCenter when there is one; 902 for the greeting, the ticket dialogue and the disk, always on the ESXi host.                      |
| An account that may read the virtual machine's files                   | The account logs in on port 443 and obtains the ticket; the ticket covers the files of the virtual machine `--vm-id` names.                                           |

The greeting lines and their capability words are documented in Broadcom
knowledge base articles 343952, 338286, 341384 and 417531.

## ESXi 6.x hosts

A host whose greeting does not announce `SHA256 supported` speaks an older
dialect on the data port. The management calls, both TLS sessions and the
NBD export are the same; the disk session differs:

| Item                   | Legacy dialect                                                                                                                                                  | Source               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Data port verification | The SHA-1 thumbprint in the ticket, and the second TLS session must present the certificate of the first. The host has no SHA-256 confirmation in the dialogue. | Measured on ESXi 6.0 |
| Reads in flight        | 1, whatever `--depth` says. A read sent before the previous reply has arrived is sometimes never answered.                                                      | Measured on ESXi 6.0 |
| Compression            | None, whatever `--compression` says: each read comes back as stored.                                                                                            | Measured on ESXi 6.0 |
| Capacity               | Not in the open reply. Found by 512-byte reads from the size the disk's geometry gives: 26 reads for an 8 GiB disk, 6 for a 24 GiB disk.                        | Measured on ESXi 6.0 |
| Throughput             | 3 to 5 MiB/s per process over a link with a 30 ms round trip.                                                                                                   | Measured on ESXi 6.0 |
| Versions               | ESXi 6.0.0, reached directly. ESXi 6.5, 6.7 and a 6.x vCenter are untested.                                                                                     |                      |

Several `serve` processes can read the same disk at once, each over its
own session: two processes read about 9 MiB/s over the link above, where
the link itself was the limit.

## The disk

| Disk                                                      | Can it be opened                                                                                                                                |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Any link of a powered-off virtual machine                 | Yes.                                                                                                                                            |
| A base link under a snapshot of a running virtual machine | Yes, and the bytes are frozen for the duration.                                                                                                 |
| The link a running virtual machine writes to              | No: `Thin/TBZ/Sparse disks cannot be opened in multiwriter mode`; on ESXi 6.x, error 10, `NfcFssrvrOpen: Failed to open`.                       |
| A file the datastore browser is serving at the same time  | No: `DiskLib error 16392: Failed to lock the file`. The reverse holds too: the datastore browser answers `500` while the disk is open over NFC. |
| A file of another virtual machine than `--vm-id`          | No: error 11, `NfcAioProcessOpenFileMsg: permission check failed`; on ESXi 6.x, `NfcFssrvrOpen: permission check failed`.                       |

A snapshot chain is read through its top link; the host resolves the
parents. The export size is the disk's virtual capacity, whatever the
size of the files.

## Sizes

| Item                    | Value                                                                                            | Source                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Host read               | At most 1 MiB per read                                                                           | VMware's documented NFC session limits: 1 MB per stream |
| Chunk                   | 64 KiB, the host's unit of compression and placement                                             | Measured on ESXi 7 and 8                                |
| Sector                  | 512 bytes                                                                                        | The open reply                                          |
| Chunk compression codes | `none` 0, `zlib` 1, `skipz` 3; a chunk the host cannot reduce comes back as 0 whatever was asked | Measured on ESXi 7 and 8                                |

## Concurrency

| Item                            | Value                                                       | Source                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------- |
| Reads in flight per process     | 1 to 32, `--depth`, default 16; 1 on an ESXi 6.x host       | Vectura                                |
| NFC buffer per host             | 48 MB, 1 MB per stream, about 48 concurrent streams         | VMware's documented NFC session limits |
| Connections per `serve` process | One management session, one data connection, one NBD client | Vectura                                |

Several processes on one host share the host's buffer: keep the sum of
their depths at or under 32.

## Time

| Item                                                  | Value                                                                     | Source   |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| Management session lifetime without a management call | Expires between 30 and 52 minutes; reads on the data port do not renew it | Measured |
| Open disk, idle                                       | Stays open for at least 30 minutes without a read                         | Measured |
| Abandoned session after a signal                      | Expired by the host on its own, after about half an hour                  | Measured |
| Connect timeout                                       | 10 seconds                                                                | Vectura  |
| Socket read or write timeout                          | 60 seconds                                                                | Vectura  |

A run longer than the session lifetime serves the whole disk and exits
0; its `Logout` is refused and reported on standard error.

## TLS

| Item                         | Value                                                                                                                                                               | Source                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Versions the hosts negotiate | TLS 1.2 on both ports, `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384` or the AES-128 variant                                                                               | Measured; the vSphere 7 and 8 documentation on the default cipher suites |
| Certificate on 902           | The same certificate as on 443 on every host measured                                                                                                               | Measured                                                                 |
| Data port verification       | The SHA-1 thumbprint in the ticket, the SHA-256 confirmed in the dialogue on ESXi 7 and later, and the second TLS session must present the certificate of the first | Vectura                                                                  |

## Throughput, measured

One 16 GiB disk on an ESXi 7.0.3 host, over a link with a 61 ms round
trip and a 5.81 MB/s ceiling, which bounds every row. Not a LAN figure.

| `--compression` | `--depth` | Elapsed | Served     | Wire      |
| --------------- | --------- | ------- | ---------- | --------- |
| `skipz`         | 16        | 630 s   | 26.0 MiB/s | 4.14 MB/s |
| `zlib`          | 16        | 705 s   | 23.2 MiB/s | 2.01 MB/s |
| `none`          | 16        | 3110 s  | 5.3 MiB/s  | 5.52 MB/s |
| `skipz`         | 32        | 449 s   | 36.5 MiB/s | 5.81 MB/s |
