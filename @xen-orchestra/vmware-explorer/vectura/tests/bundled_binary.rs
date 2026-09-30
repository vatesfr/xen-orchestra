//! Holds the binary that ships next to the sources.
//!
//! `@xen-orchestra/vmware-explorer` runs the `vectura` binary of the crate
//! root, so it is the build of the version of Cargo.toml and it stays
//! executable. scripts/release.sh bumps the version and rebuilds the binary
//! in the same commit.

#![cfg(all(target_os = "linux", target_arch = "x86_64"))]

use std::path::Path;
use std::process::Command;

#[test]
fn the_binary_at_the_crate_root_runs_as_this_version() {
    let binary = Path::new(env!("CARGO_MANIFEST_DIR")).join("vectura");

    let output = Command::new(&binary)
        .arg("--version")
        .output()
        .expect("the binary at the crate root runs");

    assert_eq!(
        String::from_utf8_lossy(&output.stdout),
        format!("vectura {}\n", env!("CARGO_PKG_VERSION")),
        "release with `scripts/bump-pkg vectura <type>` rather than editing the version by hand"
    );
}
