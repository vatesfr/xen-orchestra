//! Runs `vectura serve` against a mock host on loopback and speaks NBD to it.

use std::fs;
use std::io::Write;
use std::process::{Child, ChildStdin, ChildStdout, Command, Output, Stdio};
use std::thread;
use std::time::Duration;

use crate::support::nbd::{self, Export, Info};
use crate::support::{
    COOKIE, DataPort, Event, GREETING_WITHOUT_NFCSSL, GREETING_WITHOUT_SHA256, HANDSHAKE_ERROR,
    HOLD_PATIENCE, Host, MSG_MODE, MSG_NAME, MSG_READY, MSG_TAG, MSG_TAG_END, MSG_VERSION,
    OP_CAPABILITIES, OP_CLOSE, OP_END, OP_HELLO, OP_OPEN, OP_VERSION, Observed, ReadFault,
    Scenario, TICKET, Thumbprint, disk_byte, disk_bytes, text, thumbprint,
};

const USER: &str = "root";
const PASSWORD: &str = "hunter2-mock-password";
const VM: &str = "vm-12";
const DISK: &str = "[datastore1] vm/vm.vmdk";
/// Transmission flags: `NBD_FLAG_HAS_FLAGS` and `NBD_FLAG_READ_ONLY`.
pub(super) const READ_ONLY: u16 = 1 | 2;
/// The mebibyte no host read straddles.
const MIB: u64 = 1 << 20;
/// The sector every host read is cut on.
pub(super) const SECTOR: u64 = 512;
/// Four mebibytes and three sectors: a partial last read, small enough to read whole.
const SMALL: u64 = 4 * MIB + 3 * SECTOR;
/// `NBD_EIO`.
const EIO: u32 = 5;
/// The depth `serve` keeps without `--depth`.
const DEFAULT_DEPTH: u8 = 16;
/// The block sizes the export advertises: a sector, a mebibyte, thirty-two mebibytes.
const BLOCK_SIZES: (u32, u32, u32) = (512, 1 << 20, 1 << 25);

/// The `--thumbprint` argument pinning `host`'s certificate.
fn pin(host: &Host) -> Vec<String> {
    vec![
        "--thumbprint".to_owned(),
        format!("sha256:{}", host.sha256()),
    ]
}

/// The pin plus `extra` arguments.
fn pinned(host: &Host, extra: &[&str]) -> Vec<String> {
    let mut arguments = pin(host);
    arguments.extend(extra.iter().map(|argument| (*argument).to_owned()));
    arguments
}

/// The pin plus `--depth`.
fn pinned_at_depth(host: &Host, depth: u8) -> Vec<String> {
    pinned(host, &["--depth", &depth.to_string()])
}

/// Spawns `vectura serve` on pipes, with `password` in the environment if given.
fn spawn(host: &Host, password: Option<&str>, trust: &[String]) -> Child {
    serve_command(host, password, trust)
        .spawn()
        .expect("the vectura binary runs")
}

/// The `vectura serve` command on pipes, with `password` in the environment if given.
fn serve_command(host: &Host, password: Option<&str>, trust: &[String]) -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_vectura"));
    command
        .args([
            "serve",
            "--host",
            &format!("127.0.0.1:{}", host.management_port),
            "--user",
            USER,
            "--vm-id",
            VM,
            "--disk",
            DISK,
        ])
        .args(trust)
        .env_remove("VECTURA_PASSWORD")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    if let Some(password) = password {
        command.env("VECTURA_PASSWORD", password);
    }
    command
}

/// Runs `talk` on the child's pipes: standard output to read, standard input to write.
fn pipes<T>(child: &mut Child, talk: impl FnOnce(&mut ChildStdout, &mut ChildStdin) -> T) -> T {
    let input = child.stdout.as_mut().expect("stdout is piped");
    let output = child.stdin.as_mut().expect("stdin is piped");
    talk(input, output)
}

/// Negotiates the export on the child's pipes.
pub(super) fn negotiate(child: &mut Child, no_zeroes: bool) -> Export {
    pipes(child, |input, output| {
        nbd::negotiate(input, output, no_zeroes)
    })
}

/// Reads the greeting and answers it; returns whether the export will be padded.
fn handshake(child: &mut Child, no_zeroes: bool) -> bool {
    pipes(child, |input, output| {
        nbd::handshake(input, output, no_zeroes)
    })
}

/// Sends `NBD_OPT_INFO` or `NBD_OPT_GO` on the child's pipes.
fn info(child: &mut Child, kind: u32, name: &[u8], requests: &[u16]) -> Result<Info, u32> {
    pipes(child, |input, output| {
        nbd::info(input, output, kind, name, requests)
    })
}

/// Sends a request without payload on the child's pipes and returns its error.
fn command(child: &mut Child, flags: u16, kind: u16, cookie: u64, offset: u64, length: u32) -> u32 {
    pipes(child, |input, output| {
        nbd::command(input, output, flags, kind, cookie, offset, length)
    })
}

/// Reads `length` bytes at `offset` on the child's pipes.
pub(super) fn read_at(
    child: &mut Child,
    cookie: u64,
    offset: u64,
    length: u64,
) -> Result<Vec<u8>, u32> {
    let input = child.stdout.as_mut().expect("stdout is piped");
    let output = child.stdin.as_mut().expect("stdin is piped");
    let length = u32::try_from(length).expect("a length a request can carry");
    nbd::read_at(input, output, cookie, offset, length)
}

/// The bytes the mock disk holds at `offset`.
fn disk(offset: u64, length: u64) -> Vec<u8> {
    disk_bytes(offset, length)
}

/// Asserts `data` holds the disk's `length` bytes from `offset`, naming the first difference.
fn matches_disk(data: &Result<Vec<u8>, u32>, offset: u64, length: u64) {
    let data = data.as_ref().expect("the read succeeded");
    assert_eq!(u64::try_from(data.len()).unwrap(), length);
    let differs = data
        .iter()
        .enumerate()
        .find(|(index, byte)| **byte != disk_byte(offset + u64::try_from(*index).unwrap()))
        .map(|(index, _)| index);
    assert_eq!(
        differs, None,
        "byte differing from the disk at {offset} + index"
    );
}

/// Sends every read at once and collects the replies in the order they arrive.
///
/// Each read is (cookie, offset, length); each reply is the cookie with the
/// bytes read or the error.
fn read_together(child: &mut Child, reads: &[(u64, u64, u32)]) -> Vec<(u64, Result<Vec<u8>, u32>)> {
    let expected = reads
        .iter()
        .map(|&(cookie, _, length)| (cookie, length))
        .collect::<Vec<_>>();
    pipes(child, |input, output| {
        nbd::requests(output, reads);
        nbd::replies(input, &expected)
    })
}

