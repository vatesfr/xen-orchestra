//! TLS 1.2 with RSA key exchange, for a data port that offers nothing else.
//!
//! The data port of some ESXi 6.5 hosts accepts no ECDHE suite, and rustls
//! implements no other key exchange. This module runs the handshake with
//! OpenSSL instead, restricted to the two AES-GCM suites of RFC 5288 that use
//! RSA key exchange. Such a session has no forward secrecy: whoever later
//! obtains the host's private key can decrypt a recording of it.
//!
//! No chain and no host name are checked here. The certificate is judged by
//! its thumbprint alone, before the session is handed to the caller. The
//! handshake has by then sent `ClientKeyExchange` and `Finished`, but no
//! ticket and no application data reach a host that presented another
//! certificate.

// Rust guideline compliant 2026-10-09

use std::io;
use std::net::TcpStream;

use openssl::error::ErrorStack;
use openssl::ssl::{
    HandshakeError, Ssl, SslContext, SslMethod, SslStream, SslVerifyMode, SslVersion,
};
use rustls::{CipherSuite, ProtocolVersion};
use rustls_pki_types::CertificateDer;

use super::{Error, Pin};

/// The suites offered, in OpenSSL's names: RSA key exchange with AES-GCM.
///
/// `TLS_RSA_WITH_AES_256_GCM_SHA384` and `TLS_RSA_WITH_AES_128_GCM_SHA256`.
/// The CBC suites a host may also accept are left out: they would add the
/// padding-oracle exposure of MAC-then-encrypt for no host known to need them.
const SUITES: &str = "AES256-GCM-SHA384:AES128-GCM-SHA256";

/// OpenSSL's reason code for a `handshake_failure` alert received from the peer.
///
/// `SSL_R_SSLV3_ALERT_HANDSHAKE_FAILURE`: 1000 (`SSL_AD_REASON_OFFSET`) plus
/// the alert's number, 40. A server sends this alert when it shares no suite
/// with the client.
const HANDSHAKE_FAILURE_ALERT: i32 = 1040;

/// OpenSSL's number for its SSL library, `ERR_LIB_SSL`.
///
/// Reason codes are numbered per library: 1040 names the alert only in an
/// error the SSL library raised.
const SSL_LIBRARY: i32 = 20;

/// Runs the TLS handshake on a clone of `stream` and returns the session.
///
/// With a `pin`, the certificate presented must match it; without one any
/// certificate is accepted, which only a thumbprint capture wants. The
/// session owns its clone of the socket: dropping it sends no close notify
/// and leaves `stream` open.
///
/// # Errors
/// When the host refuses both suites, presents another certificate than the
/// pinned one, or the handshake fails or times out.
pub(super) fn handshake(
    stream: &TcpStream,
    pin: Option<&Pin>,
) -> Result<SslStream<TcpStream>, Error> {
    let ssl = configure().map_err(Error::LegacyConfig)?;
    let socket = stream.try_clone().map_err(Error::TlsHandshake)?;
    let session = ssl.connect(socket).map_err(failure)?;
    if let Some(pin) = pin {
        let presented = certificate(&session)?;
        if !pin.matches(&presented) {
            return Err(Error::Mismatch {
                expected: pin.clone(),
                presented: pin.digest_of(&presented),
            });
        }
    }
    Ok(session)
}

/// The first certificate the peer of `session` sent, DER encoded.
///
/// # Errors
/// When the session carries no certificate.
pub(super) fn certificate(
    session: &SslStream<TcpStream>,
) -> Result<CertificateDer<'static>, Error> {
    session
        .ssl()
        .peer_certificate()
        .and_then(|certificate| certificate.to_der().ok())
        .map(CertificateDer::from)
        .ok_or(Error::Incomplete("a certificate"))
}

/// The protocol version and cipher suite `session` negotiated.
///
/// # Errors
/// When the session reports no suite, or another version than TLS 1.2.
pub(super) fn negotiated(
    session: &SslStream<TcpStream>,
) -> Result<(ProtocolVersion, CipherSuite), Error> {
    if session.ssl().version2() != Some(SslVersion::TLS1_2) {
        return Err(Error::Incomplete("a protocol version"));
    }
    let suite = session
        .ssl()
        .current_cipher()
        .ok_or(Error::Incomplete("a cipher suite"))?;
    Ok((
        ProtocolVersion::TLSv1_2,
        CipherSuite::from(u16::from_be_bytes(suite.protocol_id())),
    ))
}

