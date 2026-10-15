//! Holds the "no escape hatch" rules in place.
//!
//! Every file under `src/` is scanned for lint suppressions and for
//! `.unwrap()` / `.expect(` outside a `#[cfg(test)]` region; `tests/` is not
//! scanned. The scan is textual on purpose: it reads what a reviewer reads.

use std::fs;
use std::path::{Path, PathBuf};

/// A rule violation: which file, which line (1-based), what was found.
#[derive(Debug, PartialEq, Eq)]
struct Finding {
    path: PathBuf,
    line: usize,
    what: &'static str,
}

/// Lint suppressions, refused anywhere in `src/`, test regions included.
///
/// A `cfg_attr` that carries one is refused too; a plain `cfg_attr` is not.
const REFUSED_EVERYWHERE: [&str; 4] = ["#[allow(", "#![allow(", "#[expect(", "#![expect("];

/// Panics on `Option`/`Result`, refused outside `#[cfg(test)]` regions.
const REFUSED_OUTSIDE_TESTS: [&str; 2] = [".unwrap()", ".expect("];

/// The source files to scan: every `.rs` file under `dir`, recursively.
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

/// Scans one file's text and reports every refused construct.
///
/// A `#[cfg(test)]` attribute opens a region, from the next `{` to its matching
/// `}`, exempt from [`REFUSED_OUTSIDE_TESTS`]. Line comments are stripped
/// first. Braces in strings can only lengthen a region, never hide a finding.
fn scan(path: &Path, text: &str) -> Vec<Finding> {
    let mut findings = Vec::new();
    let mut depth = 0_usize;
    let mut region_pending = false;
    let mut in_region = false;

    for (index, raw) in text.lines().enumerate() {
        let code = raw.split("//").next().unwrap_or_default();
        if code.trim_start().starts_with("#[cfg(test)]") {
            region_pending = true;
        }
        for what in REFUSED_EVERYWHERE {
            if code.contains(what) {
                findings.push(Finding {
                    path: path.to_path_buf(),
                    line: index + 1,
                    what,
                });
            }
        }
        if code.contains("cfg_attr(") && (code.contains("allow(") || code.contains("expect(")) {
            findings.push(Finding {
                path: path.to_path_buf(),
                line: index + 1,
                what: "cfg_attr(",
            });
        }
        if !in_region {
            for what in REFUSED_OUTSIDE_TESTS {
                if code.contains(what) {
                    findings.push(Finding {
                        path: path.to_path_buf(),
                        line: index + 1,
                        what,
                    });
                }
            }
        }
        for character in code.chars() {
            match character {
                '{' => {
                    if region_pending {
                        region_pending = false;
                        in_region = true;
                        depth = 0;
                    }
                    depth += 1;
                }
                '}' => {
                    depth = depth.saturating_sub(1);
                    if in_region && depth == 0 {
                        in_region = false;
                    }
                }
                _ => {}
            }
        }
    }
    findings
}

#[test]
fn src_contains_no_forbidden_tool() {
    let src = Path::new(env!("CARGO_MANIFEST_DIR")).join("src");
    let mut findings = Vec::new();
    for path in rust_files(&src) {
        let text =
            fs::read_to_string(&path).unwrap_or_else(|error| panic!("{}: {error}", path.display()));
        findings.extend(scan(&path, &text));
    }

    assert!(
        findings.is_empty(),
        "forbidden constructs under src/ (fix the cause, do not suppress the warning):\n{}",
        findings
            .iter()
            .map(|finding| format!(
                "  {}:{}: {}",
                finding.path.display(),
                finding.line,
                finding.what
            ))
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn a_lint_suppression_is_found_anywhere() {
    let text = "#![allow(dead_code)]\n\n#[cfg(test)]\nmod tests {\n    #[allow(unused)]\n    fn f() {}\n}\n";

    let found: Vec<_> = scan(Path::new("x.rs"), text)
        .into_iter()
        .map(|f| (f.line, f.what))
        .collect();

    assert_eq!(found, [(1, "#![allow("), (5, "#[allow(")]);
}

#[test]
fn a_panic_on_option_is_found_outside_a_test_region_only() {
    let text = "fn f() -> u8 {\n    Some(1).unwrap()\n}\n\n#[cfg(test)]\nmod tests {\n    #[test]\n    fn g() {\n        Some(1).unwrap();\n        Ok::<(), ()>(()).expect(\"fine here\");\n    }\n}\n\nfn h() {\n    None::<u8>.expect(\"back outside\");\n}\n";

    let found: Vec<_> = scan(Path::new("x.rs"), text)
        .into_iter()
        .map(|f| (f.line, f.what))
        .collect();

    assert_eq!(found, [(2, ".unwrap()"), (15, ".expect(")]);
}

#[test]
fn a_cfg_attr_is_refused_only_when_it_carries_a_suppression() {
    let text = "#[cfg_attr(test, derive(PartialEq))]\nstruct A;\n#[cfg_attr(test, allow(dead_code))]\nstruct B;\n";

    let found: Vec<_> = scan(Path::new("x.rs"), text)
        .into_iter()
        .map(|f| (f.line, f.what))
        .collect();

    assert_eq!(found, [(3, "cfg_attr(")]);
}

#[test]
fn a_comment_about_unwrap_is_not_a_finding() {
    let text = "// never call .unwrap() here\nfn f() {} // .expect( in a trailing comment\n";

    assert!(scan(Path::new("x.rs"), text).is_empty());
}
