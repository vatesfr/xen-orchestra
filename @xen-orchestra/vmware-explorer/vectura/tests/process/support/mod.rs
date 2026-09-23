//! A mock ESXi host on loopback with a management port and a data port.
//!
//! The management port answers the five vSphere API calls with canned
//! replies, one TLS connection per call; the data port runs the greeting,
//! both TLS sessions, the ticket dialogue, the handshake and the record
//! protocol. Both record what they see, in order and before they reply, so
//! once the client has exited the log is complete. The wire constants here
//! are written from the public documents, not taken from the crate, so the
//! crate is not its own oracle.

pub mod nbd;

use std::io::{self, Read, Write};
use std::net::{TcpListener, TcpStream};
use std::sync::mpsc::{self, Receiver};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use aws_lc_rs::digest::{self, Algorithm, SHA1_FOR_LEGACY_USE_ONLY, SHA256};
use rustls::{IoState, ServerConfig, ServerConnection, Stream};
use rustls_pki_types::{CertificateDer, PrivateKeyDer, PrivatePkcs8KeyDer};

/// A current host's greeting, as Broadcom KB 341384 and KB 417531 quote it.
pub const GREETING: &[u8] = b"220 VMware Authentication Daemon Version 1.10: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported/t, SHA256 supported\r\n";

/// An older host's greeting without SHA-256 thumbprints, as Broadcom KB 338286 quotes it.
pub const GREETING_WITHOUT_SHA256: &[u8] = b"220 VMware Authentication Daemon Version 1.10: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported/t\r\n";

/// A greeting of a host that runs the disk session in clear only.
pub const GREETING_WITHOUT_NFCSSL: &[u8] = b"220 VMware Authentication Daemon Version 1.10: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, SHA256 supported\r\n";

/// The ticket `NfcGetVmFiles` hands out; no output of the client may show it.
pub const TICKET: &str = "52a9c4e7-1d6b-4f3e-mock-ticket-8b1c2d3e";

/// The session cookie `Login` sets, as the client must echo it on every later call.
pub const COOKIE: &str = "vmware_soap_session=\"9f3e71ab-mock-cookie-6c2d\"";

/// The handshake reply type that carries an error instead of the expected type.
pub const HANDSHAKE_ERROR: u32 = 4;

/// Record opcodes: session hello, version, capabilities, open, close, end,
/// and the error record a host sends before the reply it refuses.
pub const OP_HELLO: u32 = 2;
pub const OP_VERSION: u32 = 9;
pub const OP_CAPABILITIES: u32 = 22;
pub const OP_OPEN: u32 = 4;
pub const OP_CLOSE: u32 = 5;
pub const OP_END: u32 = 3;
pub const OP_ERROR: u32 = 1;
pub const OP_READ: u32 = 7;
/// The length of a read reply payload.
///
/// It holds the status, a word, the compression, the base offset, the total
/// length, the chunk offset, the chunk length, the wire length and a word.
const READ_REPLY_LEN: u32 = 44;
/// Chunk lengths, cycled through; none exceeds 64 KiB.
///
/// They fall nowhere in particular, so chunk boundaries and read boundaries differ.
const CHUNK_LENGTHS: [u32; 5] = [1_000, 65_536, 7, 3_000, 64_536];
/// An error payload is 16 bytes: the code, a zero word, and the text length.
const ERROR_PAYLOAD_LEN: u32 = 16;

/// How long a test waits for a port's report; a port never contacted fails
/// the test instead of hanging it.
const REPORT_TIMEOUT: Duration = Duration::from_secs(10);

/// How long a host holding reads waits for the next one before cutting.
///
/// A client whose depth is below the hold never sends the read that fills
/// it; three seconds is well under the client's own read timeout, so such a
/// run fails in the time a test can afford, and well over the gap between
/// two reads of a client that keeps up. The wait is timed only while a read
/// is held: a client thinking before its first read or after its last reply
/// is given all the time it takes, however slow the machine.
pub const HOLD_PATIENCE: Duration = Duration::from_secs(3);

/// Handshake message types, the first word of each 264-byte message.
pub const MSG_TAG: u32 = 43;
pub const MSG_TAG_END: u32 = 33;
pub const MSG_TAG_ACK: u32 = 36;
pub const MSG_VERSION: u32 = 51;
pub const MSG_NAME: u32 = 54;
pub const MSG_MODE: u32 = 55;
pub const MSG_READY: u32 = 52;
/// Every handshake message is this long, trailer excluded.
const MESSAGE_LEN: usize = 264;
/// The version an ESXi 7.0.3 host answers with: (9, 0).
const HOST_VERSION: (u32, u32) = (9, 0);
/// The word at offset 16 of the tag acknowledgment an ESXi 7.0.3 host sends.
const TAG_ACK_WORD_16: u32 = 1;
/// A TLS record starts with its content type, version and length.
const TLS_RECORD_HEAD: usize = 5;

/// The magic word every record header starts with, little-endian on the wire.
const RECORD_MAGIC: u32 = 0xA100_DA7A;
/// An open reply is 60 bytes: status, handle, capacity, sector size, geometry.
const OPEN_REPLY_LEN: usize = 60;
/// The handle the mock hands out; it looks sign-extended like a real one.
const HANDLE: u64 = 0xFFFF_FFFF_8000_2A1F;
const SECTOR_SIZE: u32 = 512;
const HEADS: u32 = 255;
const SECTORS_PER_TRACK: u32 = 63;

/// What the data port does once a client connects.
#[derive(Debug, Clone, Copy)]
pub enum DataPort {
    /// Send this greeting line, then serve TLS.
    Greeting(&'static [u8]),
    /// Close without sending anything.
    Silent,
}

/// Which certificate a thumbprint the host sends names.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Thumbprint {
    /// The certificate both ports present.
    Own,
    /// Some other certificate.
    Other,
}

