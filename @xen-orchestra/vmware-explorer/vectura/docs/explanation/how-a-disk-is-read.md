# How a disk is read

This page follows one `vectura serve` run from the first packet to the
last, and says why each step is there. It is background; the reference
pages hold the exact values.

## Two planes

An ESXi host exposes a virtual disk through two ports with two jobs.

Port 443 is the management plane. It speaks SOAP over HTTPS, the same
API vSphere clients use. Vectura makes four calls on it, hand-rolled
HTTP/1.1 with a small XML body each:

1. `RetrieveServiceContent`, to learn what it is talking to. A vCenter
   answers with an `apiType` of `VirtualCenter` and is refused: the disk
   files live on the host, and only the host's own `hostd` can hand out a
   ticket for them.
2. `Login`, with the user name and the password from `VECTURA_PASSWORD`.
   The host sets a session cookie.
3. `RetrieveInternalContent`, to reach the NFC service.
4. `NfcGetVmFiles`, with the virtual machine's managed object reference.
   The host answers with a ticket: an opaque string, the port to use, and
   the SHA-1 thumbprint of the certificate that port presents.

At the end, `Logout` closes the session. Between the two, the management
session is idle; the disk goes through the other port.

Port 902 is the data plane. The host greets in clear with a `220` line that lists its capabilities,
among them `NFCSSL supported` and `SHA256 supported`. Vectura reads the
list and refuses a host that lacks what it needs, before it sends
anything. Then it starts TLS.

## Ticket, thumbprint, and a second TLS session

Inside that first TLS session, a short line dialogue turns the ticket
into an open channel. The client names its session with the ticket, asks
for the banner, and asks the host to confirm the SHA-256 of the
certificate it is presenting. The host's answer must match the
certificate the TLS layer saw, and the SHA-1 from the ticket must match
it too. Then the client asks for `nfcssl`, and the host answers that the
channel is ready.

`nfcssl` means a second TLS handshake, on the same TCP connection, inside
the first session. It is how the hosts expect the disk bytes to be
carried. Vectura checks that the second
session presents the same certificate as the first. With
`--transport nfc`, the second handshake is skipped and the records below
travel in clear after the dialogue; Vectura warns before doing so.

## Handshake and records

The disk session opens with six fixed-size messages of 264 bytes: the
client sends a tag, an end-of-tag and a version, the host acknowledges
and answers with its version, then the client sends its name, its mode
and a ready message, and the host answers ready. Vectura calls itself
`vectura` and asks for the mode in which the host serves arbitrary
ranges of a disk on demand.

From then on, both sides exchange records: a 16-byte header with a magic
number, an opcode and a length, followed by a payload. The client says
hello, states its protocol version and capabilities, and opens the disk
by its datastore path. The host's open reply gives the disk's virtual
capacity and sector size; that capacity becomes the NBD export size. A
close and an end record close the session at the other end of the run.

## Reads, chunks, and the window

An NBD client asks for any range up to 32 MiB. The host, however, answers
a read of at most 1 MiB, and it answers it as a series of chunks of
64 KiB, each carrying its offset within the read and the compression the
host chose for it: as stored, deflated with zlib, or with its runs of
zeros left out, which Vectura calls `skipz` and asks for by default. The
host is free to answer with a stored chunk whatever was asked, and it
does when compressing would not shrink the chunk. Every chunk is checked
before it is placed: its offset must be inside the read, it must not
overlap a chunk already received, and once decoded it must be exactly
64 KiB or the tail of the read. A chunk that fails is a broken read, and
a broken read ends the run rather than serve wrong bytes.

So `serve` splits each NBD command into host reads of 1 MiB, numbers
them, and keeps a window of them in flight, 16 by default and 32 at most.
The window is what hides the round trip. When
a read's last chunk lands, it is placed at the right offset of the NBD
command's buffer, and when a command's last read lands, the command is
answered. Commands can complete out of order, which is what the NBD
cookie is for.

## Two threads, one channel

`serve` runs on two threads. One reads NBD requests from standard input
and pushes them into a bounded channel. The other owns the host
connection and standard output: it pulls commands, issues host reads,
receives records, places chunks, and writes replies. Nothing else touches
standard output, which is why nothing else may print: a stray line there
would corrupt the NBD stream.

The bounded channel is the back pressure. When the host side is busy, the
input side waits with its next command in hand, and the client sees its
replies slow down instead of its requests vanishing into a queue.

## Ending

A client that sends `NBD_CMD_DISC` gets a clean end: the disk is closed,
the end record sent, the management session logged out, exit code 0. A
client that closes its side without disconnecting gets the same cleanup
and an exit code of 1, because something went wrong on its side and the
process that spawned it should know. A failure on the host's side is
reported as `NBD_EIO` to every command still in flight, then the same
cleanup, then exit code 1. There is no reconnect: a run is one session,
and a session that breaks is a new run.

## Related

- [The NBD export](../reference/nbd-export.md) and
  [the transcript](../reference/transcript.md) give the exact values.
- [The security model](security-model.md) says what is verified at each
  step.