/// The most host reads the mock held unanswered at once.
fn most_in_flight(events: &[Event]) -> usize {
    let mut now = 0;
    let mut most = 0;
    for event in events {
        match event {
            Event::Read { .. } => {
                now += 1;
                most = most.max(now);
            }
            Event::Answered { .. } => now -= 1,
            _ => {}
        }
    }
    most
}

/// The sequence of every read record, in the order the mock saw them.
fn read_sequences(events: &[Event]) -> Vec<u32> {
    events
        .iter()
        .filter_map(|event| match event {
            Event::Read { sequence, .. } => Some(*sequence),
            _ => None,
        })
        .collect()
}

pub(super) fn disconnect(child: &mut Child) {
    nbd::disconnect(child.stdin.as_mut().expect("stdin is piped"));
}

/// Closes the child's standard input, waits for it, and collects both streams.
pub(super) fn finish(child: Child) -> Output {
    child.wait_with_output().expect("the child exits")
}

/// Runs `scenario` pinned, expecting the child to fail before any NBD session.
fn run_failing(scenario: Scenario) -> (Host, Output) {
    let host = Host::start(scenario);
    let output = finish(spawn(&host, Some(PASSWORD), &pin(&host)));
    (host, output)
}

/// Asserts exit 1 with nothing on standard output and returns the explanation.
fn failure(output: &Output) -> String {
    assert_eq!(
        output.status.code(),
        Some(1),
        "stderr: {}",
        text(&output.stderr)
    );
    assert!(
        output.stdout.is_empty(),
        "bytes on standard output: {:?}",
        output.stdout
    );
    let stderr = text(&output.stderr);
    assert!(stderr.starts_with("vectura: "), "{stderr}");
    stderr
}

/// Asserts neither stream shows the password, the ticket or the cookie.
fn secrets_absent(output: &Output) {
    let all = text(&output.stderr) + &String::from_utf8_lossy(&output.stdout);
    for secret in [PASSWORD, TICKET, "mock-cookie"] {
        assert!(!all.contains(secret), "{secret:?} leaked: {all}");
    }
}

/// Runs `scenario` to its failure and asserts the session was still logged out.
fn fails_then_logs_out(scenario: Scenario) -> (Host, String) {
    let (host, output) = run_failing(scenario);
    let stderr = failure(&output);
    secrets_absent(&output);
    assert_eq!(
        host.events().last(),
        Some(&call("Logout", Some(COOKIE))),
        "{:?}",
        host.events()
    );
    (host, stderr)
}

fn call(name: &str, cookie: Option<&str>) -> Event {
    Event::Call {
        name: name.to_owned(),
        cookie: cookie.map(str::to_owned),
        vm: None,
        credentials: None,
    }
}

fn record(opcode: u32, sequence: u32) -> Event {
    Event::Record {
        opcode,
        sequence,
        path: None,
    }
}

/// What a healthy session over `transport` records, in order, through the open record.
fn events_up_to_open(transport: &str) -> Vec<Event> {
    vec![
        call("RetrieveServiceContent", None),
        Event::Call {
            name: "Login".to_owned(),
            cookie: None,
            vm: None,
            credentials: Some((USER.to_owned(), PASSWORD.to_owned())),
        },
        call("RetrieveInternalContent", Some(COOKIE)),
        Event::Call {
            name: "NfcGetVmFiles".to_owned(),
            cookie: Some(COOKIE.to_owned()),
            vm: Some(VM.to_owned()),
            credentials: None,
        },
        Event::Session(TICKET.to_owned()),
        Event::Banner,
        Event::Thumbprint,
        Event::Proxy(transport.to_owned()),
        Event::Handshake(MSG_TAG),
        Event::Handshake(MSG_TAG_END),
        Event::Handshake(MSG_VERSION),
        Event::Handshake(MSG_NAME),
        Event::Client {
            name: "vectura".to_owned(),
            operation: "nbdmode".to_owned(),
        },
        Event::Handshake(MSG_MODE),
        Event::Handshake(MSG_READY),
        record(OP_HELLO, 0),
        record(OP_VERSION, 1),
        record(OP_CAPABILITIES, 2),
        Event::Record {
            opcode: OP_OPEN,
            sequence: 3,
            path: Some(DISK.to_owned()),
        },
    ]
}

#[test]
fn a_disk_is_exported_read_only_with_the_capacity_the_host_reported() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    let export = negotiate(&mut child, false);
    disconnect(&mut child);
    let output = finish(child);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert!(output.stderr.is_empty(), "stderr: {}", text(&output.stderr));
    assert!(
        output.stdout.is_empty(),
        "bytes after the disconnect: {:?}",
        output.stdout
    );
    assert_eq!(
        export,
        Export {
            size: Scenario::default().capacity,
            flags: READ_ONLY,
            padded: true,
        }
    );
    healthy_session(&host.events(), 0);
}

#[test]
fn a_client_asking_no_zeroes_gets_the_export_without_padding() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    let export = negotiate(&mut child, true);
    disconnect(&mut child);
    let output = finish(child);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(
        export,
        Export {
            size: Scenario::default().capacity,
            flags: READ_ONLY,
            padded: false,
        }
    );
}

#[test]
fn a_ca_file_holding_the_host_certificate_is_trusted() {
    let host = Host::start(Scenario::default());
    let path = std::env::temp_dir().join(format!("vectura-serve-{}.pem", std::process::id()));
    fs::write(&path, host.pem()).expect("the bundle is written");
    let trust = ["--ca-file".to_owned(), path.display().to_string()];
    let mut child = spawn(&host, Some(PASSWORD), &trust);

    let export = negotiate(&mut child, false);
    disconnect(&mut child);
    let output = finish(child);
    let _ = fs::remove_file(&path);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(export.size, Scenario::default().capacity);
}

#[test]
fn a_self_signed_host_is_refused_without_a_thumbprint_or_ca_file() {
    let host = Host::start(Scenario::default());

    let output = finish(spawn(&host, Some(PASSWORD), &[]));

    let stderr = failure(&output);
    assert!(
        stderr.starts_with("vectura: management plane: "),
        "{stderr}"
    );
    assert!(
        host.events().is_empty(),
        "no call was made: {:?}",
        host.events()
    );
}