/// How the first host read goes wrong.
///
/// The fault lands on the first chunk sent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReadFault {
    /// The chunk carries this non-zero status.
    Status(u64),
    /// The chunk starts at the end of the read, so it ends past it.
    OutOfRange,
    /// The chunk is sent twice.
    Overlap,
    /// The chunk announces, and carries, one more byte on the wire than it holds.
    WireLength,
    /// The last byte of the zlib stream is flipped, so its checksum fails.
    Zlib,
    /// The chunk comes as one skipz segment at offset 1, ending past the chunk.
    SkipzSegment,
    /// The connection is closed after the chunk.
    Cut,
}

/// What the mock answers at each step; the default is a healthy host.
#[derive(Debug, Clone)]
pub struct Scenario {
    /// What the data port does on connection.
    pub data: DataPort,
    /// The `apiType` the service content reports.
    pub api_type: &'static str,
    /// Whether `Login` succeeds, or the fault string it fails with.
    pub login: Result<(), &'static str>,
    /// Whose SHA-1 thumbprint the ticket carries.
    pub ticket_thumbprint: Thumbprint,
    /// Whose SHA-256 thumbprint the `THUMBPRINT_SHA2` reply announces.
    pub announced_thumbprint: Thumbprint,
    /// The reply line to `PROXY`, instead of the line granting what was asked.
    pub proxy_reply: Option<&'static str>,
    /// The type of the reply to the version message.
    pub version_reply: u32,
    /// The status the open reply carries; zero is success.
    pub open_status: u64,
    /// An error record sent before the open reply: its code and text.
    pub open_error: Option<(u64, &'static str)>,
    /// The capacity in bytes the open reply carries.
    pub capacity: u64,
    /// What goes wrong in the first read answered, if anything.
    pub read_fault: Option<ReadFault>,
    /// How many reads the host collects before answering them, newest first.
    ///
    /// One answers each read as it comes. More holds every read until that
    /// many are in flight, then answers them all, so a client sending fewer
    /// at once is never answered and is cut after [`HOLD_PATIENCE`].
    pub hold: usize,
}

impl Default for Scenario {
    fn default() -> Scenario {
        Scenario {
            data: DataPort::Greeting(GREETING),
            api_type: "HostAgent",
            login: Ok(()),
            ticket_thumbprint: Thumbprint::Own,
            announced_thumbprint: Thumbprint::Own,
            proxy_reply: None,
            version_reply: MSG_VERSION,
            open_status: 0,
            open_error: None,
            // 25 GiB: not a multiple of a cylinder, so the geometry understates it.
            capacity: 26_843_545_600,
            read_fault: None,
            hold: 1,
        }
    }
}

/// Bytes per run of the mock disk; runs take turns between three contents.
const RUN: u64 = 4096;

/// The byte the mock disk holds at `offset`.
///
/// Runs of [`RUN`] bytes take turns: a mix of the offset's bits, so a
/// chunk placed anywhere but at its own position, or a range left unfilled,
/// shows in a comparison; then zeros, which skipz leaves out; then one byte
/// repeated, which zlib packs.
pub fn disk_byte(offset: u64) -> u8 {
    let run = offset / RUN;
    match run % 3 {
        0 => offset.wrapping_mul(0x9E37_79B9_7F4A_7C15).to_be_bytes()[0],
        1 => 0,
        _ => run.to_le_bytes()[0] | 1,
    }
}

/// The `length` bytes the mock disk holds from `offset`, a run at a time.
pub fn disk_bytes(offset: u64, length: u64) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(usize::try_from(length).expect("a length that fits memory"));
    let end = offset + length;
    let mut at = offset;
    while at < end {
        let stop = ((at / RUN + 1) * RUN).min(end);
        if (at / RUN).is_multiple_of(3) {
            bytes.extend((at..stop).map(disk_byte));
        } else {
            let count = usize::try_from(stop - at).expect("a run fits memory");
            bytes.resize(bytes.len() + count, disk_byte(at));
        }
        at = stop;
    }
    bytes
}

/// One thing the mock saw, recorded before it replied.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Event {
    /// A management call, with the cookie it carried, the VM it named and the
    /// credentials it presented.
    Call {
        name: String,
        cookie: Option<String>,
        vm: Option<String>,
        credentials: Option<(String, String)>,
    },
    /// `SESSION <ticket>` in the first TLS session.
    Session(String),
    /// `BANNER` in the first TLS session.
    Banner,
    /// `THUMBPRINT_SHA2 <tag>` in the first TLS session.
    Thumbprint,
    /// `PROXY <transport>` in the first TLS session.
    Proxy(String),
    /// A handshake message of this type on the disk session.
    Handshake(u32),
    /// The client name and operation the name message carried.
    Client { name: String, operation: String },
    /// A record, with the path an open record carried.
    Record {
        opcode: u32,
        sequence: u32,
        path: Option<String>,
    },
    /// A read record: the disk offset and length it asked, and the compression.
    Read {
        sequence: u32,
        offset: u64,
        length: u32,
        compression: u32,
    },
    /// The host started answering the read of this sequence.
    Answered { sequence: u32 },
}

/// What one port observed while serving one connection.
#[derive(Debug, Default)]
pub struct Observed {
    /// The client sent at least one byte where a TLS handshake would start.
    pub handshake_started: bool,
    /// The TLS handshake completed.
    pub handshake_completed: bool,
    /// The negotiated protocol version, as rustls debug-prints it.
    pub version: Option<String>,
    /// The negotiated cipher suite, as rustls debug-prints it.
    pub suite: Option<String>,
    /// Application bytes the client sent after the TLS handshake.
    pub bytes_after_tls_handshake: usize,
    /// A second TLS handshake ran on the data port.
    pub second_handshake: bool,
    /// Chunks sent.
    pub chunks: usize,
    /// Chunks sent as stored inside a skipz read, having no zero to leave out.
    pub raw_chunks: usize,
}

