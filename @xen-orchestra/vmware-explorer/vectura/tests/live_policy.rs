//! Holds the live tests to their rules: ignored, and in one file.
//!
//! The live tests reach the lab hosts, so they must stay out of every
//! `cargo test` that lacks `--ignored`, and stay in the one file this test
//! reads.

use std::fs;
use std::path::{Path, PathBuf};

/// The one file that may read the lab.
const LIVE: &str = "tests/process/live.rs";

/// The text of the file at `relative`, from the crate root.
fn read(relative: &Path) -> String {
    let path = Path::new(env!("CARGO_MANIFEST_DIR")).join(relative);
    fs::read_to_string(&path).unwrap_or_else(|error| panic!("{}: {error}", path.display()))
}

/// Every `.rs` file under `dir`, recursively, sorted.
fn rust_files(dir: &Path) -> Vec<PathBuf> {
    let mut files = Vec::new();
    let entries = fs::read_dir(dir).unwrap_or_else(|error| panic!("{}: {error}", dir.display()));
    for entry in entries {
        let path = entry.expect("directory entry is readable").path();
        if path.is_dir() {
            files.extend(rust_files(&path));
        } else if path.extension().is_some_and(|extension| extension == "rs") {
            files.push(path);
        }
    }
    files.sort();
    files
}

#[test]
fn every_live_test_is_ignored() {
    let live = read(Path::new(LIVE));
    let tests = live
        .match_indices("#[test]")
        .map(|(at, _)| at)
        .collect::<Vec<_>>();
    assert!(!tests.is_empty(), "{LIVE} holds no test");
    for at in tests {
        let next = live[at + "#[test]".len()..].trim_start();
        assert!(
            next.starts_with("#[ignore"),
            "the test at byte {at} of {LIVE} is not ignored"
        );
    }
}

#[test]
fn no_source_outside_the_live_file_reads_the_lab() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let files = rust_files(&root.join("src"))
        .into_iter()
        .chain(rust_files(&root.join("tests")));
    for path in files {
        if path.ends_with(LIVE) || path.ends_with(file!()) {
            continue;
        }
        let text =
            fs::read_to_string(&path).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
        assert!(
            !text.contains("VECTURA_LAB_"),
            "{} reads the lab outside {LIVE}",
            path.display()
        );
    }
}