#[test]
fn a_thumbprint_that_is_not_the_management_certificate_is_refused() {
    let host = Host::start(Scenario::default());
    let other = thumbprint(&aws_lc_rs::digest::SHA256, b"some other certificate");
    let trust = ["--thumbprint".to_owned(), format!("sha256:{other}")];

    let output = finish(spawn(&host, Some(PASSWORD), &trust));

    let stderr = failure(&output);
    assert!(
        stderr.contains("management plane: certificate thumbprint mismatch"),
        "{stderr}"
    );
    assert!(
        host.events().is_empty(),
        "no call was made: {:?}",
        host.events()
    );
}

#[test]
fn a_vcenter_serves_the_disk_from_the_host_its_ticket_names() {
    // The data port listens on the ticket's host only, not on the vCenter's address.
    let host = Host::start(Scenario {
        vcenter: true,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    assert_eq!(read_at(&mut child, 0, 0, SECTOR), Ok(disk(0, SECTOR)));
    let events = session_ends_cleanly(&host, child);

    healthy_session(&events, 1);
}

#[test]
fn a_refused_login_reports_the_fault_without_the_password() {
    let fault = "Cannot complete login due to an incorrect user name or password.";
    let (host, output) = run_failing(Scenario {
        login: Err(fault),
        ..Scenario::default()
    });

    let stderr = failure(&output);
    assert!(
        stderr.contains(&format!("Login: the host answered: {fault}")),
        "{stderr}"
    );
    secrets_absent(&output);
    let events = host.events();
    assert_eq!(
        events.len(),
        2,
        "no call after the refused login: {events:?}"
    );
}

#[test]
fn a_missing_password_is_a_usage_error_before_any_connection() {
    let host = Host::start(Scenario::default());

    let output = finish(spawn(&host, None, &pin(&host)));

    assert_eq!(
        output.status.code(),
        Some(2),
        "stderr: {}",
        text(&output.stderr)
    );
    assert!(output.stdout.is_empty());
    assert!(
        text(&output.stderr).contains("VECTURA_PASSWORD is not set"),
        "{}",
        text(&output.stderr)
    );
    assert!(host.events().is_empty(), "{:?}", host.events());
}

#[test]
fn a_ticket_thumbprint_that_is_not_the_data_port_certificate_aborts_the_first_tls_session() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        ticket_thumbprint: Thumbprint::Other,
        ..Scenario::default()
    });

    assert!(
        stderr.starts_with("vectura: data plane: certificate thumbprint mismatch"),
        "{stderr}"
    );
    assert!(
        !host.events().contains(&Event::Session(TICKET.to_owned())),
        "the ticket was never presented: {:?}",
        host.events()
    );
}

#[test]
fn a_greeting_without_sha256_support_is_refused_and_the_session_logged_out() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        data: DataPort::Greeting(GREETING_WITHOUT_SHA256),
        ..Scenario::default()
    });

    assert!(
        stderr.contains("greeting: the host does not announce \"SHA256 supported\""),
        "{stderr}"
    );
    assert!(
        !host.data().handshake_started,
        "no TLS is started on the data port"
    );
}

#[test]
fn a_proxy_reply_other_than_connect_is_refused() {
    let (_, stderr) = fails_then_logs_out(Scenario {
        proxy_reply: Some("500 Cannot proxy"),
        ..Scenario::default()
    });

    assert!(
        stderr.contains("dialogue: PROXY nfcssl was answered \"500 Cannot proxy\""),
        "{stderr}"
    );
}

#[test]
fn an_announced_thumbprint_that_is_not_the_certificate_is_refused_before_proxy() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        announced_thumbprint: Thumbprint::Other,
        ..Scenario::default()
    });

    assert!(
        stderr.contains("dialogue: the host announced thumbprint sha256:"),
        "{stderr}"
    );
    assert!(
        !host
            .events()
            .iter()
            .any(|event| matches!(event, Event::Proxy(_))),
        "{:?}",
        host.events()
    );
}

#[test]
fn a_handshake_error_reply_is_refused_naming_the_handshake() {
    let (_, stderr) = fails_then_logs_out(Scenario {
        version_reply: HANDSHAKE_ERROR,
        ..Scenario::default()
    });

    assert!(
        stderr.contains("handshake: expected a type 51 reply, the host sent type 4"),
        "{stderr}"
    );
}

#[test]
fn an_open_the_host_refuses_is_reported_with_its_status_and_the_session_ended() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        open_status: 3,
        ..Scenario::default()
    });

    assert!(
        stderr.contains(&format!("open {DISK:?}: the host returned status 3")),
        "{stderr}"
    );
    let events = host.events();
    assert!(
        events.contains(&record(OP_END, 4)),
        "the session is ended: {events:?}"
    );
    assert!(
        !events.iter().any(|event| matches!(
            event,
            Event::Record {
                opcode: OP_CLOSE,
                ..
            }
        )),
        "nothing to close: {events:?}"
    );
}

/// The text an ESXi host puts in its error record when the ticket does not cover the disk.
const OPEN_ERROR: &str = concat!(
    "NfcAioProcessOpenFileMsg: permission check failed ",
    "for file '[datastore1] vm/vm.vmdk', access = 1"
);

#[test]
fn an_open_the_host_refuses_with_an_error_record_is_reported_with_its_text_and_the_session_ended() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        open_error: Some((11, OPEN_ERROR)),
        ..Scenario::default()
    });

    assert_eq!(
        stderr,
        format!("vectura: data plane: open {DISK:?}: the host reported error 11: {OPEN_ERROR}\n")
    );
    let events = host.events();
    assert!(
        events.contains(&record(OP_END, 4)),
        "the session is ended: {events:?}"
    );
    assert!(
        !events.iter().any(|event| matches!(
            event,
            Event::Record {
                opcode: OP_CLOSE,
                ..
            }
        )),
        "nothing to close: {events:?}"
    );
}

#[test]
fn a_client_that_leaves_before_disconnecting_is_an_error_after_the_teardown() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    negotiate(&mut child, false);
    drop(child.stdin.take());
    let output = finish(child);

    let stderr = failure(&output);
    assert!(
        stderr.contains("the nbd client left without disconnecting"),
        "{stderr}"
    );
    healthy_session(&host.events(), 0);
}

