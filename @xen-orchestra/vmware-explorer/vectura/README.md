# Vectura

Vectura reads VMware virtual disks over the NFC protocol. It is one Linux
binary with two commands:

- `vectura serve` logs in to an ESXi host, opens one virtual disk and serves
  it read-only as an NBD export on its own standard input and output. The
  program that spawned it reads any range of the disk, in any order, and
  ends the session when it is done.
- `vectura fingerprint` prints the certificate thumbprints a host presents
  on its management and data ports, so an operator can pin them before any
  credential is sent.

Vectura targets ESXi 7.x and 8.x hosts, reached directly or through a
vCenter; with a vCenter, the disk is read from the ESXi host its ticket
names. An ESXi 6.x host is refused at the data port's greeting. Certificate
verification can be pinned or pointed at a CA bundle but never skipped, and
the password is read from `VECTURA_PASSWORD` only.

## Install

The binary, `vectura`, ships in this directory with
`@xen-orchestra/vmware-explorer`, and xo-server runs it from there. It runs
on Debian 11, Ubuntu 20.04 or newer (amd64) and needs nothing but glibc. To
use it by hand, copy it to a directory in `PATH`:

```sh
sudo install vectura /usr/local/bin/
```

To build from source, install the
`build-essential` package (the TLS library compiles C) and let `rustup`
pick the pinned toolchain from `rust-toolchain.toml`:

```sh
cargo build --release --locked
```

## Try it

```sh
vectura fingerprint --host esxi.example
read -rs VECTURA_PASSWORD && export VECTURA_PASSWORD
vectura serve --host esxi.example --user root --vm-id 3 \
  --disk '[datastore1] vm/vm.vmdk' \
  --thumbprint sha256:<the 443 sha256 line printed above>
```

After the last command, standard output is an NBD stream and standard error
is the only place a message for a person appears. An NBD client that can
talk to a child process over its pipes, such as libnbd's `connect_command`,
reads the disk from there. The tutorial below walks through it.

## Documentation

Tutorial, for the first run:

- [Read your first disk](docs/tutorials/read-your-first-disk.md)

How-to guides, one task each:

- [Pin a host certificate](docs/how-to/pin-a-host-certificate.md)
- [Copy a disk to a raw image](docs/how-to/copy-a-disk-to-a-raw-image.md)
- [Drive Vectura from a program](docs/how-to/drive-vectura-from-a-program.md)
- [Tune depth and compression](docs/how-to/tune-depth-and-compression.md)
- [Troubleshoot a session](docs/how-to/troubleshoot-a-session.md)

Reference, the facts:

- [Command line](docs/reference/command-line.md)
- [The NBD export](docs/reference/nbd-export.md)
- [The transcript](docs/reference/transcript.md)
- [Host requirements and limits](docs/reference/host-requirements-and-limits.md)

Explanation, the reasoning:

- [How a disk is read](docs/explanation/how-a-disk-is-read.md)
- [The security model](docs/explanation/security-model.md)
- [Scope and design choices](docs/explanation/scope-and-design-choices.md)

## Development and release

`.github/workflows/vectura.yml` runs `cargo fmt`, `cargo clippy`, the tests,
`cargo deny`, the coverage floor and the binary build on every push that
touches this directory. The pre-commit hook runs `cargo fmt --check` when a
`.rs` file is staged.

A pull request that changes the sources, `Cargo.lock` or a tool version bumps
vectura once, at its end, from this directory, then commits `Cargo.toml`,
`Cargo.lock` and `vectura`:

```sh
scripts/release.sh patch # or minor, major
```

It bumps the version in `Cargo.toml` and `Cargo.lock` and rebuilds the binary
in place of the previous one. If the build or the check of the binary fails,
it puts the version back and can run again. vectura is not released on its
own: the pull request lists the package which bundles the binary in the
packages list of `CHANGELOG.unreleased.md`, and the release of that package
ships the binary as is:

```md
- @xen-orchestra/vmware-explorer patch
```

`tests/bundled_binary.rs` fails when the binary and `Cargo.toml` disagree, or
when the binary lost its executable bit.

The binary in git is the build of its sources: the workflow builds it again
and fails when the two differ by a single byte. A change pushed after the bump
does not bump again: rebuild the binary from this directory and commit it:

```sh
scripts/build.sh .
```

The build is reproducible: `scripts/build.sh` keeps the paths of the machine
out of the binary and refuses any zig or cargo-zigbuild but the versions the
workflow installs. Linux x86_64 machines build the same binary; macOS and
aarch64 hosts are untested.

The build links against glibc 2.31 through zig, whatever the glibc of the
machine, so the binary runs on Debian 11, which XOA appliances still run,
and Ubuntu 20.04. It needs [zig](https://ziglang.org/download/) 0.16.0 and:

```sh
cargo install --locked cargo-zigbuild@0.23.4
```