/// A running mock host: its certificate and the two ports it listens on.
#[derive(Debug)]
pub struct Host {
    pub certificate: CertificateDer<'static>,
    pub management_port: u16,
    pub data_port: u16,
    mock: Arc<Mock>,
    management: Receiver<Observed>,
    data: Receiver<Observed>,
}

impl Host {
    /// Starts a host with a fresh self-signed certificate that plays `scenario`.
    pub fn start(scenario: Scenario) -> Host {
        let issued = rcgen::generate_simple_self_signed(vec![
            "esxi.test".to_owned(),
            "127.0.0.1".to_owned(),
        ])
        .expect("a self-signed certificate is generated");
        let certificate = issued.cert.der().clone();
        let key =
            PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(issued.signing_key.serialize_der()));
        let config = Arc::new(
            ServerConfig::builder()
                .with_no_client_auth()
                .with_single_cert(vec![certificate.clone()], key)
                .expect("the certificate and key match"),
        );
        let (management_listener, management_port) = bind();
        let (data_listener, data_port) = bind();
        let mock = Arc::new(Mock {
            scenario,
            config,
            events: Mutex::new(Vec::new()),
            certificate: certificate.clone(),
            data_port,
        });
        let management = listen(
            management_listener,
            Arc::clone(&mock),
            true,
            serve_management,
        );
        let data = listen(data_listener, Arc::clone(&mock), false, serve_data);
        Host {
            certificate,
            management_port,
            data_port,
            mock,
            management,
            data,
        }
    }

    /// Starts a healthy host whose data port behaves as `data`.
    pub fn with_data_port(data: DataPort) -> Host {
        Host::start(Scenario {
            data,
            ..Scenario::default()
        })
    }

    /// Everything both ports recorded so far, in order.
    pub fn events(&self) -> Vec<Event> {
        self.mock
            .events
            .lock()
            .expect("the log is not poisoned")
            .clone()
    }

    /// What the management port observed on its first connection; panics when never contacted.
    pub fn management(&self) -> Observed {
        self.management
            .recv_timeout(REPORT_TIMEOUT)
            .expect("the management port served a connection")
    }

    /// What the data port observed; panics when it was never contacted.
    pub fn data(&self) -> Observed {
        self.data
            .recv_timeout(REPORT_TIMEOUT)
            .expect("the data port served a connection")
    }

    /// The certificate's SHA-256 thumbprint, upper-case hex with colons.
    pub fn sha256(&self) -> String {
        thumbprint(&SHA256, self.certificate.as_ref())
    }

    /// The certificate's SHA-1 thumbprint, upper-case hex with colons.
    pub fn sha1(&self) -> String {
        thumbprint(&SHA1_FOR_LEGACY_USE_ONLY, self.certificate.as_ref())
    }

    /// The certificate as a PEM block, for `--ca-file`.
    pub fn pem(&self) -> String {
        let body = base64(self.certificate.as_ref());
        let lines = body
            .as_bytes()
            .chunks(64)
            .map(|line| String::from_utf8_lossy(line).into_owned())
            .collect::<Vec<_>>()
            .join("\n");
        format!("-----BEGIN CERTIFICATE-----\n{lines}\n-----END CERTIFICATE-----\n")
    }
}

/// Upper-case hex with colons of `algorithm` over `bytes`.
pub fn thumbprint(algorithm: &'static Algorithm, bytes: &[u8]) -> String {
    digest::digest(algorithm, bytes)
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02X}"))
        .collect::<Vec<_>>()
        .join(":")
}

/// Decodes `bytes` as UTF-8 for an assertion message.
pub fn text(bytes: &[u8]) -> String {
    String::from_utf8(bytes.to_vec()).expect("the output is UTF-8")
}

/// What both port threads share.
#[derive(Debug)]
struct Mock {
    scenario: Scenario,
    config: Arc<ServerConfig>,
    events: Mutex<Vec<Event>>,
    certificate: CertificateDer<'static>,
    data_port: u16,
}

impl Mock {
    fn record(&self, event: Event) {
        self.events
            .lock()
            .expect("the log is not poisoned")
            .push(event);
    }

    /// The thumbprint `whose` names, with `algorithm`.
    fn thumbprint(&self, algorithm: &'static Algorithm, whose: Thumbprint) -> String {
        match whose {
            Thumbprint::Own => thumbprint(algorithm, self.certificate.as_ref()),
            Thumbprint::Other => thumbprint(algorithm, b"some other certificate"),
        }
    }
}

/// Binds a loopback port.
fn bind() -> (TcpListener, u16) {
    let listener = TcpListener::bind("127.0.0.1:0").expect("loopback is bindable");
    let port = listener
        .local_addr()
        .expect("the listener has an address")
        .port();
    (listener, port)
}

/// Serves connections on a detached thread: every one when `many`, else the first only.
fn listen(
    listener: TcpListener,
    mock: Arc<Mock>,
    many: bool,
    serve: fn(TcpStream, &Mock) -> Observed,
) -> Receiver<Observed> {
    let (sender, receiver) = mpsc::channel();
    thread::spawn(move || {
        for stream in listener.incoming() {
            let stream = stream.expect("a client connects");
            // The test may have finished without asking; not this thread's problem.
            let _ = sender.send(serve(stream, &mock));
            if !many {
                break;
            }
        }
    });
    receiver
}

/// Serves one TLS handshake, recording what was negotiated.
fn handshake(
    stream: &mut TcpStream,
    mock: &Mock,
    observed: &mut Observed,
) -> Option<ServerConnection> {
    // Wait for the first byte: a client that leaves without starting TLS is
    // told apart from one that did.
    let mut first = [0_u8; 1];
    observed.handshake_started = matches!(stream.peek(&mut first), Ok(1));
    if !observed.handshake_started {
        return None;
    }
    let mut connection =
        ServerConnection::new(Arc::clone(&mock.config)).expect("the server configuration is valid");
    while connection.is_handshaking() {
        connection.complete_io(stream).ok()?;
    }
    observed.handshake_completed = true;
    observed.version = connection
        .protocol_version()
        .map(|version| format!("{version:?}"));
    observed.suite = connection
        .negotiated_cipher_suite()
        .map(|suite| format!("{:?}", suite.suite()));
    Some(connection)
}

