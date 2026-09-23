# Vectura

Vectura reads VMware virtual disks over the NFC protocol. It is one Linux
binary, shipped as a Debian package, with two commands:

- `vectura serve` logs in to an ESXi host, opens one virtual disk and serves
  it read-only as an NBD export on its own standard input and output. The
  program that spawned it reads any range of the disk, in any order, and
  ends the session when it is done.
- `vectura fingerprint` prints the certificate thumbprints a host presents
  on its management and data ports, so an operator can pin them before any
  credential is sent.

Vectura targets ESXi 7.x and 8.x hosts reached directly. A vCenter address
is refused before login; an ESXi 6.x host is refused at the data port's
greeting. Certificate verification can be pinned or pointed at a CA bundle
but never skipped, and the password is read from `VECTURA_PASSWORD` only.

## Install

The package, `vectura_<version>-1_amd64.deb`, ships in this directory with
`@xen-orchestra/vmware-explorer`, and xo-server installs it. To install it by
hand on Debian 12, Ubuntu 22.04 or newer (amd64):

```sh
sudo dpkg --install vectura_<version>-1_amd64.deb
```

The package installs `/usr/bin/vectura`. To build from source, install the
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
`cargo deny`, the coverage floor and the package build on every push that
touches this directory. The pre-commit hook runs `cargo fmt --check` when a
`.rs` file is staged.

A change to vectura needs its own line in the packages list of
`CHANGELOG.unreleased.md`:

```md
- vectura patch
```

`scripts/gen-deps-list.js` then lists `./scripts/bump-pkg vectura <type>`,
followed by a release of `@xen-orchestra/vmware-explorer`, which bundles the
package. `bump-pkg` runs `scripts/release.sh`: it bumps the version in
`Cargo.toml` and `Cargo.lock`, rebuilds the package in place of the previous
one and commits both as `feat(vectura): <version>`.
`tests/bundled_package.rs` fails when the package and `Cargo.toml` disagree.

The build links against glibc 2.34 through zig, whatever the glibc of the
machine, so the package installs on Debian 12 and Ubuntu 22.04. It needs
[zig](https://ziglang.org/download/) (0.16.0 tested), `dpkg-dev` and:

```sh
cargo install --locked cargo-zigbuild@0.23.4 cargo-deb@3.7.0
```
