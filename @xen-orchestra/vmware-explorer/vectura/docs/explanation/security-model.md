# The security model

Vectura carries a password, a ticket and a whole disk across a network.
This page says what each of them is protected by, what an attacker in a
given position could do, and which choices were made on purpose so that
an operator cannot weaken them by accident.

## What is at stake

- **The password.** It logs in on the host as `--user`, which is often
  `root`. Whoever gets it owns the host.
- **The ticket.** It opens the files of one virtual machine, once, for a
  short time. Less than the password, still a way to read a disk.
- **The disk.** Everything on it.
- **The bytes served.** A disk that was altered on the way is worse than
  no disk: a backup restored from it looks fine and is not.

## The management port is verified before the password leaves

`Login` is the first message that carries the password, and it goes
through a TLS session that was verified first. Three ways are offered and
one of them has to be taken:

- **A pinned thumbprint.** `--thumbprint sha256:<hash>` accepts exactly
  one certificate. Nothing else about it is checked, and nothing else
  needs to be: a name, an expiry date or a chain adds nothing when the
  certificate itself is known. It is the right choice for the default
  self-signed certificate an ESXi host installs, which no CA can vouch
  for and which names `localhost.localdomain` rather than the host.
- **A CA bundle.** `--ca-file` verifies the chain against the bundle and
  the name against `--host`. For hosts whose certificates are issued by
  the organization's own CA.
- **The system roots.** With neither flag, the same verification against
  the operating system's root store. For hosts with publicly issued
  certificates.

There is no fourth way. No `--insecure`, no `--no-verify`, no trust on
first use, no environment variable that skips the check. A tool that has
such a flag ends up run with it, in a script, forever. Vectura would
rather fail with `certificate thumbprint mismatch` and make the operator
look at why the certificate changed.

The `fingerprint` command exists so that the thumbprint can be obtained
without trusting anything: it accepts any certificate, sends nothing
after the handshake, and prints the hashes for the operator to compare
out of band.

## The data port is verified by the ticket

The connection to port 902 does not need a flag, because the ticket
already carries the SHA-1 thumbprint of the certificate that port
presents. The ticket came through the verified management session, so
its thumbprint is trusted the way the password's destination was. Vectura
then asks the host, inside the first TLS session, to confirm the SHA-256
of its certificate, and compares that with what the TLS layer saw as
well. This is why a host that does not announce `SHA256 supported` is
refused: without the confirmation, the data port would rest on SHA-1
alone. Finally, the second TLS session that carries the disk must present
the same certificate as the first.

An attacker who controls the network between Vectura and the host sees
TLS on 443 and TLS on 902, and can complete neither handshake without the
host's private key. What they can do is drop the connection, which ends
the run with exit code 1. `--transport nfc` removes the second TLS session
and carries the records in clear after the ticket dialogue, which is why
it prints a warning and why the default is `nfcssl`; the password and the
ticket are still protected under `nfc`, the disk is not.

## Secrets stay in memory

- The password is read from `VECTURA_PASSWORD` and nowhere else. Not a
  flag, which the process table would show; not a file, which would be
  left behind; not a prompt, which a spawning program cannot answer.
- Neither the password, the ticket nor the session cookie is ever written
  to standard error, put in an error message, rendered in a debug
  dump or kept in a test fixture. The types that hold them print a
  placeholder, and a test checks that they do. The transcript shows the
  ticket as `<ticket>`.
- The `.deb` and the binary carry no credential and no configuration.

A transcript or a bug report can therefore be shared as it is.

## What comes from the host is data

Every reply from the host is parsed with a limit: a dialogue line of at
most 1 KiB, an HTTP body of at most 1 MiB, a record of at most 1 MiB, an
NBD option of at most 4 KiB. A length field that says more is an error,
not an allocation. Each chunk of a read is checked against the read it
answers before it is placed. The code has no `unsafe` block and, outside
tests, no `unwrap` or `expect`: a broken invariant is an error that says
what was violated, not a panic that drops the stream half written.

## The export is read-only, structurally

Vectura never sends the host a write. The NBD export advertises
`NBD_FLAG_READ_ONLY`, and a write, trim or write-zeroes command is
answered `NBD_EPERM` and discarded. There is no flag to change that,
because there is no code path behind it.

## What is not covered

- **The host's own security.** Vectura trusts the certificate it was
  told to trust and the bytes the host serves under it. A compromised
  host serves what it likes.
- **The spawning program.** Whatever reads the NBD stream from standard
  output sees the disk. It also holds the password, since it puts it in
  the child's environment.
- **The link's availability.** A connection can be cut. The run ends,
  nothing is retried, and the caller decides.

Vulnerabilities, which is anything that touches certificate
verification, credentials, or how data from the host is parsed, are
reported to the maintainers in private, not in a public issue.