/// Reads one line ending in `\n`, byte by byte; `None` when the peer closes first.
fn line<R: Read>(reader: &mut R) -> Option<Vec<u8>> {
    let mut line = Vec::new();
    let mut byte = [0_u8; 1];
    while line.last() != Some(&b'\n') {
        reader.read_exact(&mut byte).ok()?;
        line.push(byte[0]);
    }
    Some(line)
}

/// Writes `bytes` and flushes; `None` when the peer is gone.
fn send<W: Write>(writer: &mut W, bytes: &[u8]) -> Option<()> {
    writer.write_all(bytes).and_then(|()| writer.flush()).ok()
}

/// The text between `<name…>` and `</name>` in `xml`, if any.
fn element(xml: &str, name: &str) -> Option<String> {
    let start = xml.find(&format!("<{name}"))?;
    let open_end = start + xml[start..].find('>')?;
    let close = open_end + xml[open_end..].find(&format!("</{name}>"))?;
    Some(xml[open_end + 1..close].to_owned())
}

/// One HTTP request: what the head said and the body.
struct Request {
    len: usize,
    cookie: Option<String>,
    body: String,
}

/// Reads one request; `None` when the client sent nothing.
fn read_request<R: Read>(reader: &mut R) -> Option<Request> {
    let mut len = 0;
    let mut content_length = 0;
    let mut cookie = None;
    loop {
        let line = line(reader)?;
        len += line.len();
        let text = String::from_utf8_lossy(&line).trim_end().to_owned();
        if text.is_empty() {
            break;
        }
        if let Some((name, value)) = text.split_once(':') {
            match name.to_ascii_lowercase().as_str() {
                "content-length" => content_length = value.trim().parse().ok()?,
                "cookie" => cookie = Some(value.trim().to_owned()),
                _ => {}
            }
        }
    }
    let mut body = vec![0_u8; content_length];
    reader.read_exact(&mut body).ok()?;
    Some(Request {
        len: len + content_length,
        cookie,
        body: String::from_utf8_lossy(&body).into_owned(),
    })
}

/// Serves one management connection: one call, one canned reply.
fn serve_management(mut stream: TcpStream, mock: &Mock) -> Observed {
    let mut observed = Observed::default();
    let Some(mut connection) = handshake(&mut stream, mock, &mut observed) else {
        return observed;
    };
    {
        let mut tls = Stream::new(&mut connection, &mut stream);
        let Some(request) = read_request(&mut tls) else {
            return observed;
        };
        observed.bytes_after_tls_handshake = request.len;
        let (status, headers, body) = answer(mock, &request);
        let head = format!(
            "HTTP/1.1 {status}\r\nContent-Type: text/xml; charset=utf-8\r\n{headers}\
             Content-Length: {}\r\nConnection: close\r\n\r\n",
            body.len()
        );
        if send(&mut tls, head.as_bytes()).is_none() || send(&mut tls, body.as_bytes()).is_none() {
            return observed;
        }
    }
    connection.send_close_notify();
    let _ = connection.complete_io(&mut stream);
    observed
}

/// Answers one call: the status line tail, extra headers, and the body.
fn answer(mock: &Mock, request: &Request) -> (&'static str, String, String) {
    let body = request.body.as_str();
    let names = [
        "RetrieveServiceContent",
        "Login",
        "RetrieveInternalContent",
        "NfcGetVmFiles",
        "Logout",
    ];
    let name = names
        .into_iter()
        .find(|name| body.contains(&format!("<{name} xmlns=\"urn:vim25\">")))
        .unwrap_or("unknown");
    let credentials = (name == "Login").then(|| {
        (
            element(body, "userName").unwrap_or_default(),
            element(body, "password").unwrap_or_default(),
        )
    });
    mock.record(Event::Call {
        name: name.to_owned(),
        cookie: request.cookie.clone(),
        vm: (name == "NfcGetVmFiles").then(|| element(body, "vm").unwrap_or_default()),
        credentials,
    });
    let ok = |inner: String| ("200 OK", String::new(), envelope(&inner));
    match name {
        "RetrieveServiceContent" => {
            let api_type = mock.scenario.api_type;
            let full_name = if api_type == "HostAgent" {
                "VMware ESXi 8.0.3 build-24022510"
            } else {
                "VMware vCenter Server 8.0.3 build-24022515"
            };
            ok(format!(
                "<RetrieveServiceContentResponse xmlns=\"urn:vim25\"><returnval>\
                 <rootFolder type=\"Folder\">ha-folder-root</rootFolder>\
                 <about><name>VMware ESXi</name><fullName>{full_name}</fullName>\
                 <apiType>{api_type}</apiType><apiVersion>8.0.3.0</apiVersion></about>\
                 <sessionManager type=\"SessionManager\">ha-sessionmgr</sessionManager>\
                 </returnval></RetrieveServiceContentResponse>"
            ))
        }
        "Login" => match mock.scenario.login {
            Ok(()) => (
                "200 OK",
                format!("Set-Cookie: {COOKIE}; Path=/; HttpOnly; Secure\r\n"),
                envelope(
                    "<LoginResponse xmlns=\"urn:vim25\"><returnval>\
                     <key>52b0e7a1-mock-session-key</key><userName>root</userName>\
                     <fullName>Administrator</fullName>\
                     <loginTime>2026-09-04T10:00:00Z</loginTime>\
                     <lastActiveTime>2026-09-04T10:00:00Z</lastActiveTime>\
                     <locale>en</locale><messageLocale>en</messageLocale>\
                     </returnval></LoginResponse>",
                ),
            ),
            Err(text) => ("500 Internal Server Error", String::new(), fault(text)),
        },
        "RetrieveInternalContent" => ok(
            "<RetrieveInternalContentResponse xmlns=\"urn:vim25\"><returnval>\
             <nfcService type=\"NfcService\">ha-nfc-service</nfcService>\
             </returnval></RetrieveInternalContentResponse>"
                .to_owned(),
        ),
        "NfcGetVmFiles" => {
            let sha1 = mock.thumbprint(&SHA1_FOR_LEGACY_USE_ONLY, mock.scenario.ticket_thumbprint);
            ok(format!(
                "<NfcGetVmFilesResponse xmlns=\"urn:vim25\"><returnval>\
                 <service>nfc</service><serviceVersion>1.1</serviceVersion>\
                 <port>{}</port><sslThumbprint>{sha1}</sslThumbprint>\
                 <sessionId>{TICKET}</sessionId>\
                 <url>nfc://127.0.0.1:{}/{TICKET}</url>\
                 </returnval></NfcGetVmFilesResponse>",
                mock.data_port, mock.data_port
            ))
        }
        "Logout" => ok("<LogoutResponse xmlns=\"urn:vim25\"></LogoutResponse>".to_owned()),
        _ => (
            "500 Internal Server Error",
            String::new(),
            fault("unknown call"),
        ),
    }
}

