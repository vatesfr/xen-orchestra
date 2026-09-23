//! Holds the Debian package that ships next to the sources.
//!
//! `@xen-orchestra/vmware-explorer` installs the one `vectura_*.deb` of the
//! crate root and compares its version with `vectura --version`, so there is
//! exactly one, built from the version of Cargo.toml. scripts/release.sh
//! bumps the version and rebuilds the package in the same commit.

use std::fs;
use std::path::Path;

#[test]
fn one_package_of_this_version_sits_at_the_crate_root() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let mut packages: Vec<_> = fs::read_dir(root)
        .expect("the crate root is readable")
        .map(|entry| entry.expect("directory entry is readable").path())
        .filter(|path| path.extension().is_some_and(|extension| extension == "deb"))
        .map(|path| {
            path.file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned()
        })
        .collect();
    packages.sort();

    assert_eq!(
        packages,
        [format!("vectura_{}-1_amd64.deb", env!("CARGO_PKG_VERSION"))],
        "release with `scripts/bump-pkg vectura <type>` rather than editing the version by hand"
    );
}
