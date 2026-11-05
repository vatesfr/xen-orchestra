//! Holds the line coverage floor of `src/`.
//!
//! Reads the `cargo llvm-cov` JSON report and compares the line coverage of
//! `src/` (minus `main.rs`) against [`FLOOR_PERCENT`].

use std::fs;
use std::path::Path;

use serde_json::Value;

/// The floor, in whole percent of the lines of `src/`.
///
/// A pull request that drops below it adds tests; the number only goes up.
const FLOOR_PERCENT: u64 = 80;

/// Line totals `(covered, count)` over the files the floor applies to.
fn src_lines(report: &Value, root: &Path) -> (u64, u64) {
    let files = report["data"][0]["files"]
        .as_array()
        .expect("an llvm-cov report lists its files");
    let src = root.join("src");
    let main = src.join("main.rs");
    let mut covered = 0;
    let mut count = 0;
    for file in files {
        let name = Path::new(file["filename"].as_str().expect("a file has a name"));
        if !name.starts_with(&src) || name == main {
            continue;
        }
        let lines = &file["summary"]["lines"];
        covered += lines["covered"]
            .as_u64()
            .expect("covered lines is an integer");
        count += lines["count"].as_u64().expect("line count is an integer");
    }
    (covered, count)
}

#[test]
#[ignore = "needs target/coverage.json from cargo llvm-cov; CI runs it with -- --ignored"]
fn src_line_coverage_meets_the_floor() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let report = fs::read_to_string(root.join("target/coverage.json"))
        .expect("target/coverage.json exists; run cargo llvm-cov first");
    let report: Value = serde_json::from_str(&report).expect("the report is JSON");

    let (covered, count) = src_lines(&report, root);
    if count == 0 {
        // Nothing executable under src/ yet: there is no percentage to hold.
        return;
    }
    let percent = covered * 100 / count;
    assert!(
        covered * 100 >= FLOOR_PERCENT * count,
        "line coverage of src/ is {percent}% ({covered}/{count}), below the {FLOOR_PERCENT}% \
         floor; add tests, do not lower the floor"
    );
}

#[test]
fn main_rs_and_files_outside_src_are_left_out() {
    let root = Path::new("/repo");
    let report = serde_json::json!({ "data": [{ "files": [
        { "filename": "/repo/src/lib.rs", "summary": { "lines": { "covered": 8, "count": 10 } } },
        { "filename": "/repo/src/nfc/record.rs", "summary": { "lines": { "covered": 1, "count": 2 } } },
        { "filename": "/repo/src/main.rs", "summary": { "lines": { "covered": 0, "count": 50 } } },
        { "filename": "/repo/tests/cli.rs", "summary": { "lines": { "covered": 0, "count": 50 } } }
    ] }] });

    assert_eq!(src_lines(&report, root), (9, 12));
}