/// A client restricted to TLS 1.2 and [`SUITES`], with no chain verification.
fn configure() -> Result<Ssl, ErrorStack> {
    let mut context = SslContext::builder(SslMethod::tls_client())?;
    context.set_min_proto_version(Some(SslVersion::TLS1_2))?;
    context.set_max_proto_version(Some(SslVersion::TLS1_2))?;
    context.set_cipher_list(SUITES)?;
    // The thumbprint is the whole verdict, given by `handshake`.
    context.set_verify(SslVerifyMode::NONE);
    Ssl::new(&context.build())
}

/// Turns a failed handshake into the error that names its cause.
fn failure(error: HandshakeError<TcpStream>) -> Error {
    match error {
        HandshakeError::SetupFailure(stack) => Error::LegacyConfig(stack),
        // The socket carries a timeout, which OpenSSL reports as a retry.
        HandshakeError::WouldBlock(_) => Error::TlsHandshake(io::ErrorKind::TimedOut.into()),
        HandshakeError::Failure(interrupted) => {
            let error = interrupted.into_error();
            let refused = error.ssl_error().is_some_and(|stack| {
                stack
                    .errors()
                    .iter()
                    .any(|entry| is_refusal(entry.library_code(), entry.reason_code()))
            });
            if refused {
                Error::NoCommonSuite
            } else {
                Error::TlsHandshake(error.into_io_error().unwrap_or_else(io::Error::other))
            }
        }
    }
}

/// Whether an error stack entry is the peer's `handshake_failure` alert.
fn is_refusal(library: i32, reason: i32) -> bool {
    library == SSL_LIBRARY && reason == HANDSHAKE_FAILURE_ALERT
}

#[cfg(test)]
mod tests {
    use std::io::Read;
    use std::net::TcpListener;
    use std::thread::{self, JoinHandle};

    use openssl::asn1::Asn1Time;
    use openssl::hash::MessageDigest;
    use openssl::pkey::PKey;
    use openssl::rsa::Rsa;
    use openssl::x509::{X509, X509NameBuilder};

    use super::super::{Client, Session, Trust, capture, capture_rsa_kx, connect, rsa_kx, sha256};
    use super::*;

    /// A self-signed certificate with an RSA key, which RSA key exchange needs.
    fn issue() -> (X509, PKey<openssl::pkey::Private>) {
        let key = PKey::from_rsa(Rsa::generate(2048).unwrap()).unwrap();
        let mut name = X509NameBuilder::new().unwrap();
        name.append_entry_by_text("CN", "esxi.test").unwrap();
        let name = name.build();
        let mut certificate = X509::builder().unwrap();
        certificate.set_version(2).unwrap();
        certificate.set_subject_name(&name).unwrap();
        certificate.set_issuer_name(&name).unwrap();
        certificate.set_pubkey(&key).unwrap();
        certificate
            .set_not_before(&Asn1Time::days_from_now(0).unwrap())
            .unwrap();
        certificate
            .set_not_after(&Asn1Time::days_from_now(1).unwrap())
            .unwrap();
        certificate.sign(&key, MessageDigest::sha256()).unwrap();
        (certificate.build(), key)
    }

    /// A loopback TLS 1.2 server offering `suites` alone, for `connections` clients.
    ///
    /// The thread returns the bytes each client sent after its handshake, or
    /// `None` when the handshake failed.
    fn server(
        suites: &'static str,
        connections: usize,
    ) -> (
        CertificateDer<'static>,
        u16,
        JoinHandle<Vec<Option<Vec<u8>>>>,
    ) {
        let (certificate, key) = issue();
        let der = CertificateDer::from(certificate.to_der().unwrap());
        let mut context = SslContext::builder(SslMethod::tls_server()).unwrap();
        context
            .set_max_proto_version(Some(SslVersion::TLS1_2))
            .unwrap();
        context.set_cipher_list(suites).unwrap();
        context.set_certificate(&certificate).unwrap();
        context.set_private_key(&key).unwrap();
        let context = context.build();
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let served = thread::spawn(move || {
            (0..connections)
                .map(|_| {
                    let (stream, _) = listener.accept().unwrap();
                    let mut session = Ssl::new(&context).unwrap().accept(stream).ok()?;
                    let mut received = Vec::new();
                    // The client leaves without a close notify, which reads as an error.
                    let _ = session.read_to_end(&mut received);
                    Some(received)
                })
                .collect()
        });
        (der, port, served)
    }