/// Wraps `inner` in the envelope a host sends.
fn envelope(inner: &str) -> String {
    format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n\
         <soapenv:Envelope xmlns:soapenc=\"http://schemas.xmlsoap.org/soap/encoding/\" \
         xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" \
         xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" \
         xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\n\
         <soapenv:Body>\n{inner}\n</soapenv:Body>\n</soapenv:Envelope>"
    )
}

/// A SOAP fault carrying `text`, as a host reports a refused login.
fn fault(text: &str) -> String {
    envelope(&format!(
        "<soapenv:Fault><faultcode>ServerFaultCode</faultcode>\
         <faultstring>{text}</faultstring>\
         <detail><InvalidLoginFault xmlns=\"urn:vim25\" xsi:type=\"InvalidLogin\"></InvalidLoginFault></detail>\
         </soapenv:Fault>"
    ))
}

/// The disk session as the mock carries it: TLS or the socket in clear.
enum Plane<'a> {
    Tls(&'a mut ServerConnection, &'a mut TcpStream),
    Clear(&'a mut TcpStream),
}

impl Plane<'_> {
    /// The next handshake message: one TLS record, or one message read whole in clear.
    fn message(&mut self) -> Option<Vec<u8>> {
        match self {
            Plane::Tls(connection, stream) => next_record(connection, stream),
            Plane::Clear(stream) => {
                let mut message = vec![0_u8; MESSAGE_LEN];
                stream.read_exact(&mut message).ok()?;
                if word(&message, 0) == MSG_NAME {
                    let trailer = word(&message, 4) as usize + word(&message, 8) as usize;
                    message.resize(MESSAGE_LEN + trailer, 0);
                    stream.read_exact(&mut message[MESSAGE_LEN..]).ok()?;
                }
                Some(message)
            }
        }
    }

    /// Sends `bytes` as one write: one TLS record, or as they are in clear.
    fn send(&mut self, bytes: &[u8]) -> Option<()> {
        match self {
            Plane::Tls(connection, stream) => send_record(connection, stream, bytes),
            Plane::Clear(stream) => send(stream, bytes),
        }
    }

    /// Ends the TLS session properly; the clear session just closes.
    fn close(self) {
        if let Plane::Tls(connection, stream) = self {
            connection.send_close_notify();
            let _ = connection.complete_io(stream);
        }
    }
}

impl Read for Plane<'_> {
    fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
        match self {
            Plane::Tls(connection, stream) => {
                Stream::new(&mut **connection, &mut **stream).read(buffer)
            }
            Plane::Clear(stream) => stream.read(buffer),
        }
    }
}

impl Write for Plane<'_> {
    fn write(&mut self, buffer: &[u8]) -> io::Result<usize> {
        match self {
            Plane::Tls(connection, stream) => {
                Stream::new(&mut **connection, &mut **stream).write(buffer)
            }
            Plane::Clear(stream) => stream.write(buffer),
        }
    }

    fn flush(&mut self) -> io::Result<()> {
        match self {
            Plane::Tls(connection, stream) => Stream::new(&mut **connection, &mut **stream).flush(),
            Plane::Clear(stream) => stream.flush(),
        }
    }
}

/// Serves the data port: greeting, the TLS session, the disk session it grants.
fn serve_data(mut stream: TcpStream, mock: &Mock) -> Observed {
    let mut observed = Observed::default();
    let DataPort::Greeting(greeting) = mock.scenario.data else {
        return observed;
    };
    if stream.write_all(greeting).is_err() {
        return observed;
    }
    let Some(mut first) = handshake(&mut stream, mock, &mut observed) else {
        return observed;
    };
    let (read, granted) = dialogue(&mut Stream::new(&mut first, &mut stream), mock);
    observed.bytes_after_tls_handshake = read;
    let Some(transport) = granted else {
        return observed;
    };
    drop(first);
    let socket = stream.try_clone().expect("the socket clones");
    let mut second;
    let mut plane = if transport == "nfc" {
        Plane::Clear(&mut stream)
    } else {
        second = ServerConnection::new(Arc::clone(&mock.config))
            .expect("the server configuration is valid");
        if handshake_by_record(&mut second, &mut stream).is_none() {
            return observed;
        }
        observed.second_handshake = true;
        Plane::Tls(&mut second, &mut stream)
    };
    if shake(&mut plane, mock).is_some() {
        records(&mut plane, &socket, mock, &mut observed);
    }
    plane.close();
    observed
}