/// The host reads the mock saw, as (offset, length), each checked for shape.
///
/// A host read starts and ends on a sector, holds at most a mebibyte, stays
/// within one mebibyte of the disk and never reaches past `capacity`.
fn host_reads(events: &[Event], capacity: u64) -> Vec<(u64, u64)> {
    let reads: Vec<(u64, u64)> = events
        .iter()
        .filter_map(|event| match event {
            Event::Read { offset, length, .. } => Some((*offset, u64::from(*length))),
            _ => None,
        })
        .collect();
    for (offset, length) in &reads {
        let end = offset + length;
        assert_eq!(offset % SECTOR, 0, "read at {offset} starts mid-sector");
        assert_eq!(end % SECTOR, 0, "read at {offset} ends mid-sector at {end}");
        assert!(*length > 0, "empty read at {offset}");
        assert!(*length <= MIB, "read at {offset} asks {length} bytes");
        assert_eq!(
            offset / MIB,
            (end - 1) / MIB,
            "read at {offset} for {length} bytes straddles a mebibyte"
        );
        assert!(
            end <= capacity,
            "read at {offset} for {length} bytes reaches past {capacity}"
        );
    }
    reads
}

/// Asserts the handshake, `reads` host reads, then close, end and logout.
fn healthy_session(events: &[Event], reads: usize) {
    healthy_session_over(events, reads, "nfcssl");
}

/// [`healthy_session`] for a session that asked `PROXY <transport>`.
fn healthy_session_over(events: &[Event], reads: usize, transport: &str) {
    let open = events_up_to_open(transport);
    let count = u32::try_from(reads).expect("a handful of reads");
    let mut expected = open.clone();
    // Each read is two events: the record as it came, then its answer.
    expected.extend(events.iter().skip(open.len()).take(2 * reads).cloned());
    expected.extend([
        record(OP_CLOSE, 4 + count),
        record(OP_END, 5 + count),
        call("Logout", Some(COOKIE)),
    ]);
    assert_eq!(events, expected);
}

/// Runs a healthy session to a clean disconnect and returns the host's events.
fn session_ends_cleanly(host: &Host, mut child: Child) -> Vec<Event> {
    disconnect(&mut child);
    let output = finish(child);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert!(output.stderr.is_empty(), "stderr: {}", text(&output.stderr));
    assert!(
        output.stdout.is_empty(),
        "bytes after the disconnect: {:?}",
        output.stdout
    );
    host.events()
}

#[test]
fn reads_at_any_offset_and_length_return_the_bytes_the_disk_holds_there() {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let ranges = [
        (7 * SECTOR, SECTOR),
        (100_000, 1_234),
        (MIB - 5, 2 * MIB + 10),
        (SMALL - SECTOR, SECTOR),
        (SMALL - 1, 1),
    ];
    for (cookie, (offset, length)) in ranges.into_iter().enumerate() {
        let cookie = u64::try_from(cookie).expect("a handful of reads");
        assert_eq!(
            read_at(&mut child, cookie, offset, length),
            Ok(disk(offset, length)),
            "read {length} bytes at {offset}"
        );
    }
    let events = session_ends_cleanly(&host, child);

    let reads = host_reads(&events, SMALL);
    assert_eq!(
        reads,
        [
            (7 * SECTOR, SECTOR),
            (99_840, 3 * SECTOR),
            (MIB - SECTOR, SECTOR),
            (MIB, MIB),
            (2 * MIB, MIB),
            (3 * MIB, SECTOR),
            (SMALL - SECTOR, SECTOR),
            (SMALL - SECTOR, SECTOR),
        ]
    );
    healthy_session(&events, reads.len());
}

/// Reads the small disk in mebibyte steps with `extra` arguments and checks every byte.
///
/// Returns the compression every host read asked, in order, and what the
/// data port observed.
fn whole_disk_matches(extra: &[&str]) -> (Vec<u32>, Observed) {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pinned(&host, extra));
    negotiate(&mut child, true);

    let mut offset = 0;
    let mut cookie = 0;
    while offset < SMALL {
        let length = (SMALL - offset).min(MIB);
        assert_eq!(
            read_at(&mut child, cookie, offset, length),
            Ok(disk(offset, length)),
            "read {length} bytes at {offset}"
        );
        offset += length;
        cookie += 1;
    }
    let events = session_ends_cleanly(&host, child);

    let reads = host_reads(&events, SMALL);
    assert_eq!(
        reads,
        [
            (0, MIB),
            (MIB, MIB),
            (2 * MIB, MIB),
            (3 * MIB, MIB),
            (4 * MIB, 3 * SECTOR),
        ]
    );
    healthy_session(&events, reads.len());
    let compressions = events
        .iter()
        .filter_map(|event| match event {
            Event::Read { compression, .. } => Some(*compression),
            _ => None,
        })
        .collect();
    (compressions, host.data())
}

#[test]
fn the_whole_disk_read_in_mebibyte_steps_matches_byte_for_byte_with_skipz_by_default() {
    let (compressions, observed) = whole_disk_matches(&[]);

    assert_eq!(compressions, [3; 5], "every read asks for skipz");
    assert!(
        observed.raw_chunks > 0 && observed.raw_chunks < observed.chunks,
        "some chunks come as stored, some as skipz: {observed:?}"
    );
}

#[test]
fn the_whole_disk_read_in_mebibyte_steps_matches_byte_for_byte_with_zlib() {
    let (compressions, observed) = whole_disk_matches(&["--compression", "zlib"]);

    assert_eq!(compressions, [1; 5], "every read asks for zlib");
    assert_eq!(observed.raw_chunks, 0, "{observed:?}");
}

#[test]
fn the_whole_disk_read_in_mebibyte_steps_matches_byte_for_byte_with_none() {
    let (compressions, observed) = whole_disk_matches(&["--compression", "none"]);

    assert_eq!(
        compressions, [0; 5],
        "every read asks for the bytes as stored"
    );
    assert_eq!(observed.raw_chunks, 0, "{observed:?}");
}

/// Reads eight sectors, two chunks, from a host whose first chunk shows `fault`.
///
/// Asserts the read is answered `NBD_EIO`, the run fails, the session is
/// logged out without a close record, and returns the explanation.
fn read_fails(fault: ReadFault) -> String {
    read_fails_with(fault, &[])
}

