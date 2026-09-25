//! Live tests against the lab hosts, ignored and run by hand.
//!
//! `cargo test --locked -- --ignored` runs them. A test that serves a disk
//! takes its lab from `VECTURA_LAB_HOST`, `VECTURA_LAB_USER`, `VECTURA_LAB_VM`,
//! `VECTURA_LAB_DISK` and `VECTURA_LAB_THUMBPRINT`; the legacy check takes
//! `VECTURA_LAB_LEGACY_HOST` alone. A test skips, naming what is missing, when
//! a variable is not set. The child inherits `VECTURA_PASSWORD`; no test reads it.

use std::fs::File;
use std::io::{self, Read, Seek, SeekFrom, Write};
use std::panic::{self, AssertUnwindSafe};
use std::process::{Child, Command, Stdio};
use std::thread;
use std::time::Duration;

use crate::serve::{READ_ONLY, SECTOR, disconnect, finish, negotiate, read_at};
use crate::support::text;

/// The longest read the export accepts: the oracle's step and each sampled range.
const READ: u64 = 32 << 20;

/// The idle gap when `VECTURA_LAB_IDLE_GAP` is not set.
///
/// Five minutes: longer than any pause seen between two reads of one session
/// and inside the 30 minutes after which hostd expires an abandoned session.
const DEFAULT_IDLE_GAP: Duration = Duration::from_secs(300);

/// The transcript line `serve` writes when the client negotiated with `NBD_OPT_GO`.
const GO: &str = "nbd option 7: info\n";

/// The bytes the libnbd program writes for the export size: one big-endian `u64`.
const SIZE_BYTES: usize = std::mem::size_of::<u64>();

/// Writes a line straight to standard error, which the test harness does not capture.
///
/// A skip and a measurement show up without `--nocapture`.
fn report(line: &str) {
    let _ = writeln!(io::stderr(), "{line}");
}

/// Whether `variable` is set, with a skip line naming it when it is not.
///
/// The value itself is never read, so `VECTURA_PASSWORD` stays in the environment.
fn present(variable: &str) -> bool {
    let present = std::env::var_os(variable).is_some();
    if !present {
        report(&format!("skipping: {variable} is not set"));
    }
    present
}

/// The value of `variable`, or `None` after a skip line naming it.
fn lab(variable: &str) -> Option<String> {
    present(variable).then(|| std::env::var(variable).expect("a set variable is unicode"))
}

/// The lab disk the tests serve.
struct Lab {
    host: String,
    user: String,
    vm: String,
    disk: String,
    thumbprint: String,
}

impl Lab {
    /// The lab the environment describes, or `None` after naming every missing variable.
    fn from_env() -> Option<Self> {
        let host = lab("VECTURA_LAB_HOST");
        let user = lab("VECTURA_LAB_USER");
        let vm = lab("VECTURA_LAB_VM");
        let disk = lab("VECTURA_LAB_DISK");
        let thumbprint = lab("VECTURA_LAB_THUMBPRINT");
        let password = present("VECTURA_PASSWORD");
        let lab = Self {
            host: host?,
            user: user?,
            vm: vm?,
            disk: disk?,
            thumbprint: thumbprint?,
        };
        password.then_some(lab)
    }

    /// The `serve` arguments for the lab disk, followed by `extra`.
    fn arguments(&self, extra: &[&str]) -> Vec<String> {
        [
            "serve",
            "--host",
            &self.host,
            "--user",
            &self.user,
            "--vm-id",
            &self.vm,
            "--disk",
            &self.disk,
            "--thumbprint",
            &self.thumbprint,
        ]
        .into_iter()
        .chain(extra.iter().copied())
        .map(str::to_owned)
        .collect()
    }

    /// Spawns `serve` on the lab disk with `extra` flags, its three streams piped.
    fn serve(&self, extra: &[&str]) -> Child {
        Command::new(env!("CARGO_BIN_EXE_vectura"))
            .args(self.arguments(extra))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("the vectura binary runs")
    }
}

/// The raw image `VECTURA_LAB_REFERENCE` names and its length, or `None` after a skip line.
///
/// The image is produced once, with the lab VM powered off so the disk does not
/// change under the tests: the VMDK's descriptor and every extent it names, and
/// for a snapshot its parents' too, are downloaded through the datastore browser
/// (`https://<host>/folder/<path>?dcPath=ha-datacenter&dsName=<datastore>`) into
/// one directory, then `qemu-img convert -O raw <descriptor>.vmdk <image>`
/// flattens them, following the parent hints of the descriptors.
fn reference() -> Option<(File, u64)> {
    let path = lab("VECTURA_LAB_REFERENCE")?;
    let file = File::open(&path).unwrap_or_else(|error| panic!("{path}: {error}"));
    let length = file.metadata().expect("the reference has metadata").len();
    Some((file, length))
}