/// Runs the ticket dialogue: the bytes read, and the transport `PROXY` was granted, if any.
fn dialogue<S: Read + Write>(tls: &mut S, mock: &Mock) -> (usize, Option<String>) {
    let mut read = 0;
    loop {
        let Some(line) = line(tls) else {
            return (read, None);
        };
        read += line.len();
        let text = String::from_utf8_lossy(&line).trim_end().to_owned();
        if let Some(ticket) = text.strip_prefix("SESSION ") {
            mock.record(Event::Session(ticket.to_owned()));
            continue;
        }
        let reply = if text == "BANNER" {
            mock.record(Event::Banner);
            "220 VMware Authentication Daemon Version 1.10".to_owned()
        } else if text.starts_with("THUMBPRINT_SHA2 ") {
            mock.record(Event::Thumbprint);
            format!(
                "200 {}",
                mock.thumbprint(&SHA256, mock.scenario.announced_thumbprint)
            )
        } else if let Some(transport @ ("nfc" | "nfcssl")) = text.strip_prefix("PROXY ") {
            mock.record(Event::Proxy(transport.to_owned()));
            mock.scenario
                .proxy_reply
                .map_or_else(|| format!("200 Connect ha-{transport}"), str::to_owned)
        } else {
            return (read, None);
        };
        if send(tls, format!("{reply}\r\n").as_bytes()).is_none() {
            return (read, None);
        }
        if let Some(transport) = text.strip_prefix("PROXY ") {
            return (
                read,
                mock.scenario
                    .proxy_reply
                    .is_none()
                    .then(|| transport.to_owned()),
            );
        }
    }
}

/// A 264-byte handshake message of `kind` with two argument words.
fn message(kind: u32, arguments: (u32, u32)) -> [u8; MESSAGE_LEN] {
    let mut bytes = [0_u8; MESSAGE_LEN];
    bytes[..4].copy_from_slice(&kind.to_le_bytes());
    bytes[4..8].copy_from_slice(&arguments.0.to_le_bytes());
    bytes[8..12].copy_from_slice(&arguments.1.to_le_bytes());
    bytes
}

/// The little-endian word at `at`.
fn word(bytes: &[u8], at: usize) -> u32 {
    u32::from_le_bytes(
        bytes[at..at + 4]
            .try_into()
            .expect("four bytes make a word"),
    )
}

fn long(bytes: &[u8], at: usize) -> u64 {
    u64::from_le_bytes(
        bytes[at..at + 8]
            .try_into()
            .expect("eight bytes make a long"),
    )
}

/// Feeds `connection` exactly one TLS record from `stream`; `None` when the peer is gone.
///
/// rustls otherwise reads as much as the socket holds, which would hide
/// where the client's records begin and end.
fn feed(connection: &mut ServerConnection, stream: &mut TcpStream) -> Option<IoState> {
    let mut record = vec![0_u8; TLS_RECORD_HEAD];
    stream.read_exact(&mut record).ok()?;
    let length = usize::from(u16::from_be_bytes([record[3], record[4]]));
    record.resize(TLS_RECORD_HEAD + length, 0);
    stream.read_exact(&mut record[TLS_RECORD_HEAD..]).ok()?;
    let mut bytes = record.as_slice();
    while !bytes.is_empty() {
        if connection.read_tls(&mut bytes).ok()? == 0 {
            return None;
        }
    }
    connection.process_new_packets().ok()
}

/// Writes every pending TLS byte to `stream`.
fn flush(connection: &mut ServerConnection, stream: &mut TcpStream) -> Option<()> {
    while connection.wants_write() {
        connection.write_tls(stream).ok()?;
    }
    Some(())
}

/// Runs a TLS handshake one record at a time, so that no application
/// record is swallowed along with the client's last handshake record.
fn handshake_by_record(connection: &mut ServerConnection, stream: &mut TcpStream) -> Option<()> {
    while connection.is_handshaking() {
        if connection.wants_write() {
            connection.write_tls(stream).ok()?;
        } else {
            feed(connection, stream)?;
        }
    }
    flush(connection, stream)
}

/// Encrypts `bytes` as one record and writes it; `None` when the peer is gone.
fn send_record(
    connection: &mut ServerConnection,
    stream: &mut TcpStream,
    bytes: &[u8],
) -> Option<()> {
    connection.writer().write_all(bytes).ok()?;
    flush(connection, stream)
}

/// The plaintext of the client's next TLS record; `None` when it closes.
fn next_record(connection: &mut ServerConnection, stream: &mut TcpStream) -> Option<Vec<u8>> {
    loop {
        let state = feed(connection, stream)?;
        if state.peer_has_closed() {
            return None;
        }
        if state.plaintext_bytes_to_read() > 0 {
            let mut plaintext = vec![0_u8; state.plaintext_bytes_to_read()];
            connection.reader().read_exact(&mut plaintext).ok()?;
            return Some(plaintext);
        }
    }
}

/// Reads the next handshake message, records its type, and checks it is `expected`.
///
/// A host reads one message per TLS record and leaves a surplus unread
/// until the next record arrives; refusing the surplus fails a test instead
/// of hanging it.
fn expect(plane: &mut Plane<'_>, mock: &Mock, expected: u32) -> Option<Vec<u8>> {
    let record = plane.message()?;
    if record.len() < MESSAGE_LEN {
        return None;
    }
    let kind = word(&record, 0);
    mock.record(Event::Handshake(kind));
    let trailer = if kind == MSG_NAME {
        word(&record, 4) as usize + word(&record, 8) as usize
    } else {
        0
    };
    (kind == expected && record.len() == MESSAGE_LEN + trailer).then_some(record)
}