/// [`read_fails`] with `extra` arguments after the pin.
fn read_fails_with(fault: ReadFault, extra: &[&str]) -> String {
    let host = Host::start(Scenario {
        read_fault: Some(fault),
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pinned(&host, extra));
    negotiate(&mut child, true);

    let reply = read_at(&mut child, 9, 0, 4_096);
    let output = finish(child);

    assert_eq!(reply, Err(EIO));
    let stderr = failure(&output);
    secrets_absent(&output);
    let events = host.events();
    assert_eq!(
        events.last(),
        Some(&call("Logout", Some(COOKIE))),
        "{events:?}"
    );
    assert!(
        !events.iter().any(|event| *event == record(OP_CLOSE, 5)),
        "the connection is dropped mid-record, not closed: {events:?}"
    );
    stderr
}

#[test]
fn a_chunk_with_a_non_zero_status_is_eio_then_a_failure_naming_the_status() {
    assert_eq!(
        read_fails(ReadFault::Status(3)),
        "vectura: data plane: read 4096 bytes at offset 0: the host returned status 3\n"
    );
}

#[test]
fn a_chunk_past_the_read_is_eio_then_a_failure_naming_the_chunk() {
    assert_eq!(
        read_fails(ReadFault::OutOfRange),
        "vectura: data plane: chunk: 3096 bytes at offset 4096 end past the 4096 bytes read\n"
    );
}

#[test]
fn a_chunk_overlapping_another_is_eio_then_a_failure_naming_the_chunk() {
    assert_eq!(
        read_fails(ReadFault::Overlap),
        "vectura: data plane: chunk: 3096 bytes at offset 1000 overlap a chunk already received\n"
    );
}

#[test]
fn a_chunk_longer_on_the_wire_than_announced_is_eio_then_a_failure_naming_both_lengths() {
    assert_eq!(
        read_fails_with(ReadFault::WireLength, &["--compression", "none"]),
        "vectura: data plane: chunk: 3096 bytes at offset 1000 came as 3097 bytes on the wire\n"
    );
}

#[test]
fn a_zlib_chunk_that_does_not_inflate_is_eio_then_a_failure_naming_the_chunk() {
    let stderr = read_fails_with(ReadFault::Zlib, &["--compression", "zlib"]);
    assert!(
        stderr.starts_with(
            "vectura: data plane: chunk: 3096 bytes at offset 1000: the zlib stream does not inflate: "
        ) && stderr.ends_with('\n'),
        "{stderr}"
    );
}

#[test]
fn a_skipz_segment_past_the_chunk_is_eio_then_a_failure_naming_the_segment() {
    assert_eq!(
        read_fails(ReadFault::SkipzSegment),
        "vectura: data plane: chunk: 3096 bytes at offset 1000: a skipz segment of 3096 bytes at offset 1 ends past the chunk\n"
    );
}

#[test]
fn a_host_that_closes_mid_read_is_eio_then_a_failure_and_the_session_logged_out() {
    assert_eq!(
        read_fails(ReadFault::Cut),
        "vectura: data plane: the host closed the connection during the record\n"
    );
}

/// What `NBD_OPT_INFO` and `NBD_OPT_GO` report about a disk of `capacity` bytes.
fn export_info(capacity: u64) -> Info {
    Info {
        size: capacity,
        flags: READ_ONLY,
        block_size: Some(BLOCK_SIZES),
        other: Vec::new(),
    }
}

/// Asserts exit 0 with nothing further on either stream, and the full teardown.
fn ends_cleanly(host: &Host, output: &Output) {
    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert!(output.stderr.is_empty(), "stderr: {}", text(&output.stderr));
    assert!(
        output.stdout.is_empty(),
        "bytes after the negotiation: {:?}",
        output.stdout
    );
    healthy_session(&host.events(), 0);
}

#[test]
fn go_reports_the_export_and_its_block_sizes_then_reads_are_served() {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    handshake(&mut child, true);

    let reported = info(&mut child, nbd::OPT_GO, b"", &[nbd::INFO_BLOCK_SIZE]);
    assert_eq!(reported, Ok(export_info(SMALL)));
    assert_eq!(
        read_at(&mut child, 1, 3 * SECTOR, SECTOR),
        Ok(disk(3 * SECTOR, SECTOR))
    );
    let events = session_ends_cleanly(&host, child);

    assert_eq!(host_reads(&events, SMALL), [(3 * SECTOR, SECTOR)]);
    healthy_session(&events, 1);
}

#[test]
fn info_reports_the_block_sizes_unasked_and_ignores_unknown_infos_then_go_still_works() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    handshake(&mut child, true);

    let capacity = Scenario::default().capacity;
    let reported = info(
        &mut child,
        nbd::OPT_INFO,
        b"anything",
        &[nbd::INFO_EXPORT, 0x1234],
    );
    assert_eq!(reported, Ok(export_info(capacity)));
    assert_eq!(
        info(&mut child, nbd::OPT_GO, b"", &[]),
        Ok(export_info(capacity))
    );
    assert_eq!(read_at(&mut child, 1, 0, SECTOR), Ok(disk(0, SECTOR)));
    let events = session_ends_cleanly(&host, child);

    healthy_session(&events, 1);
}

#[test]
fn abort_ends_the_run_cleanly_after_the_teardown() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    handshake(&mut child, false);
    pipes(&mut child, nbd::abort);
    let output = finish(child);

    ends_cleanly(&host, &output);
}

#[test]
fn options_the_export_does_not_serve_are_refused_as_unsupported_and_negotiation_goes_on() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    let padded = handshake(&mut child, false);

    for (kind, data) in [
        (nbd::OPT_LIST, &b""[..]),
        (nbd::OPT_STARTTLS, b""),
        (nbd::OPT_STRUCTURED_REPLY, b""),
        (0x4242, b"\x00\x00\x00\x00"),
    ] {
        let reply = pipes(&mut child, |input, output| {
            nbd::refused(input, output, kind, data)
        });
        assert_eq!(reply, nbd::REP_ERR_UNSUP, "option {kind}");
    }
    let export = pipes(&mut child, |input, output| {
        nbd::export_name(input, output, padded)
    });
    let output = {
        disconnect(&mut child);
        finish(child)
    };

    assert_eq!(
        export,
        Export {
            size: Scenario::default().capacity,
            flags: READ_ONLY,
            padded: true,
        }
    );
    ends_cleanly(&host, &output);
}

#[test]
fn a_client_without_fixed_newstyle_is_refused_after_the_teardown() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    pipes(&mut child, |input, output| {
        nbd::handshake_with(input, output, 0);
    });
    let output = finish(child);

    assert_eq!(
        failure(&output),
        "vectura: nbd: the client flags 0x0 lack NBD_FLAG_C_FIXED_NEWSTYLE\n"
    );
    healthy_session(&host.events(), 0);
}

