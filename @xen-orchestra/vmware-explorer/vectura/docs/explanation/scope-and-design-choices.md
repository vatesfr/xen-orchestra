# Scope and design choices

Vectura is small on purpose. This page lists what it does not do, why,
and which of the choices are principles rather than gaps that a later
version fills.

## Why a client written from public sources

Vectura depends on no proprietary library. A Linux package carries the
whole of it, at a version the packager chose, with nothing for the
operator to download by hand.

The client side of the protocol is written from public sources only: the
vSphere API reference, Broadcom knowledge base articles, and
measurements taken on ESXi 7 and 8 hosts. No proprietary binary or
header is opened, and no third-party reimplementation is read. It is
slower to write; it is the only way the result can be shipped.

## Why ESXi 7 and 8, directly, and nothing else

- **No vCenter.** The NFC ticket that opens a disk's files is issued by
  the host that holds them. Going through vCenter adds a hop that
  resolves to the same host and a second kind of session to manage.
  Vectura asks for the host's address and refuses a vCenter's, with the
  message saying so.
- **No ESXi 6.x.** Those hosts do not announce `SHA256 supported`, so the
  data port could not be confirmed by anything better than SHA-1, and
  their default TLS configuration is what a 2026 client should not
  negotiate. Both lines of ESXi 6 are past their end of general support.
- **Capabilities, not versions.** What a host can do is read from the
  greeting line on port 902, not from a version string. A host that
  announces the needed capabilities is served; one that does not is
  refused with the list of what it announced.

## Why standard input and output

The consumer Vectura is built for is a program that spawns it: one
process per disk, for as long as the disk is being read. A TCP listener
would need a port, a bind address, a way to hand the socket over and a
way to make sure nobody else connects to it. Two pipes need none of that,
they are closed when the parent dies, and libnbd already knows how to
negotiate over them. Shell users who want a socket put `socat` in front,
as the copy guide shows.

The same reasoning gives one connection per process. The export does not
advertise multiple connections, because the process has exactly one
host session and one client, and a second client would need a second
ticket anyway.

## Why read-only

The use is backup, replication and inspection, which read. Writing to a
virtual disk that a hypervisor owns is a different product with a
different failure mode, and leaving the write path out means it cannot
be reached by mistake, by flag or by bug.

## Why no reconnect

A session that breaks, on the host or on the network, ends the run with
`NBD_EIO` to what was in flight and exit code 1. Reconnecting inside the
process would mean a second login, a second ticket and a decision about
which of the reads in flight to trust, all hidden from the caller. The
caller has the exit code and can start a new process, with the reads it
knows it still needs. What has been measured so far, an open disk that
survives half an hour idle and a management session that lasts at least
thirty minutes, makes the ordinary run not need one.

## Why rustls, synchronous I/O and two threads

- **rustls with aws-lc-rs, no OpenSSL.** One TLS stack, in the binary,
  with no system library to match at run time and no shell out. ESXi 7
  and 8 hosts negotiate TLS 1.2 with ECDHE and AES-GCM on both ports,
  which rustls speaks.
- **Synchronous `std` I/O, no async runtime.** A run is two sockets and
  two pipes. Two threads joined by a bounded channel cover that with
  back pressure for free and nothing to schedule. An async runtime would
  add a dependency, a build-time and a class of bugs for a concurrency
  the problem does not have.
- **A depth window instead of parallel connections.** The host answers a
  read of at most 1 MiB, so throughput on a long link is a matter of
  keeping enough of them in flight. A window of 16, adjustable up to 32,
  does that on one connection and keeps the host's per-host budget
  shared fairly between processes.

## Why `skipz` by default

Three ways to pack a chunk were measured on the same disk and link.
Leaving out runs of zeros costs the host almost nothing and cut the bytes
on the wire to a sixth; zlib halved that again and was slower end to end,
because the host deflates slower than the link carries. `skipz` is the
default; `zlib` is there for a link slow enough to make it pay, and
`none` for diagnosis.

## Why the password comes only from the environment

A flag shows in the process table for the life of the process. A file is
left behind and has permissions to get wrong. A prompt cannot be answered
by the program that spawns Vectura. The environment is inherited from the
parent, visible to the parent's owner only, and gone with the process.
Nothing else is accepted, so nothing else can be misused.

## What may change

Reconnection within a run, a wider host set once a public source covers
it, and LAN throughput figures are all open. What will not change without
a written decision is the list above: no way to skip certificate
verification, no password outside the environment, no write path, no
proprietary dependency.