/// Runs the handshake as a host: the tag is acknowledged only once the
/// version message has arrived, and each message must be its own write.
fn shake(plane: &mut Plane<'_>, mock: &Mock) -> Option<()> {
    expect(plane, mock, MSG_TAG)?;
    expect(plane, mock, MSG_TAG_END)?;
    expect(plane, mock, MSG_VERSION)?;
    let mut ack = message(MSG_TAG_ACK, (0, 0));
    ack[16..20].copy_from_slice(&TAG_ACK_WORD_16.to_le_bytes());
    plane.send(&ack)?;
    plane.send(&message(mock.scenario.version_reply, HOST_VERSION))?;
    if mock.scenario.version_reply != MSG_VERSION {
        return None;
    }
    let name = expect(plane, mock, MSG_NAME)?;
    let name_end = MESSAGE_LEN + word(&name, 4) as usize;
    mock.record(Event::Client {
        name: String::from_utf8_lossy(&name[MESSAGE_LEN..name_end]).into_owned(),
        operation: String::from_utf8_lossy(&name[name_end..]).into_owned(),
    });
    expect(plane, mock, MSG_MODE)?;
    expect(plane, mock, MSG_READY)?;
    plane.send(&message(MSG_READY, (0, 0)))
}

/// The 60-byte open reply the scenario calls for.
fn open_reply(mock: &Mock) -> Vec<u8> {
    let capacity = mock.scenario.capacity;
    let cylinders = u32::try_from(
        capacity / (u64::from(HEADS) * u64::from(SECTORS_PER_TRACK) * u64::from(SECTOR_SIZE)),
    )
    .expect("the geometry fits a word");
    let mut bytes = vec![0_u8; OPEN_REPLY_LEN];
    bytes[..8].copy_from_slice(&mock.scenario.open_status.to_le_bytes());
    bytes[8..16].copy_from_slice(&HANDLE.to_le_bytes());
    bytes[28..36].copy_from_slice(&capacity.to_le_bytes());
    bytes[36..40].copy_from_slice(&SECTOR_SIZE.to_le_bytes());
    bytes[40..44].copy_from_slice(&cylinders.to_le_bytes());
    bytes[44..48].copy_from_slice(&HEADS.to_le_bytes());
    bytes[48..52].copy_from_slice(&SECTORS_PER_TRACK.to_le_bytes());
    bytes
}

/// The error record for `sequence`: header, 16-byte payload, then the text as trailer.
fn error_record(sequence: u32, code: u64, text: &str) -> Vec<u8> {
    let mut bytes = RECORD_MAGIC.to_le_bytes().to_vec();
    bytes.extend_from_slice(&OP_ERROR.to_le_bytes());
    bytes.extend_from_slice(&ERROR_PAYLOAD_LEN.to_le_bytes());
    bytes.extend_from_slice(&sequence.to_le_bytes());
    bytes.extend_from_slice(&code.to_le_bytes());
    bytes.extend_from_slice(&0_u32.to_le_bytes());
    let text_len = u32::try_from(text.len()).expect("the text fits a word");
    bytes.extend_from_slice(&text_len.to_le_bytes());
    bytes.extend_from_slice(text.as_bytes());
    bytes
}

/// Answers records until the end record; every reply echoes the header.
///
/// An open the scenario refuses with an error record gets that record
/// first, then a reply of zeros, as an ESXi 7.0.3 host answers. Reads are
/// held until the scenario's hold is reached, then answered newest first;
/// `socket` is the connection under `tls`, given [`HOLD_PATIENCE`] to read
/// the next record while a read is held and no limit otherwise.
fn records<S: Read + Write>(
    tls: &mut S,
    socket: &TcpStream,
    mock: &Mock,
    observed: &mut Observed,
) -> Option<()> {
    let mut held = Vec::new();
    let mut answered = 0_usize;
    loop {
        let mut header = [0_u8; 16];
        tls.read_exact(&mut header).ok()?;
        if word(&header, 0) != RECORD_MAGIC {
            return None;
        }
        let (opcode, sequence) = (word(&header, 4), word(&header, 12));
        let mut payload = vec![0_u8; word(&header, 8) as usize];
        tls.read_exact(&mut payload).ok()?;
        if opcode == OP_READ {
            let read = ReadRecord {
                sequence,
                compression: word(&payload, 12),
                offset: long(&payload, 16),
                length: word(&payload, 32),
            };
            mock.record(Event::Read {
                sequence,
                offset: read.offset,
                length: read.length,
                compression: read.compression,
            });
            held.push(read);
            let patience = (held.len() < mock.scenario.hold).then_some(HOLD_PATIENCE);
            socket
                .set_read_timeout(patience)
                .expect("the socket takes a read timeout");
            if patience.is_some() {
                continue;
            }
            while let Some(read) = held.pop() {
                mock.record(Event::Answered {
                    sequence: read.sequence,
                });
                let fault = mock.scenario.read_fault.filter(|_| answered == 0);
                answered += 1;
                serve_read(tls, &read, fault, observed)?;
            }
            continue;
        }
        let mut path = None;
        if opcode == OP_OPEN {
            let mut trailer = vec![0_u8; word(&payload, 0) as usize];
            tls.read_exact(&mut trailer).ok()?;
            path = Some(String::from_utf8_lossy(&trailer).into_owned());
        }
        mock.record(Event::Record {
            opcode,
            sequence,
            path,
        });
        let reply_payload = match (opcode, mock.scenario.open_error) {
            (OP_OPEN, Some((code, text))) => {
                send(tls, &error_record(sequence, code, text))?;
                vec![0_u8; OPEN_REPLY_LEN]
            }
            (OP_OPEN, None) => open_reply(mock),
            _ => vec![0_u8; payload.len()],
        };
        let mut reply = header.to_vec();
        let length = u32::try_from(reply_payload.len()).expect("a reply fits a word");
        reply[8..12].copy_from_slice(&length.to_le_bytes());
        reply.extend_from_slice(&reply_payload);
        send(tls, &reply)?;
        if opcode == OP_END {
            return Some(());
        }
    }
}

/// One read record as the client sent it.
struct ReadRecord {
    sequence: u32,
    compression: u32,
    offset: u64,
    length: u32,
}

/// One chunk answering a read: the reply fields that vary.
#[derive(Clone, Copy)]
struct Chunk {
    status: u64,
    offset: u32,
    length: u32,
}

