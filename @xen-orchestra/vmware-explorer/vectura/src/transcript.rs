//! The transcript `--verbose` writes to standard error.
//!
//! The transcript's lines are formatted here and nowhere else, so what it may
//! say is checked in one place: no password, ticket or cookie is ever passed
//! in, and the dialogue line that carries the ticket is rendered with a
//! placeholder.

use std::io::{self, Write};
use std::time::Duration;

use rustls::{CipherSuite, ProtocolVersion};

/// Bytes served between two progress lines: one gibibyte.
pub const PROGRESS_STEP: u64 = 1 << 30;

/// Where a session's lines go: standard error when enabled, nowhere otherwise.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Transcript {
    enabled: bool,
}

impl Transcript {
    /// A transcript that writes its lines when `enabled`.
    #[must_use]
    pub const fn new(enabled: bool) -> Transcript {
        Transcript { enabled }
    }

    /// A management call, the status it was answered with, and how long it took.
    pub fn call(&self, name: &str, status: u16, took: Duration) {
        self.line(&format!("{name}: {status} in {} ms", took.as_millis()));
    }

    /// The capability list the data port greeted with.
    pub fn greeting(&self, capabilities: &[String]) {
        self.line(&format!("greeting: {}", capabilities.join(", ")));
    }

    /// The protocol version and cipher suite the TLS session at `place` negotiated.
    pub fn tls(&self, place: &str, version: ProtocolVersion, suite: CipherSuite) {
        self.line(&format!("{place} tls {version:?} {suite:?}"));
    }

    /// A dialogue line sent to the host, without its line end; never the ticket.
    pub fn sent(&self, line: &str) {
        self.line(&format!("> {line}"));
    }

    /// A dialogue reply the host sent, without its line end.
    pub fn received(&self, line: &str) {
        self.line(&format!("< {line}"));
    }

    /// A handshake message of type `kind` sent.
    pub fn handshake_sent(&self, kind: u32) {
        self.line(&format!("> handshake type {kind}"));
    }

    /// A handshake message of type `kind` received.
    pub fn handshake_received(&self, kind: u32) {
        self.line(&format!("< handshake type {kind}"));
    }

    /// The disk as the host opened it: its capacity and sector size in bytes.
    pub fn opened(&self, capacity: u64, sector_size: u32) {
        self.line(&format!(
            "open: {capacity} bytes, sector size {sector_size}"
        ));
    }

    /// An NBD option by number and what it was answered.
    pub fn option(&self, option: u32, reply: &str) {
        self.line(&format!("nbd option {option}: {reply}"));
    }

    /// The export the client entered, by size.
    pub fn export(&self, size: u64) {
        self.line(&format!("nbd export: {size} bytes"));
    }

    /// Progress: whole gibibytes served, wire bytes per disk byte so far, the depth in use.
    pub fn progress(&self, served: u64, wire: u64, logical: u64, depth: usize) {
        self.line(&format!(
            "progress: served {} GiB, compression ratio {}, depth {depth}",
            served / PROGRESS_STEP,
            ratio(wire, logical)
        ));
    }

    /// The run's end: bytes served, wire bytes, host reads, time since negotiation began.
    pub fn summary(&self, served: u64, wire: u64, reads: u64, elapsed: Duration) {
        self.line(&format!(
            "summary: bytes served {served}, wire bytes {wire}, host reads {reads}, elapsed {:.1} s",
            elapsed.as_secs_f64()
        ));
    }

    fn line(self, text: &str) {
        if self.enabled {
            // A line standard error cannot take is dropped: the disk stream on
            // standard output must not stop because the transcript's reader left.
            let _ = writeln!(io::stderr().lock(), "{text}");
        }
    }
}

/// `wire` over `logical` with two decimals, in integer arithmetic; 0.00 before any byte.
fn ratio(wire: u64, logical: u64) -> String {
    let hundredths = wire.saturating_mul(100) / logical.max(1);
    format!("{}.{:02}", hundredths / 100, hundredths % 100)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_ratio_has_two_decimals_and_is_zero_before_any_byte() {
        for (wire, logical, expected) in [
            (0, 0, "0.00"),
            (42, 100, "0.42"),
            (100, 100, "1.00"),
            (1_234, 1_000, "1.23"),
            (5, 1_000, "0.00"),
            (3, 2, "1.50"),
        ] {
            assert_eq!(ratio(wire, logical), expected, "{wire}/{logical}");
        }
    }
}
