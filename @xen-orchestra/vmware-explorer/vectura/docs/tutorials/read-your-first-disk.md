# Read your first disk

This tutorial takes you from a fresh Debian or Ubuntu machine to reading
the first sector of a virtual machine's disk on an ESXi host. It takes
about fifteen minutes. At the end you will have pinned a host, run
`vectura serve` under an NBD client, read bytes from the disk and read the
transcript of the session.

## What you need

- A Debian 12 or Ubuntu 22.04 machine, or newer, on amd64, that reaches the
  ESXi host on ports 443 and 902.
- An ESXi 7.x or 8.x host, reached directly by its own address. A vCenter
  address does not work.
- An account on that host allowed to read the virtual machine's files.
  `root` works; a narrower account is fine as long as the host lets it
  obtain an NFC ticket for the virtual machine.
- A virtual machine that is powered off. The disk a running virtual
  machine writes to cannot be opened; the section "Pick a disk" says why.
- The Debian package of Vectura, `vectura_<version>-1_amd64.deb`, from
  `@xen-orchestra/vmware-explorer/vectura/` in Xen Orchestra.
- `libnbd-bin`, which provides `nbdsh`, an NBD client that can start a
  server as a child process and talk to it over its pipes.

## 1. Install the tools

```sh
sudo dpkg --install vectura_<version>-1_amd64.deb
sudo apt install libnbd-bin
vectura --version
```

The last command prints `vectura` and the version. If it prints a usage
message instead, the package did not install.

## 2. Pin the host

Vectura never skips certificate verification. ESXi hosts ship a
self-signed certificate, so the usual way to trust one is to pin it by its
SHA-256 thumbprint. Print the thumbprints first:

```sh
vectura fingerprint --host esxi.example
```

The output has four lines, two per port:

```
443 sha256 BA:78:16:...:AD
443 sha1 3B:...:7F
902 sha256 BA:78:16:...:AD
902 sha1 3B:...:7F
```

Before you trust the `443 sha256` line, check it against the host itself.
On the host, over SSH, the certificate is at `/etc/vmware/ssl/rui.crt`:

```sh
openssl x509 -in /etc/vmware/ssl/rui.crt -noout -fingerprint -sha256
```

When the two hashes match, keep the `443 sha256` value: it is what
`--thumbprint` takes, colons included. The data port needs no pin from
you; the host tells Vectura which certificate to expect there, inside the
verified management session.

## 3. Put the password in the environment

Vectura reads the password from `VECTURA_PASSWORD` and from nowhere else:
not a flag, not a file, not a prompt. Read it into the variable without
echoing it and without leaving it in the shell history:

```sh
read -rs VECTURA_PASSWORD && export VECTURA_PASSWORD
```

Type the password and press Enter. The variable is now set for this shell
and for every process it starts.

## 4. Pick a disk

`serve` needs two things from the virtual machine: its managed object
reference and the datastore path of the disk.

- The managed object reference is the number in the virtual machine's URL
  in the ESXi host client, `.../host/vms/3` for `3`. Vectura takes it as
  `--vm-id 3`.
- The datastore path is the "Disk file" of the hard disk in the virtual
  machine's settings, in the form `[datastore1] vm/vm.vmdk`. Vectura takes
  it as `--disk '[datastore1] vm/vm.vmdk'`, quoted because of the space.

Power the virtual machine off before you go on. The host refuses to open
the link a running virtual machine writes to, and a disk read while it is
being written to would not be a consistent image anyway.

## 5. Read the first sector

`nbdsh` starts `vectura serve` as a child process, negotiates the NBD
export over the child's standard input and output, and gives you a handle
`h` on it. Fill in your host, thumbprint, reference and path:

```sh
nbdsh -c '
h.connect_command(["vectura", "serve",
    "--host", "esxi.example",
    "--user", "root",
    "--vm-id", "3",
    "--disk", "[datastore1] vm/vm.vmdk",
    "--thumbprint", "sha256:BA:78:16:...:AD"])
print("capacity:", h.get_size(), "bytes")
sector = h.pread(512, 0)
print("boot signature:", sector[510:512].hex())
h.shutdown()
'
```

You should see the capacity of the disk in bytes and, for a disk with a
partition table, the boot signature `55aa`. Behind the scenes, Vectura
logged in to the host, obtained a ticket for the virtual machine's files,
opened the disk on the data port, answered the client's negotiation with
the capacity the host reported, served one 512-byte read, then closed the
disk and logged out when `h.shutdown()` sent the disconnect.

If the command fails instead, the reason is on standard error with a
`vectura:` prefix. The most common ones at this point:

- `VECTURA_PASSWORD is not set`: step 3 was run in another shell.
- `certificate thumbprint mismatch`: the `--thumbprint` value is not the
  `443 sha256` line of step 2.
- `... is not an ESXi host (apiType VirtualCenter)`: `--host` names a
  vCenter; use the ESXi host's own address.
- `the host reported error 11: ... permission check failed`: the path
  does not belong to the virtual machine `--vm-id` names, or the account
  may not read it.

## 6. Watch the session

Run the same command with `--verbose` added to the argument list. Vectura
then narrates the session on standard error, which `nbdsh` leaves on your
terminal:

```
RetrieveServiceContent: 200 in 41 ms
Login: 200 in 63 ms
RetrieveInternalContent: 200 in 38 ms
NfcGetVmFiles: 200 in 52 ms
greeting: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported, SHA256 supported
first session tls TLSv1_2 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
> SESSION <ticket>
> BANNER
< 220 ...
> THUMBPRINT_SHA2 ...
< 200 BA:78:16:...
> PROXY nfcssl
< 200 ...
second session tls TLSv1_2 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
> handshake type 43
...
open: 17179869184 bytes, sector size 512
nbd option 7: info
nbd export: 17179869184 bytes
summary: bytes served 512, wire bytes 528, host reads 1, elapsed 0.3 s
Logout: 200 in 35 ms
```

The ticket is shown as `<ticket>`: the transcript never carries the
password, the ticket or the session cookie, so it is safe to paste into a
bug report. The `summary` line says the one sector cost one read on the
host; the wire bytes count the chunk's framing as well as its data. On a
whole disk the wire bytes fall far below the bytes served, because the
default compression leaves out runs of zeros.

## Where to go next

- To copy a whole disk into a raw image and check it against the
  datastore's own copy, see
  [Copy a disk to a raw image](../how-to/copy-a-disk-to-a-raw-image.md).
- To spawn Vectura from your own program, see
  [Drive Vectura from a program](../how-to/drive-vectura-from-a-program.md).
- To understand what the transcript lines mean, see
  [The transcript](../reference/transcript.md), and for what happened
  between the login and the first byte,
  [How a disk is read](../explanation/how-a-disk-is-read.md).
