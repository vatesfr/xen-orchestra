//! Runs `vectura fingerprint` against a mock host on loopback.

use std::net::TcpListener;
use std::process::{Command, Output};

use crate::support::{DataPort, GREETING, GREETING_WITHOUT_SHA256, Host, Observed, Scenario, text};

/// Runs the built binary with `args` and waits for it.
fn vectura(args: &[&str]) -> Output {
    Command::new(env!("CARGO_BIN_EXE_vectura"))
        .args(args)
        .output()
        .expect("the vectura binary runs")
}

/// Runs `vectura fingerprint` against `host`.
fn fingerprint(host: &Host, verbose: bool) -> Output {
    let management = format!("127.0.0.1:{}", host.management_port);
    let data = host.data_port.to_string();
    let mut args = vec!["fingerprint", "--host", &management, "--nfc-port", &data];
    if verbose {
        args.push("--verbose");
    }
    vectura(&args)
}

/// The four lines `fingerprint` must print for `host`, management port first.
fn expected_stdout(host: &Host) -> String {
    let (sha256, sha1) = (host.sha256(), host.sha1());
    let (management, data) = (host.management_port, host.data_port);
    format!(
        "{management} sha256 {sha256}\n{management} sha1 {sha1}\n\
         {data} sha256 {sha256}\n{data} sha1 {sha1}\n"
    )
}

/// The verbose line for `port`, built from what the mock negotiated.
fn verbose_line(port: u16, observed: &Observed) -> String {
    let version = observed
        .version
        .as_deref()
        .expect("a version was negotiated");
    let suite = observed.suite.as_deref().expect("a suite was negotiated");
    format!("{port} tls {version} {suite}\n")
}

/// A loopback port nobody listens on, released again before the test uses it.
fn refused_port() -> u16 {
    TcpListener::bind("127.0.0.1:0")
        .expect("loopback is bindable")
        .local_addr()
        .expect("the listener has an address")
        .port()
}

/// Asserts exit 1 with nothing on standard output and returns the explanation.
///
/// The explanation starts with `vectura: <address>: `, naming the port that failed.
fn failure_naming(output: &Output, address: &str) -> String {
    assert_eq!(output.status.code(), Some(1));
    assert!(output.stdout.is_empty(), "stdout: {}", text(&output.stdout));
    let stderr = text(&output.stderr);
    assert!(
        stderr.starts_with(&format!("vectura: {address}: ")),
        "{stderr}"
    );
    stderr
}

#[test]
fn fingerprint_prints_both_thumbprints_management_port_first() {
    let host = Host::with_data_port(DataPort::Greeting(GREETING));

    let output = fingerprint(&host, false);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(text(&output.stdout), expected_stdout(&host));
    assert!(output.stderr.is_empty(), "stderr: {}", text(&output.stderr));
    for observed in [host.management(), host.data()] {
        assert!(observed.handshake_completed, "{observed:?}");
        assert_eq!(
            observed.bytes_after_tls_handshake, 0,
            "nothing is sent after the TLS handshake: {observed:?}"
        );
    }
}

#[test]
fn verbose_adds_the_negotiated_version_and_suite_on_standard_error_only() {
    let host = Host::with_data_port(DataPort::Greeting(GREETING));

    let output = fingerprint(&host, true);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(text(&output.stdout), expected_stdout(&host));
    let expected = verbose_line(host.management_port, &host.management())
        + &verbose_line(host.data_port, &host.data());
    assert_eq!(text(&output.stderr), expected);
}

#[test]
fn a_greeting_without_sha256_support_is_fingerprinted_like_any_other() {
    let host = Host::with_data_port(DataPort::Greeting(GREETING_WITHOUT_SHA256));

    let output = fingerprint(&host, false);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(text(&output.stdout), expected_stdout(&host));
    assert!(host.data().handshake_completed, "{:?}", host.data());
}

#[test]
fn a_host_that_closes_without_a_greeting_fails_naming_the_greeting() {
    let host = Host::with_data_port(DataPort::Silent);

    let output = fingerprint(&host, false);

    let stderr = failure_naming(&output, &format!("127.0.0.1:{}", host.data_port));
    assert!(stderr.contains("greeting"), "{stderr}");
}

#[test]
fn a_refused_management_port_fails_naming_its_address() {
    let address = format!("127.0.0.1:{}", refused_port());

    let output = vectura(&["fingerprint", "--host", &address]);

    let stderr = failure_naming(&output, &address);
    assert!(stderr.contains("connect"), "{stderr}");
}

#[test]
fn a_refused_data_port_fails_naming_its_address() {
    let host = Host::with_data_port(DataPort::Greeting(GREETING));
    let management = format!("127.0.0.1:{}", host.management_port);
    let data = refused_port();

    let output = vectura(&[
        "fingerprint",
        "--host",
        &management,
        "--nfc-port",
        &data.to_string(),
    ]);

    failure_naming(&output, &format!("127.0.0.1:{data}"));
    assert!(host.management().handshake_completed);
}

/// A host whose data port accepts `suites` alone, like an ESXi 6.5 one.
fn restricted_to(suites: &'static str) -> Host {
    Host::start(Scenario {
        data: DataPort::Greeting(GREETING_WITHOUT_SHA256),
        data_suites: Some(suites),
        ..Scenario::default()
    })
}

#[test]
fn an_rsa_only_data_port_is_fingerprinted_through_the_fallback() {
    let host = restricted_to("AES256-GCM-SHA384");

    let output = fingerprint(&host, true);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(text(&output.stdout), expected_stdout(&host));
    let refused = host.data();
    assert!(
        refused.handshake_started && !refused.handshake_completed,
        "the ECDHE offer is refused first: {refused:?}"
    );
    let accepted = host.data();
    assert_eq!(
        accepted.suite.as_deref(),
        Some("TLS_RSA_WITH_AES_256_GCM_SHA384")
    );
    assert_eq!(
        accepted.bytes_after_tls_handshake, 0,
        "nothing is sent after the TLS handshake: {accepted:?}"
    );
    let expected = verbose_line(host.management_port, &host.management())
        + &format!(
            "{} tls fallback: host refused ECDHE, retrying with RSA key exchange\n",
            host.data_port
        )
        + &verbose_line(host.data_port, &accepted);
    assert_eq!(text(&output.stderr), expected);
}

#[test]
fn a_data_port_with_no_common_suite_fails_naming_the_cause() {
    // CBC with RSA key exchange: neither rustls nor the fallback offers it.
    let host = restricted_to("AES256-SHA256");

    let output = fingerprint(&host, false);

    let stderr = failure_naming(&output, &format!("127.0.0.1:{}", host.data_port));
    assert!(
        stderr.contains(
            "host refused every supported TLS suite (ECDHE, then RSA key exchange with AES-GCM)"
        ),
        "{stderr}"
    );
    assert!(!stderr.contains("HandshakeFailure"), "{stderr}");
    for _ in 0..2 {
        let refused = host.data();
        assert!(!refused.handshake_completed, "{refused:?}");
    }
}
