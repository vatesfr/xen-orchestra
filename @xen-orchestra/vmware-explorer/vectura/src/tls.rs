//! TLS toward a host: connect with timeouts, judge or capture its certificate, compute thumbprints.
//!
//! [`Client`] carries real traffic and judges the certificate by a [`Trust`]:
//! the system roots, a bundle of anchors, or one pinned thumbprint. The
//! accept-everything verifier never leaves this module: [`capture`] runs a TLS
//! handshake with it, sends nothing afterwards and drops the connection
//! before returning.

use std::fmt;
use std::io;
use std::net::{TcpStream, ToSocketAddrs};
use std::sync::{Arc, Mutex, PoisonError};
use std::time::Duration;

use aws_lc_rs::digest;
use rustls::client::danger::{HandshakeSignatureValid, ServerCertVerified, ServerCertVerifier};
use rustls::crypto::aws_lc_rs::default_provider;
use rustls::crypto::{CryptoProvider, verify_tls12_signature, verify_tls13_signature};
use rustls::{
    CertificateError, CipherSuite, ClientConfig, ClientConnection, DigitallySignedStruct,
    ProtocolVersion, RootCertStore, SignatureScheme,
};
use rustls_pki_types::{CertificateDer, InvalidDnsNameError, ServerName, UnixTime};

/// How long a TCP connect may take before the host counts as unreachable.
///
/// Ten seconds: a host on the same network answers within milliseconds, and
/// one that takes longer is down or filtered, so waiting out the kernel's own
/// limit of about two minutes would only stall the operator.
pub const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);

/// How long one read or write on a host connection may block.
///
/// Sixty seconds: a busy host can take tens of seconds to answer a request,
/// so a shorter limit would report false failures, while a longer one leaves
/// a dead connection undetected for as long. Every host socket carries it.
pub const IO_TIMEOUT: Duration = Duration::from_secs(60);

