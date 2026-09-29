# The NBD export

`vectura serve` implements the server side of the NBD protocol, as the
protocol document describes it
(<https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md>),
over its standard input (requests) and standard output (replies). This
page lists what the server sends, what it accepts and how it answers
everything else.

## Handshake

The server sends the fixed-newstyle greeting:

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| `NBDMAGIC`      | `0x4e42444d41474943`                                       |
| `IHAVEOPT`      | `0x49484156454F5054`                                       |
| Handshake flags | `NBD_FLAG_FIXED_NEWSTYLE` (1) and `NBD_FLAG_NO_ZEROES` (2) |

The client flags must carry `NBD_FLAG_C_FIXED_NEWSTYLE`; otherwise the
run ends with `nbd: the client flags 0x... lack NBD_FLAG_C_FIXED_NEWSTYLE`
and exit code 1. `NBD_FLAG_C_NO_ZEROES` is honored: with it, the 124
zero bytes after `NBD_OPT_EXPORT_NAME`'s reply are omitted.

## Options

| Option                                                                                                              | Reply                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `NBD_OPT_EXPORT_NAME` (1)                                                                                           | The export size and flags, then transmission starts.                                                       |
| `NBD_OPT_ABORT` (2)                                                                                                 | `NBD_REP_ACK`, then the server exits 0.                                                                    |
| `NBD_OPT_INFO` (6)                                                                                                  | `NBD_REP_INFO` for `NBD_INFO_EXPORT` and `NBD_INFO_BLOCK_SIZE`, then `NBD_REP_ACK`; negotiation continues. |
| `NBD_OPT_GO` (7)                                                                                                    | The same replies as `NBD_OPT_INFO`, then transmission starts.                                              |
| Anything else (`NBD_OPT_LIST`, `NBD_OPT_STARTTLS`, `NBD_OPT_STRUCTURED_REPLY`, extended headers, metadata contexts) | `NBD_REP_ERR_UNSUP`; negotiation continues.                                                                |

The export name given to `NBD_OPT_EXPORT_NAME`, `NBD_OPT_INFO` or
`NBD_OPT_GO` is ignored: there is one disk, whatever the client calls it.
An `NBD_OPT_INFO` or `NBD_OPT_GO` whose data does not parse as an export
name followed by a count of information requests is answered
`NBD_REP_ERR_INVALID`. Option data longer than 4096 bytes is a protocol
failure: the run ends with exit code 1.

### What the export reports

| Item                 | Value                                                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Export size          | The virtual capacity of the disk, in bytes, as the host reports it at open. For a snapshot chain, the capacity of the disk, not the size of the top link's file. |
| Transmission flags   | `NBD_FLAG_HAS_FLAGS` (1) and `NBD_FLAG_READ_ONLY` (2), nothing else.                                                                                             |
| Minimum block size   | 512 bytes                                                                                                                                                        |
| Preferred block size | 1 MiB                                                                                                                                                            |
| Maximum block size   | 32 MiB                                                                                                                                                           |

Not advertised, so not to be assumed: multiple connections
(`NBD_FLAG_CAN_MULTI_CONN`), flush, trim, write zeroes, fast zero,
structured replies, TLS on the NBD side.

## Transmission

Requests carry `NBD_REQUEST_MAGIC`; any other magic ends the run with
exit code 1. Replies are simple replies, `NBD_SIMPLE_REPLY_MAGIC`, with
the request's cookie. Replies can arrive in a different order from the
requests.

| Command                                                                            | Condition                                                                     | Reply                                                                                                                             |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `NBD_CMD_READ` (0)                                                                 | Offset plus length within the export, length at most 32 MiB, no command flags | Error 0 and the data.                                                                                                             |
| `NBD_CMD_READ`                                                                     | Past the export, longer than 32 MiB, or with any command flag set             | `NBD_EINVAL` (22), no data.                                                                                                       |
| `NBD_CMD_READ`                                                                     | A host read failed, timed out, or answered with a chunk that does not fit     | `NBD_EIO` (5) to this command and every other in flight, then the disk is closed, the session logged out, and the server exits 1. |
| `NBD_CMD_WRITE` (1), `NBD_CMD_TRIM` (4), `NBD_CMD_WRITE_ZEROES` (6)                |                                                                               | `NBD_EPERM` (1). The data of a write is consumed and discarded.                                                                   |
| `NBD_CMD_FLUSH` (3), `NBD_CMD_CACHE` (5), anything unknown, any command with flags |                                                                               | `NBD_EINVAL` (22).                                                                                                                |
| `NBD_CMD_DISC` (2)                                                                 |                                                                               | No reply. The disk is closed, the session logged out, the server exits 0.                                                         |

A length of zero on a read is within the export whenever the offset is,
and is answered with error 0 and no data.

## Ending

| Event                                       | Result                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------- |
| `NBD_CMD_DISC`                              | Close, logout, exit 0.                                                                |
| `NBD_OPT_ABORT` during negotiation          | Logout, exit 0.                                                                       |
| Standard input closed before `NBD_CMD_DISC` | Close, logout, exit 1, `the nbd client left without disconnecting` on standard error. |
| A malformed request, option or flag word    | Close, logout, exit 1, the reason on standard error.                                  |
| A host or network failure                   | `NBD_EIO` to what is in flight, close if possible, logout, exit 1.                    |

Once the server has stopped, it does not reconnect and cannot be reused:
a new read means a new process.