#[test]
fn an_option_longer_than_four_kibibytes_is_refused_after_the_teardown() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));

    handshake(&mut child, false);
    pipes(&mut child, |_, output| {
        nbd::option_header(output, nbd::OPT_GO, 4097);
    });
    let output = finish(child);

    assert_eq!(
        failure(&output),
        "vectura: nbd: option 7 carries 4097 bytes, more than 4096\n"
    );
    healthy_session(&host.events(), 0);
}

#[test]
fn writes_of_every_kind_are_refused_as_read_only_and_the_read_after_them_is_served() {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let written = pipes(&mut child, |input, output| {
        nbd::write_at(input, output, 1, 0, &[0xAB; 4096])
    });
    assert_eq!(written, nbd::EPERM);
    assert_eq!(
        command(&mut child, 0, nbd::CMD_WRITE_ZEROES, 2, 0, 4096),
        nbd::EPERM
    );
    assert_eq!(
        command(&mut child, 0, nbd::CMD_TRIM, 3, 0, 4096),
        nbd::EPERM
    );
    assert_eq!(read_at(&mut child, 4, 0, SECTOR), Ok(disk(0, SECTOR)));
    let events = session_ends_cleanly(&host, child);

    assert_eq!(host_reads(&events, SMALL), [(0, SECTOR)]);
    healthy_session(&events, 1);
}

#[test]
fn a_flush_an_unknown_command_and_a_flagged_read_are_invalid_without_asking_the_host() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    assert_eq!(command(&mut child, 0, nbd::CMD_FLUSH, 1, 0, 0), nbd::EINVAL);
    assert_eq!(command(&mut child, 0, 99, 2, 0, 0), nbd::EINVAL);
    assert_eq!(
        command(&mut child, nbd::CMD_FLAG_FUA, nbd::CMD_READ, 3, 0, 512),
        nbd::EINVAL
    );
    let events = session_ends_cleanly(&host, child);

    healthy_session(&events, 0);
}

#[test]
fn a_read_past_the_export_or_longer_than_the_maximum_is_invalid_and_an_empty_one_succeeds() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let capacity = Scenario::default().capacity;
    assert_eq!(read_at(&mut child, 1, capacity - 1, 2), Err(nbd::EINVAL));
    assert_eq!(read_at(&mut child, 2, capacity, 1), Err(nbd::EINVAL));
    assert_eq!(read_at(&mut child, 3, 0, 32 * MIB + 1), Err(nbd::EINVAL));
    assert_eq!(read_at(&mut child, 4, 0, 0), Ok(Vec::new()));
    assert_eq!(read_at(&mut child, 5, capacity, 0), Ok(Vec::new()));
    let events = session_ends_cleanly(&host, child);

    healthy_session(&events, 0);
}

#[test]
fn a_client_that_stops_reading_is_an_error_after_the_teardown() {
    let host = Host::start(Scenario::default());
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    drop(child.stdout.take());
    let stdin = child.stdin.as_mut().expect("stdin is piped");
    nbd::request(stdin, 0, nbd::CMD_READ, 1, 0, 512);
    let output = finish(child);

    let stderr = failure(&output);
    assert_eq!(
        stderr,
        "vectura: the nbd client left without disconnecting\n"
    );
    healthy_session(&host.events(), 1);
}