/// The compression code of a chunk sent as one zlib stream.
const COMPRESSION_ZLIB: u32 = 1;
/// The compression code of a chunk sent as skipz.
const COMPRESSION_SKIPZ: u32 = 3;

/// `value` as the little-endian word a skipz stream carries.
fn le(value: usize) -> [u8; 4] {
    u32::try_from(value)
        .expect("a chunk fits a word")
        .to_le_bytes()
}

/// `data` as one zlib stream.
fn deflate(data: &[u8]) -> Vec<u8> {
    let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
    encoder.write_all(data).expect("a vector takes every byte");
    encoder.finish().expect("a vector takes every byte")
}

/// `data` as a skipz stream, each run of non-zero bytes a segment.
///
/// `None` when there is no zero to leave out: the host then sends the chunk
/// as stored.
fn skipz(data: &[u8]) -> Option<Vec<u8>> {
    if !data.contains(&0) {
        return None;
    }
    let mut wire = le(data.len()).to_vec();
    wire.extend_from_slice(&[0; 4]);
    let mut at = 0;
    while at < data.len() {
        let run = data[at..].iter().take_while(|byte| **byte != 0).count();
        if run == 0 {
            at += 1;
            continue;
        }
        wire.extend_from_slice(&le(at));
        wire.extend_from_slice(&le(run));
        wire.extend_from_slice(&data[at..at + run]);
        at += run;
    }
    Some(wire)
}

/// `data` as one skipz segment at offset 1, ending past the chunk.
fn overrunning_skipz(data: &[u8]) -> Vec<u8> {
    let mut wire = le(data.len()).to_vec();
    wire.extend_from_slice(&[0; 4]);
    wire.extend_from_slice(&le(1));
    wire.extend_from_slice(&le(data.len()));
    wire.extend_from_slice(data);
    wire
}

/// Answers `read` in chunks of [`CHUNK_LENGTHS`], the odd-numbered ones before the even-numbered ones.
///
/// Each chunk is sent as the read's compression says. `fault`, if any,
/// lands on the first chunk sent. Returns `None` when the connection is to
/// be closed.
fn serve_read<W: Write>(
    tls: &mut W,
    read: &ReadRecord,
    fault: Option<ReadFault>,
    observed: &mut Observed,
) -> Option<()> {
    let mut chunks = Vec::new();
    let mut at = 0_u32;
    for candidate in CHUNK_LENGTHS.iter().cycle() {
        if at >= read.length {
            break;
        }
        let length = (*candidate).min(read.length - at);
        chunks.push(Chunk {
            status: 0,
            offset: at,
            length,
        });
        at += length;
    }
    let odd = chunks.iter().skip(1).step_by(2);
    let even = chunks.iter().step_by(2);
    for (index, chunk) in odd.chain(even).enumerate() {
        let mut chunk = *chunk;
        let data = disk_bytes(
            read.offset + u64::from(chunk.offset),
            u64::from(chunk.length),
        );
        let fault = fault.filter(|_| index == 0);
        let mut wire = match (fault, read.compression) {
            (Some(ReadFault::SkipzSegment), _) => overrunning_skipz(&data),
            (_, COMPRESSION_ZLIB) => deflate(&data),
            (_, COMPRESSION_SKIPZ) => skipz(&data).unwrap_or_else(|| {
                observed.raw_chunks += 1;
                data
            }),
            _ => data,
        };
        observed.chunks += 1;
        match fault {
            Some(ReadFault::Status(status)) => chunk.status = status,
            Some(ReadFault::OutOfRange) => chunk.offset = read.length,
            Some(ReadFault::WireLength) => wire.push(0),
            Some(ReadFault::Zlib) => {
                let last = wire.len() - 1;
                wire[last] ^= 0xFF;
            }
            Some(ReadFault::Overlap | ReadFault::SkipzSegment | ReadFault::Cut) | None => {}
        }
        send_chunk(tls, read, &chunk, &wire)?;
        match fault {
            Some(ReadFault::Overlap) => send_chunk(tls, read, &chunk, &wire)?,
            Some(ReadFault::Cut) => return None,
            _ => {}
        }
    }
    Some(())
}

/// Sends one chunk record: header, the 44-byte reply, then `data` as trailer.
fn send_chunk<W: Write>(tls: &mut W, read: &ReadRecord, chunk: &Chunk, data: &[u8]) -> Option<()> {
    let mut bytes = RECORD_MAGIC.to_le_bytes().to_vec();
    bytes.extend_from_slice(&OP_READ.to_le_bytes());
    bytes.extend_from_slice(&READ_REPLY_LEN.to_le_bytes());
    bytes.extend_from_slice(&read.sequence.to_le_bytes());
    bytes.extend_from_slice(&chunk.status.to_le_bytes());
    bytes.extend_from_slice(&1_u32.to_le_bytes());
    bytes.extend_from_slice(&read.compression.to_le_bytes());
    bytes.extend_from_slice(&read.offset.to_le_bytes());
    bytes.extend_from_slice(&read.length.to_le_bytes());
    bytes.extend_from_slice(&chunk.offset.to_le_bytes());
    bytes.extend_from_slice(&chunk.length.to_le_bytes());
    bytes.extend_from_slice(&le(data.len()));
    bytes.extend_from_slice(&0_u32.to_le_bytes());
    bytes.extend_from_slice(data);
    send(tls, &bytes)
}

/// The base64 alphabet, for the PEM block.
const BASE64: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// Standard base64 with padding, without line breaks.
fn base64(bytes: &[u8]) -> String {
    let mut out = String::new();
    for chunk in bytes.chunks(3) {
        let mut word = 0_u32;
        for (index, byte) in chunk.iter().enumerate() {
            word |= u32::from(*byte) << (16 - 8 * index);
        }
        for index in 0..4 {
            if index <= chunk.len() {
                out.push(char::from(
                    BASE64[((word >> (18 - 6 * index)) & 63) as usize],
                ));
            } else {
                out.push('=');
            }
        }
    }
    out
}
