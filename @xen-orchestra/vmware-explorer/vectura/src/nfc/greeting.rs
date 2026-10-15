//! A host's data-port greeting and the capability gate.
//!
//! The line is ASCII, ends in CRLF and reads
//! `220 <version text>: <capability>, <capability>, ...`. An item may carry
//! a `/` suffix, which is not part of its name. Whether the client goes on is
//! decided on the capability names alone, never on the version text.

/// The capability a host must announce before TLS starts on its data port.
///
/// A host without it identifies its data-port certificate by SHA-1 only,
/// which this client refuses to pin.
pub const SHA256_SUPPORTED: &str = "SHA256 supported";

/// The capability of a host that carries the disk session over TLS.
///
/// A host without it carries the disk session in clear after the ticket
/// dialogue, which the client does only when asked for the `nfc` transport.
pub const NFCSSL_SUPPORTED: &str = "NFCSSL supported";

/// The reply code opening every greeting, as Broadcom KB 343952 shows.
///
/// A line without it is not a greeting.
const REPLY_CODE: &str = "220 ";

/// A parsed greeting: the capability names a host announces.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Greeting {
    /// The capability names in the order announced, `/` suffixes dropped.
    pub capabilities: Vec<String>,
}

/// Errors from a greeting line.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum Error {
    /// The line does not start with the greeting reply code.
    #[error("not a greeting line: {0:?}")]
    NotAGreeting(String),
    /// The host does not announce a capability this client needs.
    #[error("the host does not announce {capability:?}; announced: [{}]", announced.join(", "))]
    Missing {
        /// The capability that is required.
        capability: &'static str,
        /// The capabilities the host announced instead.
        announced: Vec<String>,
    },
}

impl Greeting {
    /// Fails, naming `capability` and the announced list, unless the host announces it.
    ///
    /// # Errors
    /// When `capability` is not among the announced names.
    pub fn require(&self, capability: &'static str) -> Result<(), Error> {
        if self.capabilities.iter().any(|name| name == capability) {
            Ok(())
        } else {
            Err(Error::Missing {
                capability,
                announced: self.capabilities.clone(),
            })
        }
    }
}

/// Parses one greeting line, with or without its trailing CRLF.
///
/// # Errors
/// When the line does not start with the greeting reply code.
pub fn parse(line: &[u8]) -> Result<Greeting, Error> {
    let text = String::from_utf8_lossy(line);
    let text = text.trim_end_matches(['\r', '\n']);
    let body = text
        .strip_prefix(REPLY_CODE)
        .ok_or_else(|| Error::NotAGreeting(text.to_owned()))?;
    let list = body.split_once(": ").map_or("", |(_, list)| list);
    let capabilities = list
        .split(',')
        .map(|item| item.split_once('/').map_or(item, |(name, _)| name).trim())
        .filter(|name| !name.is_empty())
        .map(str::to_owned)
        .collect();
    Ok(Greeting { capabilities })
}

/// An ESXi 8 greeting, as quoted in Broadcom KB 341384 (ESXi 6.x to 8.x) and KB 417531 (8.0.3).
#[cfg(test)]
pub(crate) const ESXI_8: &[u8] = b"220 VMware Authentication Daemon Version 1.10: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported/t, SHA256 supported\r\n";

#[cfg(test)]
mod tests {
    use super::*;

    // As quoted in Broadcom KB 338286 (ESXi 6.7 and 7.0).
    const ESXI_6: &[u8] = b"220 VMware Authentication Daemon Version 1.10: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported/t\r\n";

    #[test]
    fn an_esxi_8_greeting_lists_its_capabilities_without_suffixes() {
        let greeting = parse(ESXI_8).unwrap();
        assert_eq!(
            greeting.capabilities,
            [
                "SSL Required",
                "ServerDaemonProtocol:SOAP",
                "MKSDisplayProtocol:VNC",
                "VMXARGS supported",
                "NFCSSL supported",
                "SHA256 supported",
            ]
        );
        assert_eq!(greeting.require(SHA256_SUPPORTED), Ok(()));
    }

    #[test]
    fn an_esxi_6_greeting_is_refused_with_its_capability_list_quoted() {
        let greeting = parse(ESXI_6).unwrap();

        let error = greeting.require(SHA256_SUPPORTED).unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host does not announce \"SHA256 supported\"; announced: [SSL Required, \
             ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC, VMXARGS supported, \
             NFCSSL supported]"
        );
    }

    #[test]
    fn a_line_without_the_reply_code_is_not_a_greeting() {
        for line in [
            &b"VMware Authentication Daemon Version 1.10: SSL Required\r\n"[..],
            b"500 VMware Authentication Daemon Version 1.10: SSL Required\r\n",
            b"220VMware\r\n",
            b"",
        ] {
            let error = parse(line).unwrap_err();
            assert!(matches!(error, Error::NotAGreeting(_)), "{line:?}: {error}");
        }
        assert_eq!(
            parse(b"500 nope\r\n").unwrap_err().to_string(),
            "not a greeting line: \"500 nope\""
        );
    }

    #[test]
    fn nfcssl_support_is_required_by_its_name_and_refused_with_the_list_quoted() {
        assert_eq!(parse(ESXI_8).unwrap().require(NFCSSL_SUPPORTED), Ok(()));
        let without =
            b"220 VMware Authentication Daemon Version 1.10: SSL Required, SHA256 supported\r\n";

        let error = parse(without)
            .unwrap()
            .require(NFCSSL_SUPPORTED)
            .unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host does not announce \"NFCSSL supported\"; announced: [SSL Required, SHA256 supported]"
        );
    }

    #[test]
    fn a_greeting_with_an_empty_capability_list_announces_nothing() {
        for line in [
            &b"220 VMware Authentication Daemon Version 1.10\r\n"[..],
            b"220 VMware Authentication Daemon Version 1.10: \r\n",
            b"220 VMware Authentication Daemon Version 1.10: ,\r\n",
        ] {
            let greeting = parse(line).unwrap();
            assert!(greeting.capabilities.is_empty(), "{line:?}");
            assert_eq!(
                greeting.require(SHA256_SUPPORTED).unwrap_err().to_string(),
                "the host does not announce \"SHA256 supported\"; announced: []"
            );
        }
    }

    #[test]
    fn the_gate_reads_capability_names_and_not_the_version_text() {
        let greeting = parse(b"220 SHA256 supported daemon: SSL Required\r\n").unwrap();
        assert_eq!(greeting.capabilities, ["SSL Required"]);
        assert!(greeting.require(SHA256_SUPPORTED).is_err());
        assert_eq!(greeting.require("SSL Required"), Ok(()));
    }

    #[test]
    fn a_capability_name_must_match_whole_and_case_sensitive() {
        let greeting = parse(b"220 d: SHA256 supported/t, sha256 supportedx\r\n").unwrap();

        assert_eq!(
            greeting.capabilities,
            ["SHA256 supported", "sha256 supportedx"]
        );
        assert_eq!(greeting.require(SHA256_SUPPORTED), Ok(()));
        assert!(greeting.require("sha256 supported").is_err());
        assert!(greeting.require("SHA256").is_err());
    }
}
