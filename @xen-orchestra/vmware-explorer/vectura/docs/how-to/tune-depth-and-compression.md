# Tune depth and compression

Two flags decide how fast a disk is served: `--depth`, the number of host
reads in flight, and `--compression`, how the host packs each chunk. The
defaults, 16 and `skipz`, are right for most runs. This guide says when
to move them and how to see whether it helped.

## Depth

`serve` splits every client read into host reads of at most 1 MiB and
keeps up to `--depth` of them in flight across all the NBD commands it
holds. A reply lands, the next read goes out, and each NBD command is
answered when its last chunk arrives.

- **Raise it on a long link.** The window is what covers the round trip.
  On a link with a 61 ms round trip, going from 16 to 32 finished a
  16 GiB disk 1.40 times sooner with exactly the same bytes on the wire.
- **Lower it when processes share a host.** The host's NFC buffers are a
  per-host budget, and 32 is the most one process may ask for. With four
  processes on one host, `--depth 8` each keeps the total where one
  process alone would be.
- **The client has to keep up.** Depth counts host reads, not client
  commands. One 16 MiB command occupies sixteen slots; a client that sends
  one 512-byte command at a time and waits leaves the window empty
  whatever `--depth` says.

The range is 1 to 32; anything else is a usage error.

## Compression

| Mode              | What the host sends                               | When                                                                                                                                                              |
| ----------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skipz` (default) | Each 64 KiB chunk with its runs of zeros left out | Almost always. Cheapest for the host, and the wire cost tracks how sparse the disk is.                                                                            |
| `zlib`            | Each chunk deflated                               | Rarely. Fewest bytes on the wire, but the host deflates slower than most links carry: in the run below it halved the wire bytes of `skipz` and still took longer. |
| `none`            | Each chunk as stored                              | Diagnosis, or a fast local link with a slow host. Six to seven times the bytes of `skipz` on a typical disk.                                                      |

Whatever is asked, a chunk the host cannot reduce comes back stored, and
the three modes serve identical bytes.

Measured on an ESXi 7.0.3 host over a link whose 5.81 MB/s ceiling
bounds every row, so read the rows against each other and not as what a
LAN would give:

| Mode    | Depth | Elapsed | Served     | On the wire |
| ------- | ----- | ------- | ---------- | ----------- |
| `skipz` | 16    | 630 s   | 26.0 MiB/s | 4.14 MB/s   |
| `zlib`  | 16    | 705 s   | 23.2 MiB/s | 2.01 MB/s   |
| `none`  | 16    | 3110 s  | 5.3 MiB/s  | 5.52 MB/s   |
| `skipz` | 32    | 449 s   | 36.5 MiB/s | 5.81 MB/s   |

## See what a run does

Add `--verbose`. Every GiB served, a line reports the ratio of wire bytes
to disk bytes so far and the depth in use:

```
progress: served 4 GiB, compression ratio 0.15, depth 16
```

At the end, the summary gives the totals:

```
summary: bytes served 17179869184, wire bytes 2607992664, host reads 16384, elapsed 628.6 s
```

A ratio near 1.00 under `skipz` means the disk is dense and `zlib` might
cut wire bytes, at the host's expense. An elapsed time that does not drop
when `--depth` rises means the link or the client, not the window, is the
limit.

## Related

- [The transcript](../reference/transcript.md) for every line `--verbose`
  writes.
- [How a disk is read](../explanation/how-a-disk-is-read.md) for what a
  host read and a chunk are.