/// Asserts `data` is what the reference holds at `offset`, naming the first difference.
fn matches_reference(reference: &mut File, offset: u64, data: &[u8]) {
    reference
        .seek(SeekFrom::Start(offset))
        .expect("the reference seeks");
    let mut expected = vec![0; data.len()];
    reference
        .read_exact(&mut expected)
        .expect("the reference holds the range");
    if let Some(index) = data
        .iter()
        .zip(&expected)
        .position(|(served, held)| served != held)
    {
        let at = offset + u64::try_from(index).expect("an index fits");
        panic!(
            "byte {at} differs: served {:#04x}, reference {:#04x}",
            data[index], expected[index]
        );
    }
}

/// Three `READ`-long ranges of a `size`-byte disk: the start, a sector-aligned middle, the end.
fn ranges(size: u64) -> [u64; 3] {
    assert!(
        size >= 2 * READ,
        "a disk of {size} bytes is too small to sample"
    );
    [0, size / 2 / SECTOR * SECTOR, size - READ]
}

/// Reads `length` bytes at `offset`, which must succeed.
fn read(child: &mut Child, cookie: u64, offset: u64, length: u64) -> Vec<u8> {
    read_at(child, cookie, offset, length)
        .unwrap_or_else(|code| panic!("read of {length} bytes at {offset}: NBD error {code}"))
}

/// Disconnects, waits for the child and asserts it exited 0; returns its standard error.
fn ends_cleanly(mut child: Child) -> String {
    disconnect(&mut child);
    let output = finish(child);
    let stderr = text(&output.stderr);
    assert_eq!(output.status.code(), Some(0), "stderr: {stderr}");
    stderr
}

/// The `wire bytes` field of the verbose summary line in `stderr`.
fn wire_bytes(stderr: &str) -> &str {
    stderr
        .lines()
        .find(|line| line.starts_with("summary: "))
        .and_then(|summary| {
            summary
                .split(", ")
                .find(|field| field.starts_with("wire bytes "))
        })
        .unwrap_or_else(|| panic!("no wire bytes in the summary:\n{stderr}"))
}

/// Whether `nbdsh` is on the path, with a skip line when it is not.
fn nbdsh_present() -> bool {
    let present = Command::new("nbdsh").arg("--version").output().is_ok();
    if !present {
        report("skipping: nbdsh (libnbd) is not on the path");
    }
    present
}

/// A Python string literal holding `text`.
fn python_string(text: &str) -> String {
    format!("'{}'", text.replace('\\', "\\\\").replace('\'', "\\'"))
}

/// Serves a lab disk over the real protocol and checks the export.
#[test]
#[ignore = "needs a lab host"]
fn a_lab_host_exports_its_disk_read_only_and_the_session_ends_cleanly() {
    let Some(lab) = Lab::from_env() else { return };

    let mut child = lab.serve(&[]);
    let export = negotiate(&mut child, false);
    let stderr = ends_cleanly(child);

    assert!(stderr.is_empty(), "stderr: {stderr}");
    assert!(export.size > 0, "{export:?}");
    assert_eq!(export.flags, READ_ONLY, "{export:?}");
}

/// Compares the whole served disk, byte for byte, to the `qemu-img` raw image.
///
/// The lab VM is powered off and the image is the one [`reference`] describes.
/// One sector is read first, then the disk in `READ`-long steps.
#[test]
#[ignore = "needs a lab host and the raw image in VECTURA_LAB_REFERENCE"]
fn the_served_disk_matches_the_qemu_img_raw_image_byte_for_byte() {
    let Some(lab) = Lab::from_env() else { return };
    let Some((mut reference, length)) = reference() else {
        return;
    };

    let mut child = lab.serve(&[]);
    let export = negotiate(&mut child, false);
    assert_eq!(export.size, length, "export size against the reference");
    let sector = read(&mut child, 0, 0, SECTOR);
    matches_reference(&mut reference, 0, &sector);
    let mut offset = 0;
    while offset < length {
        let step = READ.min(length - offset);
        let data = read(&mut child, offset, offset, step);
        matches_reference(&mut reference, offset, &data);
        offset += step;
    }
    let stderr = ends_cleanly(child);

    assert!(stderr.is_empty(), "stderr: {stderr}");
}

/// Drives the binary with libnbd, an NBD client the crate shares no code with.
///
/// `nbdsh` spawns `serve --verbose` through `connect_command`, so the transcript
/// on its standard error shows the `NBD_OPT_GO` the client sent; it reads one
/// range at the start, in the middle and at the end of the disk, and each one
/// must match the `qemu-img` raw image.
#[test]
#[ignore = "needs a lab host, the raw image in VECTURA_LAB_REFERENCE and nbdsh"]
fn libnbd_negotiates_with_go_and_reads_the_start_the_middle_and_the_end() {
    let Some(lab) = Lab::from_env() else { return };
    let Some((mut reference, length)) = reference() else {
        return;
    };
    if !nbdsh_present() {
        return;
    }
    let offsets = ranges(length);
    let argv = std::iter::once(env!("CARGO_BIN_EXE_vectura").to_owned())
        .chain(lab.arguments(&["--verbose"]))
        .map(|argument| python_string(&argument))
        .collect::<Vec<_>>()
        .join(", ");
    let program = format!(
        "import sys
h.connect_command([{argv}])
out = sys.stdout.buffer
out.write(h.get_size().to_bytes({SIZE_BYTES}, 'big'))
for offset in ({}):
    out.write(h.pread({READ}, offset))
h.shutdown()
",
        offsets.map(|offset| offset.to_string()).join(", ")
    );

    let output = Command::new("nbdsh")
        .args(["-c", &program])
        .output()
        .expect("nbdsh runs");

    let stderr = text(&output.stderr);
    assert_eq!(output.status.code(), Some(0), "nbdsh: {stderr}");
    assert!(
        stderr.contains(GO),
        "no NBD_OPT_GO in the transcript:\n{stderr}"
    );
    let (size, data) = output.stdout.split_at(SIZE_BYTES);
    assert_eq!(
        u64::from_be_bytes(size.try_into().expect("eight bytes")),
        length
    );
    let range = usize::try_from(READ).expect("a range fits");
    assert_eq!(data.len(), 3 * range, "three ranges came back");
    for (offset, bytes) in offsets.into_iter().zip(data.chunks(range)) {
        matches_reference(&mut reference, offset, bytes);
    }
}