/// Errors from connecting to a host or judging its certificate.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// No address of the host accepted the connection.
    #[error("could not connect: {}", describe(.0))]
    Connect(#[source] io::Error),
    /// The TLS handshake failed, or its I/O timed out.
    #[error("tls handshake failed: {}", describe(.0))]
    TlsHandshake(#[source] io::Error),
    /// The host presented a certificate whose thumbprint is not the pinned one.
    #[error("certificate thumbprint mismatch: expected {expected}, the host presented {presented}")]
    Mismatch {
        /// The pin the certificate had to match.
        expected: Pin,
        /// The thumbprint of the certificate the host presented, same algorithm.
        presented: String,
    },
    /// The TLS handshake ended without something a completed one always has.
    #[error("the tls handshake ended without {0}")]
    Incomplete(&'static str),
    /// The host is neither a DNS name nor an IP address.
    #[error("invalid host name: {0}")]
    HostName(#[source] InvalidDnsNameError),
    /// A thumbprint is not the hex digest its algorithm produces.
    #[error("{text:?} is not a {name} thumbprint of {digits} hex digits")]
    Thumbprint {
        /// The algorithm the thumbprint was parsed for.
        name: &'static str,
        /// How many hex digits that algorithm's digest has.
        digits: usize,
        /// The text that was offered.
        text: String,
    },
    /// No trust anchor could be loaded.
    #[error("no trust anchor: {0}")]
    Roots(String),
    /// rustls rejected the client configuration.
    #[error("tls configuration rejected: {0}")]
    Config(#[source] rustls::Error),
}

/// What a host presented during a TLS handshake that carried nothing else.
#[derive(Debug)]
pub struct Presented {
    /// The first certificate of the chain the host sent, DER encoded.
    pub certificate: CertificateDer<'static>,
    /// The negotiated protocol version.
    pub version: ProtocolVersion,
    /// The negotiated cipher suite.
    pub suite: CipherSuite,
}

/// How the certificate a host presents is judged.
#[derive(Debug)]
pub enum Trust {
    /// The system trust store, with the host name checked against the certificate.
    System,
    /// The anchors of a PEM bundle, with the host name checked against the certificate.
    Anchors(Vec<CertificateDer<'static>>),
    /// One exact certificate named by its thumbprint; no chain and no host name.
    Pin(Pin),
}

/// The digest the DER certificate a host presents must have.
///
/// Parsed from hex text, colons and case ignored, and compared as bytes.
#[derive(Clone, PartialEq, Eq)]
pub struct Pin {
    algorithm: &'static digest::Algorithm,
    name: &'static str,
    expected: Vec<u8>,
}

impl Pin {
    /// Parses a SHA-256 thumbprint: 64 hex digits, colons and case ignored.
    ///
    /// # Errors
    /// When `text` is not 64 hex digits once its colons are removed.
    pub fn sha256(text: &str) -> Result<Pin, Error> {
        Pin::parse(&digest::SHA256, "sha256", text)
    }

    /// Parses a SHA-1 thumbprint: 40 hex digits, colons and case ignored.
    ///
    /// # Errors
    /// When `text` is not 40 hex digits once its colons are removed.
    pub fn sha1(text: &str) -> Result<Pin, Error> {
        Pin::parse(&digest::SHA1_FOR_LEGACY_USE_ONLY, "sha1", text)
    }

    fn parse(
        algorithm: &'static digest::Algorithm,
        name: &'static str,
        text: &str,
    ) -> Result<Pin, Error> {
        let digits = algorithm.output_len() * 2;
        let malformed = || Error::Thumbprint {
            name,
            digits,
            text: text.to_owned(),
        };
        let hex: Vec<u8> = text.bytes().filter(|byte| *byte != b':').collect();
        if hex.len() != digits {
            return Err(malformed());
        }
        let expected = hex
            .chunks(2)
            .map(|pair| {
                std::str::from_utf8(pair)
                    .ok()
                    .and_then(|pair| u8::from_str_radix(pair, 16).ok())
                    .ok_or_else(malformed)
            })
            .collect::<Result<Vec<u8>, Error>>()?;
        Ok(Pin {
            algorithm,
            name,
            expected,
        })
    }

    /// Whether `der` has the pinned digest.
    #[must_use]
    pub fn matches(&self, der: &[u8]) -> bool {
        digest::digest(self.algorithm, der).as_ref() == self.expected.as_slice()
    }

    /// The digest of `der` with this pin's algorithm, rendered like the pin.
    #[must_use]
    pub fn digest_of(&self, der: &[u8]) -> String {
        colon_hex(digest::digest(self.algorithm, der).as_ref())
    }
}

impl fmt::Display for Pin {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}:{}", self.name, colon_hex(&self.expected))
    }
}

impl fmt::Debug for Pin {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(self, formatter)
    }
}

/// A TLS client configuration built for one [`Trust`].
#[derive(Debug)]
pub struct Client {
    config: Arc<ClientConfig>,
    pinned: Option<Arc<Verifier>>,
}

impl Client {
    /// Builds a client that judges certificates by `trust`.
    ///
    /// # Errors
    /// When no anchor can be loaded or rustls rejects the configuration.
    pub fn new(trust: &Trust) -> Result<Client, Error> {
        let provider = Arc::new(default_provider());
        let builder = ClientConfig::builder_with_provider(Arc::clone(&provider))
            .with_safe_default_protocol_versions()
            .map_err(Error::Config)?;
        let mut roots = RootCertStore::empty();
        let (config, pinned) = match trust {
            Trust::Pin(pin) => {
                let verifier = Arc::new(Verifier::new(Some(pin.clone()), provider));
                let config = builder
                    .dangerous()
                    .with_custom_certificate_verifier(
                        Arc::clone(&verifier) as Arc<dyn ServerCertVerifier>
                    )
                    .with_no_client_auth();
                (config, Some(verifier))
            }
            Trust::Anchors(anchors) => {
                roots.add_parsable_certificates(anchors.iter().cloned());
                if roots.is_empty() {
                    return Err(Error::Roots("the bundle holds no certificate".to_owned()));
                }
                (
                    builder.with_root_certificates(roots).with_no_client_auth(),
                    None,
                )
            }
            Trust::System => {
                let loaded = rustls_native_certs::load_native_certs();
                roots.add_parsable_certificates(loaded.certs);
                if roots.is_empty() {
                    let reason = loaded.errors.first().map_or_else(
                        || "the system store holds no certificate".to_owned(),
                        ToString::to_string,
                    );
                    return Err(Error::Roots(reason));
                }
                (
                    builder.with_root_certificates(roots).with_no_client_auth(),
                    None,
                )
            }
        };
        Ok(Client {
            config: Arc::new(config),
            pinned,
        })
    }

    /// Runs a TLS handshake for `host` on `stream` and returns the session.
    ///
    /// # Errors
    /// When `host` is neither a DNS name nor an IP address, the certificate is
    /// refused, or the TLS handshake fails or times out.
    pub fn handshake(&self, stream: &mut TcpStream, host: &str) -> Result<ClientConnection, Error> {
        let name = ServerName::try_from(host)
            .map_err(Error::HostName)?
            .to_owned();
        let mut connection =
            ClientConnection::new(Arc::clone(&self.config), name).map_err(Error::Config)?;
        while connection.is_handshaking() {
            if let Err(error) = connection.complete_io(stream) {
                return Err(self
                    .pinned
                    .as_ref()
                    .and_then(|verifier| verifier.rejection())
                    .unwrap_or(Error::TlsHandshake(error)));
            }
        }
        Ok(connection)
    }
}

/// Opens a TCP connection to `host:port` with both timeouts applied.
///
/// Every address the name resolves to is tried in turn, with
/// [`CONNECT_TIMEOUT`] each; the stream returned carries [`IO_TIMEOUT`] for
/// reads and writes.
///
/// # Errors
/// When the name does not resolve, no address accepts the connection in
/// time, or the socket timeouts cannot be set.
pub fn connect(host: &str, port: u16) -> Result<TcpStream, Error> {
    let mut last = io::Error::new(io::ErrorKind::NotFound, "the name resolves to no address");
    for address in (host, port).to_socket_addrs().map_err(Error::Connect)? {
        match TcpStream::connect_timeout(&address, CONNECT_TIMEOUT) {
            Ok(stream) => {
                stream
                    .set_read_timeout(Some(IO_TIMEOUT))
                    .map_err(Error::Connect)?;
                stream
                    .set_write_timeout(Some(IO_TIMEOUT))
                    .map_err(Error::Connect)?;
                return Ok(stream);
            }
            Err(error) => last = error,
        }
    }
    Err(Error::Connect(last))
}

/// Runs a TLS handshake on `stream` for `host` and returns what the host presented.
///
/// The certificate is accepted whatever it says, because the caller wants its
/// thumbprints rather than a verdict. The TLS handshake signatures are still
/// checked, so the host does hold the private key of the certificate reported.
/// Nothing is sent after the TLS handshake, and the connection is dropped on
/// return.
///
/// # Errors
/// When `host` is neither a DNS name nor an IP address, the TLS handshake
/// fails or times out, or it ends without a certificate.
pub(crate) fn capture(stream: &mut TcpStream, host: &str) -> Result<Presented, Error> {
    let provider = Arc::new(default_provider());
    let config = ClientConfig::builder_with_provider(Arc::clone(&provider))
        .with_safe_default_protocol_versions()
        .map_err(Error::Config)?
        .dangerous()
        .with_custom_certificate_verifier(Arc::new(Verifier::new(None, provider)))
        .with_no_client_auth();
    let client = Client {
        config: Arc::new(config),
        pinned: None,
    };
    let connection = client.handshake(stream, host)?;
    let certificate = peer_certificate(&connection)?;
    let (version, suite) = negotiated(&connection)?;
    Ok(Presented {
        certificate,
        version,
        suite,
    })
}

/// The protocol version and cipher suite a completed session negotiated.
///
/// # Errors
/// When the session has not completed its handshake.
pub(crate) fn negotiated(
    connection: &ClientConnection,
) -> Result<(ProtocolVersion, CipherSuite), Error> {
    let version = connection
        .protocol_version()
        .ok_or(Error::Incomplete("a protocol version"))?;
    let suite = connection
        .negotiated_cipher_suite()
        .ok_or(Error::Incomplete("a cipher suite"))?
        .suite();
    Ok((version, suite))
}

/// The first certificate of the chain a completed session's peer sent.
///
/// # Errors
/// When the session carries no certificate.
pub(crate) fn peer_certificate(
    connection: &ClientConnection,
) -> Result<CertificateDer<'static>, Error> {
    connection
        .peer_certificates()
        .and_then(|chain| chain.first())
        .cloned()
        .ok_or(Error::Incomplete("a certificate"))
}

/// Formats the SHA-256 digest of `der` as colon-separated upper-case hex.
#[must_use]
pub fn sha256(der: &[u8]) -> String {
    colon_hex(digest::digest(&digest::SHA256, der).as_ref())
}

/// Formats the SHA-1 digest of `der` as colon-separated upper-case hex.
#[must_use]
pub fn sha1(der: &[u8]) -> String {
    colon_hex(digest::digest(&digest::SHA1_FOR_LEGACY_USE_ONLY, der).as_ref())
}

/// Renders an I/O error, naming a timeout for what it is.
///
/// A socket with a read or write timeout reports `WouldBlock` on Linux, whose
/// own message ("Resource temporarily unavailable") hides the cause.
pub(crate) fn describe(error: &io::Error) -> String {
    match error.kind() {
        io::ErrorKind::WouldBlock | io::ErrorKind::TimedOut => "timed out".to_owned(),
        _ => error.to_string(),
    }
}

fn colon_hex(bytes: &[u8]) -> String {
    bytes
        .iter()
        .map(|byte| format!("{byte:02X}"))
        .collect::<Vec<_>>()
        .join(":")
}

/// Judges the end-entity certificate by its digest alone, remembering what was presented.
///
/// Without a pin every certificate is accepted, which only [`capture`] wants.
/// TLS handshake signatures are verified with the provider's algorithms
/// either way, so a completed TLS handshake proves the host holds the
/// certificate's key.
#[derive(Debug)]
struct Verifier {
    pin: Option<Pin>,
    provider: Arc<CryptoProvider>,
    presented: Mutex<Option<CertificateDer<'static>>>,
}

impl Verifier {
    fn new(pin: Option<Pin>, provider: Arc<CryptoProvider>) -> Verifier {
        Verifier {
            pin,
            provider,
            presented: Mutex::new(None),
        }
    }

    /// The mismatch error, when a certificate was presented and refused.
    fn rejection(&self) -> Option<Error> {
        let pin = self.pin.as_ref()?;
        let presented = self
            .presented
            .lock()
            .unwrap_or_else(PoisonError::into_inner);
        let der = presented.as_ref().filter(|der| !pin.matches(der))?;
        Some(Error::Mismatch {
            expected: pin.clone(),
            presented: pin.digest_of(der),
        })
    }
}

impl ServerCertVerifier for Verifier {
    fn verify_server_cert(
        &self,
        end_entity: &CertificateDer<'_>,
        _intermediates: &[CertificateDer<'_>],
        _server_name: &ServerName<'_>,
        _ocsp_response: &[u8],
        _now: UnixTime,
    ) -> Result<ServerCertVerified, rustls::Error> {
        *self
            .presented
            .lock()
            .unwrap_or_else(PoisonError::into_inner) = Some(end_entity.clone().into_owned());
        match &self.pin {
            Some(pin) if !pin.matches(end_entity) => Err(rustls::Error::InvalidCertificate(
                CertificateError::ApplicationVerificationFailure,
            )),
            _ => Ok(ServerCertVerified::assertion()),
        }
    }

    fn verify_tls12_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        verify_tls12_signature(
            message,
            cert,
            dss,
            &self.provider.signature_verification_algorithms,
        )
    }

    fn verify_tls13_signature(
        &self,
        message: &[u8],
        cert: &CertificateDer<'_>,
        dss: &DigitallySignedStruct,
    ) -> Result<HandshakeSignatureValid, rustls::Error> {
        verify_tls13_signature(
            message,
            cert,
            dss,
            &self.provider.signature_verification_algorithms,
        )
    }

    fn supported_verify_schemes(&self) -> Vec<SignatureScheme> {
        self.provider
            .signature_verification_algorithms
            .supported_schemes()
    }
}

#[cfg(test)]
mod tests {
    use std::io::Read;
    use std::net::TcpListener;
    use std::thread;

    use rustls::{ServerConfig, ServerConnection};
    use rustls_pki_types::{PrivateKeyDer, PrivatePkcs8KeyDer};

    use super::*;

    const SHA256_OF_ABC: &str = "BA:78:16:BF:8F:01:CF:EA:41:41:40:DE:5D:AE:22:23:\
                                 B0:03:61:A3:96:17:7A:9C:B4:10:FF:61:F2:00:15:AD";

    /// A loopback TLS server presenting a fresh self-signed certificate.
    fn server() -> (CertificateDer<'static>, u16) {
        let issued = rcgen::generate_simple_self_signed(vec!["esxi.test".to_owned()]).unwrap();
        let certificate = issued.cert.der().clone();
        let key =
            PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(issued.signing_key.serialize_der()));
        let config = Arc::new(
            ServerConfig::builder()
                .with_no_client_auth()
                .with_single_cert(vec![certificate.clone()], key)
                .unwrap(),
        );
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut session = ServerConnection::new(config).unwrap();
            while session.is_handshaking() {
                if session.complete_io(&mut stream).is_err() {
                    return;
                }
            }
        });
        (certificate, port)
    }

    #[test]
    fn sha256_is_rendered_as_upper_case_hex_with_colons() {
        assert_eq!(sha256(b"abc"), SHA256_OF_ABC);
    }

    #[test]
    fn sha1_is_rendered_as_upper_case_hex_with_colons() {
        assert_eq!(
            sha1(b"abc"),
            "A9:99:3E:36:47:06:81:6A:BA:3E:25:71:78:50:C2:6C:9C:D0:D8:9D"
        );
    }

    #[test]
    fn a_pin_ignores_colons_and_case_and_prints_canonically() {
        let lower = SHA256_OF_ABC.replace(':', "").to_lowercase();
        let pin = Pin::sha256(&lower).unwrap();
        assert_eq!(pin, Pin::sha256(SHA256_OF_ABC).unwrap());
        assert!(pin.matches(b"abc"));
        assert!(!pin.matches(b"abd"));
        assert_eq!(pin.to_string(), format!("sha256:{SHA256_OF_ABC}"));
        assert_eq!(format!("{pin:?}"), pin.to_string());
        assert_eq!(pin.digest_of(b"abc"), SHA256_OF_ABC);
    }

    #[test]
    fn a_sha1_pin_wants_forty_digits_and_a_sha256_pin_sixty_four() {
        let sha1_text = sha1(b"abc");
        assert!(Pin::sha1(&sha1_text).unwrap().matches(b"abc"));
        let error = Pin::sha256(&sha1_text).unwrap_err();
        assert_eq!(
            error.to_string(),
            format!("{sha1_text:?} is not a sha256 thumbprint of 64 hex digits")
        );
        let error = Pin::sha1(SHA256_OF_ABC).unwrap_err();
        assert!(
            error
                .to_string()
                .ends_with("is not a sha1 thumbprint of 40 hex digits")
        );
    }

    #[test]
    fn a_pin_with_a_non_hex_digit_or_a_multibyte_character_is_refused() {
        let with_letter = format!("G{}", &SHA256_OF_ABC[1..]);
        assert!(matches!(
            Pin::sha256(&with_letter),
            Err(Error::Thumbprint { name: "sha256", .. })
        ));
        let with_accent = format!("é{}", &SHA256_OF_ABC[2..]);
        assert!(Pin::sha256(&with_accent).is_err());
        let with_three_byte = format!("€{}", &SHA256_OF_ABC[3..]);
        assert!(Pin::sha256(&with_three_byte).is_err());
    }

    #[test]
    fn a_pinned_client_completes_the_handshake_with_the_pinned_certificate() {
        let (certificate, port) = server();
        let client = Client::new(&Trust::Pin(Pin::sha256(&sha256(&certificate)).unwrap())).unwrap();
        let mut stream = connect("127.0.0.1", port).unwrap();

        let session = client.handshake(&mut stream, "127.0.0.1").unwrap();

        assert_eq!(peer_certificate(&session).unwrap(), certificate);
    }

    #[test]
    fn a_pinned_client_refuses_another_certificate_naming_both_thumbprints() {
        let (certificate, port) = server();
        let pin = Pin::sha1(&sha1(b"another certificate")).unwrap();
        let client = Client::new(&Trust::Pin(pin.clone())).unwrap();
        let mut stream = connect("127.0.0.1", port).unwrap();

        let error = client.handshake(&mut stream, "127.0.0.1").unwrap_err();

        assert_eq!(
            error.to_string(),
            format!(
                "certificate thumbprint mismatch: expected {pin}, the host presented {}",
                sha1(&certificate)
            )
        );
    }

    #[test]
    fn a_self_signed_certificate_is_its_own_anchor_but_needs_the_right_name() {
        let (certificate, port) = server();
        let client = Client::new(&Trust::Anchors(vec![certificate])).unwrap();
        let mut stream = connect("127.0.0.1", port).unwrap();

        let error = client.handshake(&mut stream, "127.0.0.1").unwrap_err();

        assert!(matches!(error, Error::TlsHandshake(_)), "{error:?}");
        assert!(error.to_string().starts_with("tls handshake failed: "));
    }

    #[test]
    fn an_empty_bundle_is_refused_before_connecting() {
        let error = Client::new(&Trust::Anchors(Vec::new())).unwrap_err();
        assert_eq!(
            error.to_string(),
            "no trust anchor: the bundle holds no certificate"
        );
    }

    #[test]
    fn the_system_roots_refuse_a_self_signed_certificate() {
        let (_, port) = server();
        let client = Client::new(&Trust::System).unwrap();
        let mut stream = connect("127.0.0.1", port).unwrap();

        let error = client.handshake(&mut stream, "127.0.0.1").unwrap_err();

        assert!(matches!(error, Error::TlsHandshake(_)), "{error:?}");
    }

    #[test]
    fn a_timeout_is_described_as_such_and_other_errors_keep_their_message() {
        let timeout = io::Error::from(io::ErrorKind::WouldBlock);
        assert_eq!(describe(&timeout), "timed out");
        let timeout = io::Error::from(io::ErrorKind::TimedOut);
        assert_eq!(describe(&timeout), "timed out");
        let other = io::Error::other("boom");
        assert_eq!(describe(&other), "boom");
    }

    #[test]
    fn connect_applies_the_io_timeout_to_both_directions() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();

        let stream = connect("127.0.0.1", port).unwrap();

        assert_eq!(stream.read_timeout().unwrap(), Some(IO_TIMEOUT));
        assert_eq!(stream.write_timeout().unwrap(), Some(IO_TIMEOUT));
    }

    #[test]
    fn a_refused_port_is_reported_as_a_connect_failure() {
        let port = TcpListener::bind("127.0.0.1:0")
            .unwrap()
            .local_addr()
            .unwrap()
            .port();

        let error = connect("127.0.0.1", port).unwrap_err();

        assert!(matches!(error, Error::Connect(_)), "{error:?}");
        assert!(error.to_string().starts_with("could not connect: "));
    }

    #[test]
    fn an_invalid_host_name_is_refused_before_any_byte_is_sent() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let mut stream = TcpStream::connect(listener.local_addr().unwrap()).unwrap();

        let error = capture(&mut stream, "not a name").unwrap_err();

        assert!(matches!(error, Error::HostName(_)), "{error:?}");
        assert!(error.to_string().starts_with("invalid host name: "));
        drop(stream);
        let (mut peer, _) = listener.accept().unwrap();
        let mut received = Vec::new();
        peer.read_to_end(&mut received).unwrap();
        assert!(received.is_empty(), "bytes were sent: {received:?}");
    }
}