#[test]
fn a_large_read_keeps_sixteen_host_reads_in_flight_and_returns_the_bytes_the_disk_holds() {
    let host = Host::start(Scenario {
        capacity: 64 * MIB,
        hold: 16,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let data = read_at(&mut child, 5, 0, 32 * MIB);

    matches_disk(&data, 0, 32 * MIB);
    let events = session_ends_cleanly(&host, child);
    assert_eq!(host_reads(&events, 64 * MIB).len(), 32);
    assert_eq!(most_in_flight(&events), 16);
    let sequences = read_sequences(&events);
    assert!(
        sequences.windows(2).all(|pair| pair[0] < pair[1]),
        "sequences increase: {sequences:?}"
    );
    healthy_session(&events, 32);
}

#[test]
fn sixteen_reads_sent_together_are_answered_as_the_host_completes_them_each_with_its_own_bytes() {
    let host = Host::start(Scenario {
        capacity: 64 * MIB,
        hold: 16,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);
    let reads = (0..16)
        .map(|cookie| (cookie, cookie * MIB, u32::try_from(MIB).unwrap()))
        .collect::<Vec<_>>();

    let replies = read_together(&mut child, &reads);

    let cookies = replies
        .iter()
        .map(|(cookie, _)| *cookie)
        .collect::<Vec<_>>();
    assert_eq!(cookies, (0..16).rev().collect::<Vec<_>>(), "newest first");
    for (cookie, data) in &replies {
        matches_disk(data, cookie * MIB, MIB);
    }
    let events = session_ends_cleanly(&host, child);
    assert_eq!(host_reads(&events, 64 * MIB).len(), 16);
    assert_eq!(most_in_flight(&events), 16);
    healthy_session(&events, 16);
}

#[test]
fn two_reads_completing_in_reverse_order_are_answered_in_completion_order_with_their_cookies() {
    let host = Host::start(Scenario {
        hold: 2,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let replies = read_together(&mut child, &[(7, 0, 4_096), (8, MIB, 512)]);

    assert_eq!(replies.len(), 2);
    assert_eq!(replies[0].0, 8, "the read the host completed first");
    matches_disk(&replies[0].1, MIB, 512);
    assert_eq!(replies[1].0, 7);
    matches_disk(&replies[1].1, 0, 4_096);
    let events = session_ends_cleanly(&host, child);
    healthy_session(&events, 2);
}

#[test]
fn a_lower_depth_caps_the_host_reads_in_flight() {
    let host = Host::start(Scenario {
        capacity: 64 * MIB,
        hold: 4,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pinned_at_depth(&host, 4));
    negotiate(&mut child, true);

    let data = read_at(&mut child, 5, 0, 16 * MIB);

    matches_disk(&data, 0, 16 * MIB);
    let events = session_ends_cleanly(&host, child);
    assert_eq!(host_reads(&events, 64 * MIB).len(), 16);
    assert_eq!(most_in_flight(&events), 4);
    healthy_session(&events, 16);
}

#[test]
fn a_holding_host_times_only_the_wait_for_the_read_that_fills_its_hold() {
    let host = Host::start(Scenario {
        hold: 2,
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);
    // An NBD client thinking for longer than the patience before its first
    // read, then after its last reply, is not a client short of the hold.
    let pause = HOLD_PATIENCE + Duration::from_secs(1);

    thread::sleep(pause);
    let replies = read_together(&mut child, &[(7, 0, 4_096), (8, MIB, 512)]);
    thread::sleep(pause);

    assert_eq!(replies.len(), 2);
    for (cookie, data) in &replies {
        let (offset, length) = if *cookie == 7 { (0, 4_096) } else { (MIB, 512) };
        matches_disk(data, offset, length);
    }
    let events = session_ends_cleanly(&host, child);
    healthy_session(&events, 2);
}

/// Reads one mebibyte more than the depth from a host holding that many reads.
///
/// The depth is `flag`, given as `--depth`, or the default without one. The
/// window never sends the read that fills the hold, so the host cuts the
/// run: asserts the read is answered `NBD_EIO`, exactly `depth` reads were
/// sent, never more in flight, and the session was logged out.
fn depth_holds(flag: Option<u8>) {
    let depth = flag.unwrap_or(DEFAULT_DEPTH);
    let hold = usize::from(depth) + 1;
    let host = Host::start(Scenario {
        capacity: 64 * MIB,
        hold,
        ..Scenario::default()
    });
    let arguments = match flag {
        Some(depth) => pinned_at_depth(&host, depth),
        None => pin(&host),
    };
    let mut child = spawn(&host, Some(PASSWORD), &arguments);
    negotiate(&mut child, true);

    let reply = read_at(&mut child, 9, 0, u64::try_from(hold).unwrap() * MIB);
    let output = finish(child);

    assert_eq!(reply, Err(EIO));
    assert_eq!(
        failure(&output),
        "vectura: data plane: the host closed the connection during the record\n"
    );
    let events = host.events();
    assert_eq!(
        read_sequences(&events).len(),
        usize::from(depth),
        "{events:?}"
    );
    assert_eq!(most_in_flight(&events), usize::from(depth));
    assert_eq!(events.last(), Some(&call("Logout", Some(COOKIE))));
}

#[test]
fn a_depth_of_one_never_has_a_second_read_in_flight_so_a_host_waiting_for_one_cuts_the_run() {
    depth_holds(Some(1));
}

#[test]
fn a_depth_of_four_never_has_a_fifth_read_in_flight() {
    depth_holds(Some(4));
}

#[test]
fn the_default_depth_never_has_a_seventeenth_read_in_flight() {
    depth_holds(None);
}

#[test]
fn a_read_failing_with_others_in_flight_answers_eio_to_every_one_then_fails_and_logs_out() {
    let host = Host::start(Scenario {
        hold: 2,
        read_fault: Some(ReadFault::Status(3)),
        ..Scenario::default()
    });
    let mut child = spawn(&host, Some(PASSWORD), &pin(&host));
    negotiate(&mut child, true);

    let replies = read_together(&mut child, &[(7, 0, 4_096), (8, MIB, 512)]);
    let output = finish(child);

    let mut cookies = replies
        .iter()
        .map(|(cookie, reply)| (*cookie, reply.clone()))
        .collect::<Vec<_>>();
    cookies.sort_by_key(|(cookie, _)| *cookie);
    assert_eq!(cookies, [(7, Err(EIO)), (8, Err(EIO))]);
    assert_eq!(
        failure(&output),
        "vectura: data plane: read 512 bytes at offset 1048576: the host returned status 3\n"
    );
    secrets_absent(&output);
    let events = host.events();
    assert_eq!(events.last(), Some(&call("Logout", Some(COOKIE))));
}

/// The client flags of a fixed-newstyle client: `NBD_FLAG_C_FIXED_NEWSTYLE` alone.
const FIXED_NEWSTYLE: u32 = 1;

/// A gibibyte, the step between progress lines.
const GIB: u64 = 1 << 30;

/// The warning `--transport nfc` puts on standard error.
const CLEAR_TEXT_WARNING: &str =
    "vectura: warning: --transport nfc carries the disk in clear text after the ticket dialogue\n";

/// A whole NBD session as one script: info, go, one sector read, disconnect.
fn scripted_session() -> Vec<u8> {
    let mut script = FIXED_NEWSTYLE.to_be_bytes().to_vec();
    nbd::option(
        &mut script,
        nbd::OPT_INFO,
        &nbd::info_data(b"", &[nbd::INFO_BLOCK_SIZE]),
    );
    nbd::option(&mut script, nbd::OPT_GO, &nbd::info_data(b"", &[]));
    nbd::request(&mut script, 0, nbd::CMD_READ, 1, 0, 512);
    nbd::disconnect(&mut script);
    script
}

/// Runs the scripted session with `extra` arguments and collects both streams.
fn run_scripted(host: &Host, extra: &[&str]) -> Output {
    let mut child = spawn(host, Some(PASSWORD), &pinned(host, extra));
    let mut stdin = child.stdin.take().expect("stdin is piped");
    stdin
        .write_all(&scripted_session())
        .expect("the child reads its input");
    drop(stdin);
    finish(child)
}

/// Asserts `output` is a clean exit whose standard error is exactly `stderr`.
fn exits_cleanly_saying(output: &Output, stderr: &str) {
    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    assert_eq!(text(&output.stderr), stderr);
    assert!(
        output.stdout.is_empty(),
        "bytes after the disconnect: {:?}",
        output.stdout
    );
}

#[test]
fn verbose_narrates_the_session_on_stderr_and_leaves_stdout_unchanged() {
    let quiet_host = Host::start(Scenario::default());
    let quiet = run_scripted(&quiet_host, &[]);
    let host = Host::start(Scenario::default());
    let verbose = run_scripted(&host, &["--verbose"]);

    for output in [&quiet, &verbose] {
        assert_eq!(
            output.status.code(),
            Some(0),
            "stderr: {}",
            text(&output.stderr)
        );
    }
    assert!(quiet.stderr.is_empty(), "stderr: {}", text(&quiet.stderr));
    assert!(!quiet.stdout.is_empty(), "no NBD stream was written");
    assert_eq!(verbose.stdout, quiet.stdout);
    let stderr = text(&verbose.stderr);
    let data = host.data();
    let tls = format!(
        "tls {} {}",
        data.version.expect("the data port negotiated a version"),
        data.suite.expect("the data port negotiated a suite")
    );
    let capacity = Scenario::default().capacity;
    for expected in [
        "RetrieveServiceContent: 200 in ",
        "Login: 200 in ",
        "RetrieveInternalContent: 200 in ",
        "NfcGetVmFiles: 200 in ",
        "Logout: 200 in ",
        "greeting: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC, \
         VMXARGS supported, NFCSSL supported, SHA256 supported\n",
        &format!("first session {tls}\n"),
        &format!("second session {tls}\n"),
        "> SESSION <ticket>\n",
        "> BANNER \n",
        "< 220 VMware Authentication Daemon Version 1.10\n",
        "> THUMBPRINT_SHA2 ",
        &format!("< 200 {}\n", host.sha256()),
        "> PROXY nfcssl\n",
        "< 200 Connect ha-nfcssl\n",
        "> handshake type 43\n",
        "> handshake type 33\n",
        "> handshake type 51\n",
        "< handshake type 36\n",
        "< handshake type 51\n",
        "> handshake type 54\n",
        "> handshake type 55\n",
        "> handshake type 52\n",
        "< handshake type 52\n",
        &format!("open: {capacity} bytes, sector size 512\n"),
        "nbd option 6: info\n",
        "nbd option 7: info\n",
        &format!("nbd export: {capacity} bytes\n"),
        "summary: bytes served 512, wire bytes ",
        ", host reads 1, elapsed ",
    ] {
        assert!(
            stderr.contains(expected),
            "{expected:?} missing from:\n{stderr}"
        );
    }
}

#[test]
fn no_part_of_the_password_ticket_or_cookie_reaches_stderr_at_any_verbosity() {
    for extra in [&[][..], &["--verbose"][..]] {
        let host = Host::start(Scenario::default());
        let output = run_scripted(&host, extra);

        assert_eq!(
            output.status.code(),
            Some(0),
            "stderr: {}",
            text(&output.stderr)
        );
        secrets_absent(&output);
        let stderr = text(&output.stderr);
        for secret in [PASSWORD, TICKET, COOKIE] {
            // Eight bytes is the floor: a shorter fragment collides with ordinary
            // transcript words.
            for window in secret.as_bytes().windows(8) {
                let window = std::str::from_utf8(window).expect("the secrets are ASCII");
                assert!(
                    !stderr.contains(window),
                    "{window:?} of {secret:?} leaked: {stderr}"
                );
            }
        }
    }
}

#[test]
fn a_progress_line_follows_the_first_gib_and_the_summary_counts_the_reads() {
    let host = Host::start(Scenario {
        capacity: 3 * GIB / 2,
        ..Scenario::default()
    });
    let mut child = spawn(
        &host,
        Some(PASSWORD),
        &pinned(&host, &["--verbose", "--compression", "none"]),
    );

    negotiate(&mut child, false);
    let (mut offset, mut cookie) = (0, 0);
    while offset < GIB + MIB {
        let length = (32 * MIB).min(GIB + MIB - offset);
        read_at(&mut child, cookie, offset, length).expect("the read succeeded");
        offset += length;
        cookie += 1;
    }
    disconnect(&mut child);
    let output = finish(child);

    assert_eq!(
        output.status.code(),
        Some(0),
        "stderr: {}",
        text(&output.stderr)
    );
    let stderr = text(&output.stderr);
    assert!(
        stderr.contains("progress: served 1 GiB, compression ratio 1.00, depth 16\n"),
        "{stderr}"
    );
    let summary = stderr
        .lines()
        .find(|line| line.starts_with("summary: "))
        .expect("a summary line");
    assert!(
        summary.starts_with(
            "summary: bytes served 1074790400, wire bytes 1074790400, host reads 1025, elapsed "
        ) && summary.ends_with(" s"),
        "{summary}"
    );
    let reads = host
        .events()
        .iter()
        .filter(|event| matches!(event, Event::Read { .. }))
        .count();
    assert_eq!(reads, 1025);
}

#[test]
fn the_nfc_transport_runs_the_disk_session_in_clear_after_the_dialogue() {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(
        &host,
        Some(PASSWORD),
        &pinned(&host, &["--transport", "nfc"]),
    );

    negotiate(&mut child, false);
    let data = read_at(&mut child, 1, 0, SMALL);
    disconnect(&mut child);
    let output = finish(child);

    matches_disk(&data, 0, SMALL);
    exits_cleanly_saying(&output, CLEAR_TEXT_WARNING);
    let events = host.events();
    healthy_session_over(&events, host_reads(&events, SMALL).len(), "nfc");
    assert!(
        !host.data().second_handshake,
        "a second TLS handshake ran on the data port"
    );
}

#[test]
fn the_clear_text_warning_is_dropped_when_standard_error_cannot_take_it() {
    let host = Host::start(Scenario {
        capacity: SMALL,
        ..Scenario::default()
    });
    // `/dev/full` refuses every write, as a pipe whose reader left does. A
    // closed descriptor is no probe: a write to a closed standard error
    // succeeds silently.
    let full = fs::File::create("/dev/full").expect("/dev/full opens for writing");
    let mut child = serve_command(
        &host,
        Some(PASSWORD),
        &pinned(&host, &["--transport", "nfc"]),
    )
    .stderr(full)
    .spawn()
    .expect("the vectura binary runs");

    negotiate(&mut child, false);
    let data = read_at(&mut child, 1, 0, SECTOR);
    disconnect(&mut child);
    let output = finish(child);

    matches_disk(&data, 0, SECTOR);
    assert_eq!(output.status.code(), Some(0));
    assert!(
        output.stdout.is_empty(),
        "bytes after the disconnect: {:?}",
        output.stdout
    );
    healthy_session_over(&host.events(), 1, "nfc");
}

#[test]
fn a_greeting_without_nfcssl_support_refuses_nfcssl_and_serves_over_nfc() {
    let (host, stderr) = fails_then_logs_out(Scenario {
        data: DataPort::Greeting(GREETING_WITHOUT_NFCSSL),
        ..Scenario::default()
    });

    assert!(
        stderr.contains(
            "greeting: the host does not announce \"NFCSSL supported\"; announced: \
             [SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC, \
             VMXARGS supported, SHA256 supported]"
        ),
        "{stderr}"
    );
    assert!(
        !host.data().handshake_started,
        "no TLS is started on the data port"
    );

    let host = Host::start(Scenario {
        data: DataPort::Greeting(GREETING_WITHOUT_NFCSSL),
        capacity: SMALL,
        ..Scenario::default()
    });
    let mut child = spawn(
        &host,
        Some(PASSWORD),
        &pinned(&host, &["--transport", "nfc"]),
    );

    negotiate(&mut child, false);
    let data = read_at(&mut child, 1, 0, SECTOR);
    disconnect(&mut child);
    let output = finish(child);

    matches_disk(&data, 0, SECTOR);
    exits_cleanly_saying(&output, CLEAR_TEXT_WARNING);
    healthy_session_over(&host.events(), 1, "nfc");
}