    #[test]
    fn an_rsa_only_host_refuses_rustls_then_completes_the_fallback_with_the_pinned_certificate() {
        let (certificate, port, served) = server("AES256-GCM-SHA384", 2);
        let pin = Pin::sha256(&sha256(&certificate)).unwrap();
        let client = Client::new(&Trust::Pin(pin.clone())).unwrap();
        let mut stream = connect("127.0.0.1", port).unwrap();

        let refusal = client.handshake(&mut stream, "127.0.0.1").unwrap_err();

        assert!(refusal.refused_suites(), "{refusal:?}");
        let stream = connect("127.0.0.1", port).unwrap();
        let session = rsa_kx(&stream, &pin).unwrap();
        assert!(matches!(session, Session::RsaKx(_)));
        assert_eq!(session.certificate().unwrap(), certificate);
        assert_eq!(
            session.negotiated().unwrap(),
            (
                ProtocolVersion::TLSv1_2,
                CipherSuite::TLS_RSA_WITH_AES_256_GCM_SHA384
            )
        );
        drop(session);
        drop(stream);
        assert_eq!(served.join().unwrap(), [None, Some(Vec::new())]);
    }

    #[test]
    fn the_fallback_capture_reports_the_certificate_and_the_128_bit_suite() {
        let (certificate, port, _) = server("AES128-GCM-SHA256", 1);
        let stream = connect("127.0.0.1", port).unwrap();

        let presented = capture_rsa_kx(&stream).unwrap();

        assert_eq!(presented.certificate, certificate);
        assert_eq!(presented.version, ProtocolVersion::TLSv1_2);
        assert_eq!(
            presented.suite,
            CipherSuite::TLS_RSA_WITH_AES_128_GCM_SHA256
        );
    }

    #[test]
    fn a_pin_mismatch_on_the_fallback_is_refused_before_any_write() {
        let (certificate, port, served) = server("AES256-GCM-SHA384", 1);
        let pin = Pin::sha256(&sha256(b"another certificate")).unwrap();
        let stream = connect("127.0.0.1", port).unwrap();

        let error = rsa_kx(&stream, &pin).unwrap_err();

        assert_eq!(
            error.to_string(),
            format!(
                "certificate thumbprint mismatch: expected {pin}, the host presented {}",
                sha256(&certificate)
            )
        );
        assert!(!error.refused_suites());
        drop(stream);
        assert_eq!(served.join().unwrap(), [Some(Vec::new())]);
    }

    #[test]
    fn a_host_offering_only_cbc_with_rsa_key_exchange_shares_no_suite() {
        let (certificate, port, _) = server("AES256-SHA256", 2);
        let mut stream = connect("127.0.0.1", port).unwrap();
        let refusal = capture(&mut stream, "127.0.0.1").unwrap_err();
        assert!(refusal.refused_suites(), "{refusal:?}");
        let stream = connect("127.0.0.1", port).unwrap();

        let error = rsa_kx(&stream, &Pin::sha256(&sha256(&certificate)).unwrap()).unwrap_err();

        assert!(matches!(error, Error::NoCommonSuite), "{error:?}");
        assert_eq!(
            error.to_string(),
            "host refused every supported TLS suite (ECDHE, then RSA key exchange with AES-GCM)"
        );
    }

    #[test]
    fn the_alert_reason_code_is_a_refusal_only_from_the_ssl_library() {
        // 6 is ERR_LIB_EVP, whose reason codes are numbered on their own.
        assert!(is_refusal(SSL_LIBRARY, HANDSHAKE_FAILURE_ALERT));
        assert!(!is_refusal(6, HANDSHAKE_FAILURE_ALERT));
        assert!(!is_refusal(SSL_LIBRARY, HANDSHAKE_FAILURE_ALERT + 1));
    }

    #[test]
    fn a_host_that_closes_during_the_fallback_is_a_handshake_failure_not_a_refusal() {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let closing = thread::spawn(move || drop(listener.accept().unwrap()));
        let stream = connect("127.0.0.1", port).unwrap();
        closing.join().unwrap();

        let error = capture_rsa_kx(&stream).unwrap_err();

        assert!(matches!(error, Error::TlsHandshake(_)), "{error:?}");
        assert!(!error.refused_suites());
    }
}
