# Copy a disk to a raw image

This guide copies a whole virtual disk to a raw image on the local machine
with `nbdcopy`, and checks the copy against an image built from the
datastore's own files.

## What you need

- A virtual machine that is powered off, or a disk that the host will let
  you open: a base link under a snapshot of a running virtual machine is
  fine, the link a running virtual machine writes to is not.
- `libnbd-bin`, for `nbdinfo` and `nbdcopy`.
- `socat`, to give the NBD tools a socket to connect to.
- The host pinned as in [Pin a host certificate](pin-a-host-certificate.md),
  and `VECTURA_PASSWORD` exported in the shell.

## Why a bridge

`vectura serve` speaks NBD on its own standard input and output, the way a
spawning program expects. `nbdcopy` and `nbdinfo` can start a server
themselves with their `[ CMD ]` form, but that form hands the child a
listening socket through systemd socket activation, not its pipes, so
`serve` would wait on standard input while the client waits on the socket.
A Unix socket with `socat` in front of it connects the two: each
connection accepted on the socket becomes the standard input and output of
one fresh `serve` process.

## 1. Write the server command in a script

`socat` splits the command it runs at spaces, and a datastore path has
one, so put the command in a script:

```sh
cat > ~/bin/serve-vm <<'END'
#!/bin/sh
exec vectura serve \
  --host esxi.example \
  --user root \
  --vm-id 3 \
  --disk '[datastore1] vm/vm.vmdk' \
  --thumbprint sha256:BA:78:16:...:AD \
  --verbose "$@"
END
chmod +x ~/bin/serve-vm
```

`--verbose` is optional; it makes each process report a summary on
standard error when it ends.

## 2. Start the bridge

```sh
socket="$XDG_RUNTIME_DIR/vectura.sock"
socat UNIX-LISTEN:"$socket",fork EXEC:"$HOME/bin/serve-vm" &
```

`fork` keeps `socat` listening after the first connection. Every
connection starts one `serve`, which logs in, obtains its own ticket,
opens the disk and ends when the client disconnects. The password reaches
the script through the environment `socat` inherited; nothing about it is
on a command line.

## 3. Look at the export

```sh
nbdinfo "nbd+unix:///?socket=$socket"
```

`nbdinfo` reports the export size, that it is read-only, and the block
sizes (512 bytes minimum, 1 MiB preferred, 32 MiB maximum). It opens one
connection, so one `serve` ran and ended.

## 4. Copy

```sh
nbdcopy -p "nbd+unix:///?socket=$socket" disk.raw
```

The export does not advertise multiple connections, so `nbdcopy` uses one,
and one `serve` process serves the whole disk. Its `summary` line on
standard error, when `--verbose` is set, gives the bytes served, the bytes
that crossed the wire and the elapsed time.

`qemu-img` reads the same socket if you want another format directly:

```sh
qemu-img convert -p -O qcow2 "nbd+unix:///?socket=$socket" disk.qcow2
```

## 5. Stop the bridge

```sh
kill %1
rm -f "$socket"
```

## Check the copy

The reference is the raw image of the disk built from the files the
datastore holds. Download the descriptor and every extent of the disk
through the datastore browser while the virtual machine is off, into one
directory so that a snapshot chain's parent references resolve, then
convert the top descriptor:

```sh
qemu-img convert -O raw vm-000002.vmdk reference.raw
cmp disk.raw reference.raw && echo identical
```

Build the reference before the copy or after it, not during it: the host
locks the files while the datastore browser serves them, and an NFC open
during the download fails with `Failed to lock the file`; the reverse also
holds, and the datastore browser answers `500` while `serve` has the disk
open.

## Long copies

A management session on the host expires after somewhere between 30 and
52 minutes without a management call, and reads on the disk do not count
as one. A copy that takes longer ends with the disk fully served, exit
code 0, and one line on standard error saying the final `Logout` was
refused because the session was no longer authenticated. It is
informational; the copy is complete.

## Related

- [Tune depth and compression](tune-depth-and-compression.md) for a faster
  copy on a long link.
- [Host requirements and limits](../reference/host-requirements-and-limits.md)
  for what the host lets you open.
