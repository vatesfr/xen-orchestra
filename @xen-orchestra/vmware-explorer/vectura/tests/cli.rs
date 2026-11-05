//! Runs the built `vectura` binary the way an operator would.
//!
//! Spawning the real binary covers `main` itself, including in the mutation
//! run.

use std::process::{Command, Output};

fn vectura(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_vectura"))
        .args(args)
        .output()
        .expect("the vectura binary runs")
}

/// Asserts exit 2 with an explanation on standard error and empty standard output.
fn assert_usage_error(output: &Output) {
    assert_eq!(output.status.code(), Some(2), "usage errors exit with 2");
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.starts_with("vectura: "),
        "the explanation goes to standard error: {stderr}"
    );
    assert!(
        output.stdout.is_empty(),
        "nothing is written to standard output"
    );
}

#[test]
fn running_without_a_command_is_a_usage_error() {
    assert_usage_error(&vectura(&[]));
}

#[test]
fn an_unknown_flag_is_a_usage_error() {
    let output = vectura(&["fingerprint", "--host", "esxi.test", "--bogus"]);
    assert_usage_error(&output);
    assert!(String::from_utf8_lossy(&output.stderr).contains("--bogus"));
}

#[test]
fn a_host_with_an_unparsable_port_is_a_usage_error() {
    let output = vectura(&["fingerprint", "--host", "esxi.test:notaport"]);
    assert_usage_error(&output);
    assert!(String::from_utf8_lossy(&output.stderr).contains("notaport"));
}

#[test]
fn help_goes_to_standard_output_and_succeeds() {
    let output = vectura(&["--help"]);
    assert_eq!(output.status.code(), Some(0));
    assert!(String::from_utf8_lossy(&output.stdout).contains("fingerprint"));
    assert!(output.stderr.is_empty());
}

#[test]
fn a_depth_outside_one_to_thirty_two_is_a_usage_error() {
    for depth in ["0", "33"] {
        let output = vectura(&[
            "serve",
            "--host",
            "esxi.test",
            "--user",
            "root",
            "--vm-id",
            "1",
            "--disk",
            "d",
            "--depth",
            depth,
        ]);
        assert_usage_error(&output);
        let stderr = String::from_utf8_lossy(&output.stderr);
        assert!(
            stderr.contains(&format!("{depth} is not in 1..=32")),
            "{stderr}"
        );
    }
}

#[test]
fn the_serve_help_says_the_depth_limit_is_shared_per_host() {
    let output = vectura(&["serve", "--help"]);
    assert_eq!(output.status.code(), Some(0));
    let help = String::from_utf8_lossy(&output.stdout);
    assert!(help.contains("--depth <DEPTH>"), "{help}");
    assert!(help.contains("per host"), "{help}");
}

#[test]
fn a_transport_other_than_nfcssl_or_nfc_is_a_usage_error() {
    let output = vectura(&[
        "serve",
        "--host",
        "esxi.test",
        "--user",
        "root",
        "--vm-id",
        "1",
        "--disk",
        "d",
        "--transport",
        "tcp",
    ]);
    assert_usage_error(&output);
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(stderr.contains("tcp is not nfcssl or nfc"), "{stderr}");
}

#[test]
fn the_serve_help_lists_the_transport_defaulting_to_nfcssl_and_the_verbose_flag() {
    let output = vectura(&["serve", "--help"]);
    assert_eq!(output.status.code(), Some(0));
    let help = String::from_utf8_lossy(&output.stdout);
    assert!(help.contains("--transport <TRANSPORT>"), "{help}");
    assert!(help.contains("[default: nfcssl]"), "{help}");
    assert!(help.contains("--verbose"), "{help}");
    assert!(help.contains("[default: 16]"), "{help}");
}

#[test]
fn a_compression_other_than_skipz_zlib_or_none_is_a_usage_error() {
    let output = vectura(&[
        "serve",
        "--host",
        "esxi.test",
        "--user",
        "root",
        "--vm-id",
        "1",
        "--disk",
        "d",
        "--compression",
        "gzip",
    ]);
    assert_usage_error(&output);
    let stderr = String::from_utf8_lossy(&output.stderr);
    assert!(
        stderr.contains("gzip is not none, zlib or skipz"),
        "{stderr}"
    );
}

#[test]
fn the_serve_help_lists_the_three_compressions_with_skipz_as_default() {
    let output = vectura(&["serve", "--help"]);
    assert_eq!(output.status.code(), Some(0));
    let help = String::from_utf8_lossy(&output.stdout);
    for text in [
        "--compression <COMPRESSION>",
        "skipz",
        "zlib",
        "none",
        "[default: skipz]",
    ] {
        assert!(help.contains(text), "{text}: {help}");
    }
}