/// Samples three ranges in `skipz`, `zlib` and `none` and reports each mode's wire bytes.
///
/// The modes must serve identical bytes; the verbose summary of each run
/// says how many bytes crossed the wire for them, which is the line reported.
#[test]
#[ignore = "needs a lab host"]
fn the_three_compression_modes_serve_identical_bytes_and_report_their_wire_bytes() {
    let Some(lab) = Lab::from_env() else { return };

    let mut previous: Option<Vec<u8>> = None;
    for mode in ["skipz", "zlib", "none"] {
        let mut child = lab.serve(&["--verbose", "--compression", mode]);
        let export = negotiate(&mut child, false);
        let mut data = Vec::new();
        for (cookie, offset) in (1..).zip(ranges(export.size)) {
            data.extend(read(&mut child, cookie, offset, READ));
        }
        let stderr = ends_cleanly(child);
        report(&format!(
            "compression {mode}: {} for {} bytes served",
            wire_bytes(&stderr),
            data.len()
        ));
        if let Some(previous) = &previous {
            assert!(
                *previous == data,
                "{mode} served other bytes than the mode before"
            );
        }
        previous = Some(data);
    }
}

/// Holds the disk open across an idle gap and records whether it stays readable.
///
/// The gap, in seconds, is `VECTURA_LAB_IDLE_GAP` and defaults to five minutes.
/// The outcome line on standard error is the measurement: how an open disk
/// fares without traffic, which nothing public states.
#[test]
#[ignore = "needs a lab host; VECTURA_LAB_IDLE_GAP sets the gap in seconds"]
fn the_disk_stays_readable_across_the_idle_gap() {
    let Some(lab) = Lab::from_env() else { return };
    let gap = std::env::var("VECTURA_LAB_IDLE_GAP").map_or(DEFAULT_IDLE_GAP, |seconds| {
        Duration::from_secs(seconds.parse().expect("a number of seconds"))
    });

    let mut child = lab.serve(&["--verbose"]);
    negotiate(&mut child, false);
    let first = read(&mut child, 1, 0, READ);
    thread::sleep(gap);
    let second = panic::catch_unwind(AssertUnwindSafe(|| read_at(&mut child, 2, 0, READ)));

    let succeeded = matches!(&second, Ok(Ok(data)) if *data == first);
    let outcome = match &second {
        Ok(Ok(_)) if succeeded => "succeeded with the same bytes".to_owned(),
        Ok(Ok(_)) => "succeeded with other bytes".to_owned(),
        Ok(Err(code)) => format!("failed with NBD error {code}"),
        Err(_) => "failed: the stream closed".to_owned(),
    };
    report(&format!(
        "idle gap of {} s: second read {outcome}",
        gap.as_secs()
    ));
    let stderr = if succeeded {
        ends_cleanly(child)
    } else {
        text(&finish(child).stderr)
    };
    assert!(succeeded, "second read {outcome}; transcript:\n{stderr}");
}

/// A legacy host is refused at its greeting, the message listing what it announced.
///
/// `fingerprint` reads the port-902 greeting through the parser `serve` uses,
/// so the refusal is the same and needs neither credentials nor a pin;
/// `VECTURA_LAB_LEGACY_HOST` names the host as `host[:port]`.
#[test]
#[ignore = "needs a legacy host in VECTURA_LAB_LEGACY_HOST"]
fn a_legacy_host_is_refused_at_the_greeting_with_its_capability_list() {
    let Some(host) = lab("VECTURA_LAB_LEGACY_HOST") else {
        return;
    };

    let output = Command::new(env!("CARGO_BIN_EXE_vectura"))
        .args(["fingerprint", "--host", &host])
        .output()
        .expect("the vectura binary runs");

    let stderr = text(&output.stderr);
    assert_eq!(output.status.code(), Some(1), "{stderr}");
    assert!(
        stderr.contains("does not announce \"SHA256 supported\"; announced: ["),
        "{stderr}"
    );
    report(&format!("legacy host refused: {}", stderr.trim_end()));
}
