//! The data port: greeting, ticket dialogue, then the disk session.
//!
//! A host speaks first on this port, with one greeting line; the client
//! answers by starting a TLS handshake on the same connection. Inside that
//! session it presents its ticket and asks for a [`Transport`]: `nfcssl`,
//! then a second, full TLS handshake on the same TCP connection carries the
//! [`handshake`] messages and the [`record`] protocol; or `nfc`, and the
//! connection carries them in clear once the first session is abandoned.

pub mod greeting;
pub mod handshake;
pub mod record;

use std::fmt;
use std::io::{self, Read, Write};
use std::net::TcpStream;
use std::str::FromStr;

use rustls::{ClientConnection, Stream};
use rustls_pki_types::CertificateDer;

use crate::tls;
use crate::transcript::Transcript;

/// Longest line read from the host before giving up on it.
///
/// Real greeting and dialogue lines are under 200 bytes; the limit keeps a
/// peer that never sends a line end from growing the buffer without bound.
const MAX_LINE_LEN: usize = 1024;

/// Longest record payload accepted from the host.
///
/// A reply carries at most one chunk of disk data and its header, far
/// under this bound; it stops a host from making the client allocate
/// whatever a 32-bit length announces.
const MAX_RECORD_LEN: usize = 1 << 20;

/// Reply code that opens the host's answer to `BANNER`.
const BANNER_OK: &str = "220";
/// Reply code that opens a successful `THUMBPRINT_SHA2` answer, hash after the space.
const REPLY_OK: &str = "200 ";

/// Alphabet of a session tag: the 64 base64 characters, so any byte maps to one.
const TAG_ALPHABET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/// Mask keeping the six bits of a random byte that index [`TAG_ALPHABET`].
const TAG_INDEX_MASK: usize = 63;
const _: () = assert!(TAG_ALPHABET.len() == TAG_INDEX_MASK + 1);

/// How the disk session runs once the ticket dialogue has granted it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Transport {
    /// `PROXY nfcssl`: a second, full TLS session on the same connection.
    Nfcssl,
    /// `PROXY nfc`: the same connection in clear, with no second TLS session.
    Nfc,
}

impl Transport {
    /// The dialogue line asking for this transport, without its line end.
    const fn proxy(self) -> &'static str {
        match self {
            Transport::Nfcssl => "PROXY nfcssl",
            Transport::Nfc => "PROXY nfc",
        }
    }

    /// The whole reply granting this transport; nothing else is written before it.
    const fn granted(self) -> &'static str {
        match self {
            Transport::Nfcssl => "200 Connect ha-nfcssl",
            Transport::Nfc => "200 Connect ha-nfc",
        }
    }
}

impl FromStr for Transport {
    type Err = String;

    /// Parses `nfcssl` or `nfc`, naming both on any other text.
    fn from_str(text: &str) -> Result<Transport, String> {
        match text {
            "nfcssl" => Ok(Transport::Nfcssl),
            "nfc" => Ok(Transport::Nfc),
            other => Err(format!("{other} is not nfcssl or nfc")),
        }
    }
}

impl fmt::Display for Transport {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Transport::Nfcssl => "nfcssl",
            Transport::Nfc => "nfc",
        })
    }
}

/// Errors from the data port, each naming its phase.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// Connecting or a TLS handshake failed.
    #[error(transparent)]
    Tls(#[from] tls::Error),
    /// A read or write failed or timed out.
    #[error("{phase}: {}", tls::describe(.source))]
    Io {
        /// The phase the I/O belonged to.
        phase: &'static str,
        /// The underlying error.
        #[source]
        source: io::Error,
    },
    /// The host closed the connection in the middle of a phase.
    #[error("the host closed the connection during the {0}")]
    Closed(&'static str),
    /// A line exceeds [`MAX_LINE_LEN`] bytes.
    #[error("the {0} line exceeds {MAX_LINE_LEN} bytes")]
    TooLong(&'static str),
    /// The greeting is malformed or lacks a required capability.
    #[error("greeting: {0}")]
    Greeting(#[from] greeting::Error),
    /// The host answered a dialogue command with something else than success.
    #[error("dialogue: {command} was answered {reply:?}")]
    Dialogue {
        /// The command sent.
        command: &'static str,
        /// The reply line, without its line end.
        reply: String,
    },
    /// The SHA-256 thumbprint the host announced in band is not its certificate's.
    #[error("dialogue: the host announced thumbprint {announced} but presented {presented}")]
    InBand {
        /// The thumbprint the `THUMBPRINT_SHA2` reply carried.
        announced: String,
        /// The SHA-256 thumbprint of the certificate the first session verified.
        presented: String,
    },
    /// The second TLS session did not present the certificate the first one did.
    #[error("the second tls session presented another certificate than the first")]
    Certificate,
    /// The handshake reply was not of the expected type.
    #[error("handshake: expected a type {expected} reply, the host sent type {observed}")]
    Handshake {
        /// The type the protocol calls for at that point.
        expected: u32,
        /// The type the host sent.
        observed: u32,
    },
    /// A record could not be decoded.
    #[error("record: {0}")]
    Record(#[from] record::Error),
    /// The host answered a record with another opcode or sequence number.
    #[error(
        "record: opcode {} sequence {} was answered with opcode {} sequence {}",
        sent.opcode, sent.sequence, received.opcode, received.sequence
    )]
    Echo {
        /// The header sent.
        sent: record::Header,
        /// The header received.
        received: record::Header,
    },
    /// The host sent a record answering no read in flight.
    #[error(
        "record: opcode {} sequence {} answers no read in flight",
        received.opcode, received.sequence
    )]
    Unmatched {
        /// The header received.
        received: record::Header,
    },
    /// The host answered a record with an error record before the reply.
    #[error("{what}: the host reported error {code}: {text}")]
    Refused {
        /// What was refused: the opcode sent, or the open and its path.
        what: String,
        /// The code the error record carried.
        code: u64,
        /// The text the error record carried, without a terminator.
        text: String,
    },
    /// The host refused to open the disk.
    #[error("open {path:?}: the host returned status {status}")]
    Open {
        /// The datastore path asked for.
        path: String,
        /// The status the reply carried.
        status: u64,
    },
    /// The host answered a read with a non-zero status.
    #[error("read {length} bytes at offset {offset}: the host returned status {status}")]
    Read {
        /// The disk offset the read asked.
        offset: u64,
        /// The length the read asked.
        length: u32,
        /// The status the chunk carried.
        status: u64,
    },
    /// Something to send is longer than a record can carry.
    #[error("record: {what} is {length} bytes, more than a record can carry")]
    Oversize {
        /// What was too long: the datastore path or a payload.
        what: &'static str,
        /// Its length in bytes.
        length: usize,
    },
    /// The host announced a reply longer than [`MAX_RECORD_LEN`].
    #[error(
        "record: the reply to opcode {opcode} announces {length} bytes, more than {MAX_RECORD_LEN}"
    )]
    ReplyTooLong {
        /// The opcode of the record answered.
        opcode: u32,
        /// The length the reply header announced.
        length: u32,
    },
    /// The random generator could not fill the session tag.
    #[error("could not draw a session tag from the random generator")]
    Random,
}

/// What an open disk is known by.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Disk {
    /// The handle later records name the disk by.
    pub handle: u64,
    /// The disk's capacity in bytes, as the host reported it.
    pub capacity: u64,
}

/// A read sent to the host whose chunks are still to come.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Pending {
    /// The header sent, which every chunk echoes.
    sent: record::Header,
    /// The disk offset asked.
    offset: u64,
    /// The length asked.
    length: u32,
}

/// Reads the greeting line a host sends first on its data port.
///
/// Bytes are read one at a time up to the line end, so nothing that follows
/// the greeting is consumed from `reader`.
///
/// # Errors
/// When the read fails or times out, the host closes the connection first,
/// the line is too long, or it is not a greeting.
pub fn read_greeting<R: Read>(reader: &mut R) -> Result<greeting::Greeting, Error> {
    Ok(greeting::parse(&read_line(reader, "greeting")?)?)
}

/// Reads a host's data-port greeting, then captures the certificate TLS presents.
///
/// TLS starts on the same connection right after the greeting line, and only
/// when the greeting announces [`greeting::SHA256_SUPPORTED`]: a host without
/// it gets no TLS handshake at all.
///
/// # Errors
/// When connecting or reading the greeting fails, the greeting lacks the
/// capability, or the TLS handshake fails.
pub(crate) fn capture(host: &str, port: u16) -> Result<tls::Presented, Error> {
    let mut stream = tls::connect(host, port)?;
    read_greeting(&mut stream)?.require(greeting::SHA256_SUPPORTED)?;
    Ok(tls::capture(&mut stream, host)?)
}

/// An established data session, ready to open a disk.
#[derive(Debug)]
pub struct Connection {
    stream: TcpStream,
    plane: Plane,
    next_sequence: u32,
    transcript: Transcript,
}

/// What carries the disk session: the second TLS session, or the socket in clear.
#[derive(Debug)]
enum Plane {
    Tls(Box<ClientConnection>),
    Clear,
}

/// The disk session's byte stream: TLS records or the socket in clear.
trait Wire: Read + Write {}

impl<S: Read + Write> Wire for S {}

impl Connection {
    /// Connects to `host:port` and runs everything up to the capabilities record.
    ///
    /// The greeting must announce SHA-256 support, and `NFCSSL supported`
    /// when `transport` is `nfcssl`; the first TLS session must present the
    /// certificate `pin` names, which is the ticket's thumbprint; `secret` is
    /// the ticket presented in that session. With `nfcssl` the second TLS
    /// session must present the same certificate; with `nfc` the connection
    /// goes on in clear. The handshake, hello, version and capabilities
    /// exchanges follow, each waiting for its reply.
    ///
    /// # Errors
    /// When any phase fails, naming that phase.
    pub fn establish(
        host: &str,
        port: u16,
        secret: &str,
        pin: &tls::Pin,
        transport: Transport,
        transcript: Transcript,
    ) -> Result<Connection, Error> {
        let mut stream = tls::connect(host, port)?;
        let greeted = read_greeting(&mut stream)?;
        transcript.greeting(&greeted.capabilities);
        greeted.require(greeting::SHA256_SUPPORTED)?;
        if transport == Transport::Nfcssl {
            greeted.require(greeting::NFCSSL_SUPPORTED)?;
        }
        let client = tls::Client::new(&tls::Trust::Pin(pin.clone()))?;
        let mut first = client.handshake(&mut stream, host)?;
        let (version, suite) = tls::negotiated(&first)?;
        transcript.tls("first session", version, suite);
        let certificate = tls::peer_certificate(&first)?;
        let tag = draw_tag()?;
        dialogue(
            &mut Stream::new(&mut first, &mut stream),
            secret,
            &tag,
            &certificate,
            transport,
            transcript,
        )?;
        // The PROXY reply is the last thing the host sends in the first
        // session, so nothing of it is left unread; dropping the connection
        // without a close notify keeps the stream clear for what follows.
        drop(first);
        let plane = match transport {
            Transport::Nfcssl => {
                let session = client.handshake(&mut stream, host)?;
                let (version, suite) = tls::negotiated(&session)?;
                transcript.tls("second session", version, suite);
                if tls::peer_certificate(&session)? != certificate {
                    return Err(Error::Certificate);
                }
                Plane::Tls(Box::new(session))
            }
            Transport::Nfc => Plane::Clear,
        };
        let mut connection = Connection {
            stream,
            plane,
            next_sequence: 0,
            transcript,
        };
        shake(&mut connection.data(), &tag, transcript)?;
        connection.exchange(record::HELLO, &record::HELLO_PAYLOAD, &[])?;
        connection.exchange(record::VERSION, &record::VERSION_PAYLOAD, &[])?;
        connection.exchange(record::CAPABILITIES, &record::CAPABILITIES_PAYLOAD, &[])?;
        Ok(connection)
    }

    /// Opens the disk at datastore `path` and returns its handle and capacity.
    ///
    /// # Errors
    /// When the exchange fails, the host answers with an error record, or
    /// the reply carries a non-zero status.
    pub fn open(&mut self, path: &str) -> Result<Disk, Error> {
        let length = u32::try_from(path.len()).ok().ok_or(Error::Oversize {
            what: "the datastore path",
            length: path.len(),
        })?;
        let reply = self
            .exchange(record::OPEN, &record::open_request(length), path.as_bytes())
            .map_err(|error| match error {
                Error::Refused { code, text, .. } => Error::Refused {
                    what: format!("open {path:?}"),
                    code,
                    text,
                },
                other => other,
            })?;
        let opened = record::open_reply(&reply)?.map_err(|status| Error::Open {
            path: path.to_owned(),
            status,
        })?;
        self.transcript.opened(opened.capacity, opened.sector_size);
        Ok(Disk {
            handle: opened.handle,
            capacity: opened.capacity,
        })
    }

    /// Closes the disk `handle` names.
    ///
    /// # Errors
    /// When the exchange fails.
    pub fn close(&mut self, handle: u64) -> Result<(), Error> {
        self.exchange(record::CLOSE, &record::close_request(handle), &[])?;
        Ok(())
    }

    /// Ends the session; the host closes the connection afterwards.
    ///
    /// # Errors
    /// When the exchange fails.
    pub fn end(&mut self) -> Result<(), Error> {
        self.exchange(record::END, &record::END_PAYLOAD, &[])?;
        Ok(())
    }

    /// Asks for `length` bytes at `offset` of the disk `handle` names, sent as `compression` says.
    ///
    /// Only the request goes out; the chunks answering it are read one at a
    /// time with [`Connection::chunk`].
    ///
    /// # Errors
    /// When the request cannot be sent.
    pub fn read(
        &mut self,
        handle: u64,
        offset: u64,
        length: u32,
        compression: u32,
    ) -> Result<Pending, Error> {
        let sequence = self.next_sequence;
        self.next_sequence = sequence.wrapping_add(1);
        let sent = send_record(
            &mut self.data(),
            sequence,
            record::READ,
            &record::read_request(handle, offset, length, compression),
            &[],
        )?;
        Ok(Pending {
            sent,
            offset,
            length,
        })
    }

    /// Reads the next chunk answering one of the reads `in_flight`.
    ///
    /// Returns the index of the read answered, what the chunk's header says
    /// and its bytes; the host answers reads in flight in any order.
    ///
    /// # Errors
    /// When the host closes or answers a read not in flight, reports an
    /// error record, or a non-zero status.
    pub fn chunk(
        &mut self,
        in_flight: &[Pending],
    ) -> Result<(usize, record::ReadReply, Vec<u8>), Error> {
        chunk(&mut self.data(), in_flight)
    }

    fn data(&mut self) -> Box<dyn Wire + '_> {
        match &mut self.plane {
            Plane::Tls(session) => Box::new(Stream::new(&mut **session, &mut self.stream)),
            Plane::Clear => Box::new(&mut self.stream),
        }
    }

    fn exchange(&mut self, opcode: u32, payload: &[u8], trailer: &[u8]) -> Result<Vec<u8>, Error> {
        let sequence = self.next_sequence;
        self.next_sequence = sequence.wrapping_add(1);
        exchange(&mut self.data(), sequence, opcode, payload, trailer)
    }
}

/// Reads one line ending in `\n`, one byte at a time so nothing after it is consumed.
fn read_line<R: Read>(reader: &mut R, phase: &'static str) -> Result<Vec<u8>, Error> {
    let mut line = Vec::new();
    let mut byte = [0_u8; 1];
    while line.last() != Some(&b'\n') {
        if line.len() == MAX_LINE_LEN {
            return Err(Error::TooLong(phase));
        }
        read_full(reader, &mut byte, phase)?;
        line.push(byte[0]);
    }
    Ok(line)
}

/// Fills `buffer` from `reader`, naming `phase` on failure.
fn read_full<R: Read>(reader: &mut R, buffer: &mut [u8], phase: &'static str) -> Result<(), Error> {
    reader
        .read_exact(buffer)
        .map_err(|error| match error.kind() {
            io::ErrorKind::UnexpectedEof => Error::Closed(phase),
            _ => Error::Io {
                phase,
                source: error,
            },
        })
}

/// Writes `bytes` and flushes, naming `phase` on failure.
fn send<W: Write>(writer: &mut W, bytes: &[u8], phase: &'static str) -> Result<(), Error> {
    writer
        .write_all(bytes)
        .and_then(|()| writer.flush())
        .map_err(|source| Error::Io { phase, source })
}

/// Reads a dialogue reply line without its line end.
fn reply<R: Read>(reader: &mut R) -> Result<String, Error> {
    let line = read_line(reader, "dialogue")?;
    Ok(String::from_utf8_lossy(&line).trim_end().to_owned())
}

/// Draws a session tag of [`handshake::TAG_LEN`] characters from [`TAG_ALPHABET`].
fn draw_tag() -> Result<[u8; handshake::TAG_LEN], Error> {
    let mut tag = [0_u8; handshake::TAG_LEN];
    aws_lc_rs::rand::fill(&mut tag).ok().ok_or(Error::Random)?;
    for byte in &mut tag {
        *byte = TAG_ALPHABET[usize::from(*byte) & TAG_INDEX_MASK];
    }
    Ok(tag)
}

/// Runs the ticket dialogue inside the first TLS session.
///
/// `SESSION <ticket>` gets no reply. `BANNER ` (with its trailing space) is
/// answered with a 220 line. `THUMBPRINT_SHA2 <tag>` is answered with
/// `200 <hash>`, where the hash must be the SHA-256 thumbprint of the
/// certificate this session verified. The `PROXY` line asking for
/// `transport` must be answered with exactly the line granting it; nothing
/// else is written before that.
fn dialogue<S: Read + Write>(
    stream: &mut S,
    secret: &str,
    tag: &[u8; handshake::TAG_LEN],
    certificate: &CertificateDer<'_>,
    transport: Transport,
    transcript: Transcript,
) -> Result<(), Error> {
    send(
        stream,
        format!("SESSION {secret}\r\n").as_bytes(),
        "dialogue",
    )?;
    transcript.sent("SESSION <ticket>");
    send(stream, b"BANNER \r\n", "dialogue")?;
    transcript.sent("BANNER ");
    let banner = reply(stream)?;
    transcript.received(&banner);
    if !banner.starts_with(BANNER_OK) {
        return Err(Error::Dialogue {
            command: "BANNER",
            reply: banner,
        });
    }
    let line = format!("THUMBPRINT_SHA2 {}", String::from_utf8_lossy(tag));
    send(stream, format!("{line}\r\n").as_bytes(), "dialogue")?;
    transcript.sent(&line);
    let answer = reply(stream)?;
    transcript.received(&answer);
    let announced = answer
        .strip_prefix(REPLY_OK)
        .and_then(|hash| tls::Pin::sha256(hash).ok())
        .ok_or_else(|| Error::Dialogue {
            command: "THUMBPRINT_SHA2",
            reply: answer.clone(),
        })?;
    if !announced.matches(certificate) {
        return Err(Error::InBand {
            announced: announced.to_string(),
            presented: tls::sha256(certificate),
        });
    }
    send(
        stream,
        format!("{}\r\n", transport.proxy()).as_bytes(),
        "dialogue",
    )?;
    transcript.sent(transport.proxy());
    let answer = reply(stream)?;
    transcript.received(&answer);
    if answer != transport.granted() {
        return Err(Error::Dialogue {
            command: transport.proxy(),
            reply: answer,
        });
    }
    Ok(())
}

/// Runs the [`handshake`] on the disk session, one message per write.
///
/// The host reads one message per TLS record, so every message is its own
/// write, and it acknowledges the tag only once the version message has
/// arrived, so the first three messages go out before any reply is awaited.
fn shake<S: Read + Write>(
    stream: &mut S,
    tag: &[u8; handshake::TAG_LEN],
    transcript: Transcript,
) -> Result<(), Error> {
    put(stream, handshake::TAG, &handshake::tag(tag), transcript)?;
    put(
        stream,
        handshake::TAG_END,
        &handshake::message(handshake::TAG_END, (0, 0)),
        transcript,
    )?;
    put(
        stream,
        handshake::VERSION,
        &handshake::message(handshake::VERSION, handshake::VERSION_ARGS),
        transcript,
    )?;
    expect(stream, handshake::TAG_ACK, transcript)?;
    expect(stream, handshake::VERSION, transcript)?;
    put(stream, handshake::NAME, &handshake::name(), transcript)?;
    put(
        stream,
        handshake::MODE,
        &handshake::message(handshake::MODE, handshake::MODE_ARGS),
        transcript,
    )?;
    put(
        stream,
        handshake::READY,
        &handshake::message(handshake::READY, (0, 0)),
        transcript,
    )?;
    expect(stream, handshake::READY, transcript)
}

/// Sends one handshake `message` of type `kind` as its own write.
fn put<W: Write>(
    stream: &mut W,
    kind: u32,
    message: &[u8],
    transcript: Transcript,
) -> Result<(), Error> {
    transcript.handshake_sent(kind);
    send(stream, message, "handshake")
}

/// Reads one handshake message and checks its type.
fn expect<R: Read>(reader: &mut R, expected: u32, transcript: Transcript) -> Result<(), Error> {
    let mut message = [0_u8; handshake::LEN];
    read_full(reader, &mut message, "handshake")?;
    let observed = handshake::kind(&message);
    transcript.handshake_received(observed);
    if observed != expected {
        return Err(Error::Handshake { expected, observed });
    }
    Ok(())
}

/// Sends one record and reads its reply, returning the reply payload.
///
/// An error record carrying the sent sequence number is read whole, text
/// included, and so is the reply that follows it, so the next exchange
/// starts on a record boundary; it is then reported as [`Error::Refused`].
fn exchange<S: Read + Write>(
    stream: &mut S,
    sequence: u32,
    opcode: u32,
    payload: &[u8],
    trailer: &[u8],
) -> Result<Vec<u8>, Error> {
    let sent = send_record(stream, sequence, opcode, payload, trailer)?;
    let mut received = read_header(stream)?;
    let mut refusal = None;
    if received.opcode == record::ERROR && received.sequence == sent.sequence {
        refusal = Some(refused(
            stream,
            sent,
            received,
            format!("opcode {}", sent.opcode),
        )?);
        received = read_header(stream)?;
    }
    if received.opcode != sent.opcode || received.sequence != sent.sequence {
        return Err(Error::Echo { sent, received });
    }
    let body = read_bounded(stream, sent.opcode, received.length)?;
    match refusal {
        Some(refusal) => Err(refusal),
        None => Ok(body),
    }
}

/// Reads the error record `received` in answer to `sent` and names `what` was refused.
fn refused<R: Read>(
    reader: &mut R,
    sent: record::Header,
    received: record::Header,
    what: String,
) -> Result<Error, Error> {
    let payload = read_bounded(reader, sent.opcode, received.length)?;
    let error = record::error_reply(&payload)?;
    let text = read_bounded(reader, sent.opcode, error.text_len)?;
    Ok(Error::Refused {
        what,
        code: error.code,
        text: String::from_utf8_lossy(&text).into_owned(),
    })
}

/// Sends one record, header then payload then trailer, and returns its header.
fn send_record<W: Write>(
    writer: &mut W,
    sequence: u32,
    opcode: u32,
    payload: &[u8],
    trailer: &[u8],
) -> Result<record::Header, Error> {
    let sent = record::Header {
        opcode,
        length: u32::try_from(payload.len()).ok().ok_or(Error::Oversize {
            what: "the payload",
            length: payload.len(),
        })?,
        sequence,
    };
    let mut bytes = record::encode(sent).to_vec();
    bytes.extend_from_slice(payload);
    bytes.extend_from_slice(trailer);
    send(writer, &bytes, "record")?;
    Ok(sent)
}

/// Reads one chunk answering a read `in_flight`: its index, the reply decoded, its trailer.
///
/// The chunk is matched to its read by sequence number, whatever order the
/// host answers in. An error record carrying a read's sequence number ends
/// that read: it is read whole and reported as [`Error::Refused`], and
/// nothing is awaited after it since the connection is not reused. A chunk
/// whose status is not zero is refused with the raw value, before its
/// trailer is read.
fn chunk<R: Read>(
    reader: &mut R,
    in_flight: &[Pending],
) -> Result<(usize, record::ReadReply, Vec<u8>), Error> {
    let received = read_header(reader)?;
    let Some((index, pending)) = in_flight
        .iter()
        .enumerate()
        .find(|(_, pending)| pending.sent.sequence == received.sequence)
    else {
        return Err(Error::Unmatched { received });
    };
    let sent = pending.sent;
    if received.opcode == record::ERROR {
        let what = format!("read {} bytes at offset {}", pending.length, pending.offset);
        return Err(refused(reader, sent, received, what)?);
    }
    if received.opcode != sent.opcode {
        return Err(Error::Echo { sent, received });
    }
    let payload = read_bounded(reader, sent.opcode, received.length)?;
    let reply = record::read_reply(&payload)?;
    if reply.status != 0 {
        return Err(Error::Read {
            offset: pending.offset,
            length: pending.length,
            status: reply.status,
        });
    }
    let data = read_bounded(reader, sent.opcode, reply.wire_length)?;
    Ok((index, reply, data))
}

/// Reads and decodes one record header.
fn read_header<R: Read>(reader: &mut R) -> Result<record::Header, Error> {
    let mut header = [0_u8; record::HEADER_LEN];
    read_full(reader, &mut header, "record")?;
    Ok(record::decode(&header)?)
}

/// Reads `announced` bytes of the reply to `opcode`, refusing more than [`MAX_RECORD_LEN`].
fn read_bounded<R: Read>(reader: &mut R, opcode: u32, announced: u32) -> Result<Vec<u8>, Error> {
    let length = usize::try_from(announced)
        .ok()
        .filter(|length| *length <= MAX_RECORD_LEN)
        .ok_or(Error::ReplyTooLong {
            opcode,
            length: announced,
        })?;
    let mut body = vec![0_u8; length];
    read_full(reader, &mut body, "record")?;
    Ok(body)
}

#[cfg(test)]
mod tests {
    use super::*;
    use greeting::ESXI_8;
    use std::io::Cursor;

    const TAG: &[u8; 16] = b"ABCDEFGHIJKLMNOP";
    const QUIET: Transcript = Transcript::new(false);

    /// A scripted peer: replies come from `input`, each write the client makes lands in `writes`.
    ///
    /// Reads time out until `unlock_at` bytes have been written, the way a
    /// host that answers only once a given message has arrived behaves.
    struct Peer {
        input: Cursor<Vec<u8>>,
        writes: Vec<Vec<u8>>,
        unlock_at: usize,
    }

    impl Peer {
        fn replying(script: &[&[u8]]) -> Peer {
            Peer::replying_after(0, script)
        }

        fn replying_after(written: usize, script: &[&[u8]]) -> Peer {
            Peer {
                input: Cursor::new(script.concat()),
                writes: Vec::new(),
                unlock_at: written,
            }
        }

        fn written(&self) -> usize {
            self.writes.iter().map(Vec::len).sum()
        }

        fn output(&self) -> Vec<u8> {
            self.writes.concat()
        }
    }

    impl Read for Peer {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            if self.written() < self.unlock_at {
                return Err(io::Error::from(io::ErrorKind::TimedOut));
            }
            self.input.read(buffer)
        }
    }

    impl Write for Peer {
        fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
            self.writes.push(bytes.to_vec());
            Ok(bytes.len())
        }

        fn flush(&mut self) -> io::Result<()> {
            Ok(())
        }
    }

    fn certificate() -> CertificateDer<'static> {
        CertificateDer::from(b"not really a certificate".to_vec())
    }

    fn thumbprint_reply() -> Vec<u8> {
        format!("200 {}\r\n", tls::sha256(&certificate())).into_bytes()
    }

    #[test]
    fn the_greeting_is_read_up_to_its_line_end_and_no_further() {
        let mut reader = Cursor::new([ESXI_8, b"\x16\x03\x01"].concat());

        let greeting = read_greeting(&mut reader).unwrap();

        assert_eq!(greeting.require(greeting::SHA256_SUPPORTED), Ok(()));
        assert_eq!(reader.position(), ESXI_8.len() as u64);
    }

    #[test]
    fn a_connection_closed_before_the_line_ends_names_the_greeting() {
        let mut reader = Cursor::new(&b"220 VMware Authentication"[..]);

        let error = read_greeting(&mut reader).unwrap_err();

        assert!(matches!(error, Error::Closed("greeting")), "{error:?}");
        assert_eq!(
            error.to_string(),
            "the host closed the connection during the greeting"
        );
    }

    #[test]
    fn a_line_longer_than_the_limit_is_refused() {
        let mut reader = Cursor::new(vec![b'a'; MAX_LINE_LEN + 1]);

        let error = read_greeting(&mut reader).unwrap_err();

        assert!(matches!(error, Error::TooLong("greeting")), "{error:?}");
        assert_eq!(error.to_string(), "the greeting line exceeds 1024 bytes");
    }

    #[test]
    fn a_line_exactly_at_the_limit_is_still_read() {
        let mut line = b"220 v: ".to_vec();
        line.resize(MAX_LINE_LEN - 1, b'x');
        line.push(b'\n');
        let mut reader = Cursor::new(line);

        assert!(read_greeting(&mut reader).is_ok());
    }

    #[test]
    fn a_missing_capability_is_reported_under_the_greeting_phase() {
        let mut reader = Cursor::new(&b"220 v: SSL Required\r\n"[..]);

        let error = read_greeting(&mut reader)
            .unwrap()
            .require(greeting::SHA256_SUPPORTED)
            .map_err(Error::from)
            .unwrap_err();

        assert!(
            error
                .to_string()
                .starts_with("greeting: the host does not announce")
        );
    }

    #[test]
    fn a_silent_host_fails_naming_the_greeting_phase_after_the_read_timeout() {
        struct Silent;
        impl Read for Silent {
            fn read(&mut self, _buffer: &mut [u8]) -> io::Result<usize> {
                Err(io::Error::from(io::ErrorKind::TimedOut))
            }
        }

        let error = read_greeting(&mut Silent).unwrap_err();

        assert!(
            matches!(
                error,
                Error::Io {
                    phase: "greeting",
                    ..
                }
            ),
            "{error:?}"
        );
        assert_eq!(error.to_string(), "greeting: timed out");
    }

    #[test]
    fn a_transport_parses_from_its_name_and_prints_it_back() {
        for (name, transport) in [("nfcssl", Transport::Nfcssl), ("nfc", Transport::Nfc)] {
            assert_eq!(name.parse::<Transport>(), Ok(transport));
            assert_eq!(transport.to_string(), name);
        }
        assert_eq!(
            "ssl".parse::<Transport>(),
            Err("ssl is not nfcssl or nfc".to_owned())
        );
    }

    #[test]
    fn the_dialogue_sends_its_four_lines_in_order_and_accepts_the_proxy() {
        let mut peer = Peer::replying(&[
            b"220 VMware Authentication Daemon Version 1.10\r\n",
            &thumbprint_reply(),
            b"200 Connect ha-nfcssl\r\n",
        ]);

        dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap();

        assert_eq!(
            peer.output(),
            b"SESSION ticket-0\r\nBANNER \r\nTHUMBPRINT_SHA2 ABCDEFGHIJKLMNOP\r\nPROXY nfcssl\r\n"
        );
    }

    #[test]
    fn the_nfc_transport_asks_proxy_nfc_and_is_granted_by_its_own_connect_line() {
        let mut peer = Peer::replying(&[
            b"220 ok\r\n",
            &thumbprint_reply(),
            b"200 Connect ha-nfc\r\n",
        ]);

        dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfc,
            QUIET,
        )
        .unwrap();

        assert!(peer.output().ends_with(b"PROXY nfc\r\n"));
    }

    #[test]
    fn the_nfc_transport_refuses_the_nfcssl_connect_line() {
        let mut peer = Peer::replying(&[
            b"220 ok\r\n",
            &thumbprint_reply(),
            b"200 Connect ha-nfcssl\r\n",
        ]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfc,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "dialogue: PROXY nfc was answered \"200 Connect ha-nfcssl\""
        );
    }

    #[test]
    fn a_banner_reply_without_220_ends_the_dialogue_before_the_thumbprint() {
        let mut peer = Peer::replying(&[b"500 go away\r\n"]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "dialogue: BANNER was answered \"500 go away\""
        );
        assert_eq!(peer.output(), b"SESSION ticket-0\r\nBANNER \r\n");
    }

    #[test]
    fn a_thumbprint_reply_that_is_not_a_hash_is_refused() {
        let mut peer = Peer::replying(&[b"220 ok\r\n", b"200 not-a-hash\r\n"]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "dialogue: THUMBPRINT_SHA2 was answered \"200 not-a-hash\""
        );
        assert!(!peer.output().ends_with(b"PROXY nfcssl\r\n"));
    }

    #[test]
    fn an_in_band_thumbprint_of_another_certificate_aborts_before_proxy() {
        let other = tls::sha256(b"another certificate");
        let mut peer = Peer::replying(&[b"220 ok\r\n", format!("200 {other}\r\n").as_bytes()]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            format!(
                "dialogue: the host announced thumbprint sha256:{other} but presented {}",
                tls::sha256(&certificate())
            )
        );
        assert!(!peer.output().ends_with(b"PROXY nfcssl\r\n"));
    }

    #[test]
    fn a_proxy_reply_other_than_the_connect_line_is_refused() {
        let mut peer = Peer::replying(&[
            b"220 ok\r\n",
            &thumbprint_reply(),
            b"200 Connect ha-nfc\r\n",
        ]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "dialogue: PROXY nfcssl was answered \"200 Connect ha-nfc\""
        );
    }

    #[test]
    fn a_host_that_closes_during_the_dialogue_is_reported_as_such() {
        let mut peer = Peer::replying(&[b"220 ok\r\n"]);

        let error = dialogue(
            &mut peer,
            "ticket-0",
            TAG,
            &certificate(),
            Transport::Nfcssl,
            QUIET,
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host closed the connection during the dialogue"
        );
    }

    #[test]
    fn the_handshake_writes_one_message_per_record_and_the_version_before_waiting_for_the_ack() {
        // The host answers nothing until the version message has arrived.
        let mut peer = Peer::replying_after(
            3 * handshake::LEN,
            &[
                &handshake::message(handshake::TAG_ACK, (0, 0)),
                &handshake::message(handshake::VERSION, (9, 0)),
                &handshake::message(handshake::READY, (0, 0)),
            ],
        );

        shake(&mut peer, TAG, QUIET).unwrap();

        assert_eq!(
            peer.writes,
            [
                handshake::tag(TAG).to_vec(),
                handshake::message(handshake::TAG_END, (0, 0)).to_vec(),
                handshake::message(handshake::VERSION, (12, 1)).to_vec(),
                handshake::name(),
                handshake::message(handshake::MODE, (3, 0)).to_vec(),
                handshake::message(handshake::READY, (0, 0)).to_vec(),
            ]
        );
    }

    #[test]
    fn an_error_message_in_place_of_the_version_echo_names_both_types() {
        let mut peer = Peer::replying(&[
            &handshake::message(handshake::TAG_ACK, (0, 0)),
            &handshake::message(handshake::ERROR, (0, 0)),
        ]);

        let error = shake(&mut peer, TAG, QUIET).unwrap_err();

        assert_eq!(
            error.to_string(),
            "handshake: expected a type 51 reply, the host sent type 4"
        );
        assert_eq!(peer.output().len(), 3 * handshake::LEN);
    }

    #[test]
    fn a_host_that_closes_during_the_handshake_is_reported_as_such() {
        let mut peer = Peer::replying(&[&[0_u8; 10]]);

        let error = shake(&mut peer, TAG, QUIET).unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host closed the connection during the handshake"
        );
    }

    #[test]
    fn an_exchange_sends_header_payload_and_trailer_and_returns_the_echoed_reply_body() {
        let reply = record::encode(record::Header {
            opcode: record::OPEN,
            length: 3,
            sequence: 7,
        });
        let mut peer = Peer::replying(&[&reply, b"abc"]);

        let body = exchange(&mut peer, 7, record::OPEN, &[1, 2], b"[ds] a.vmdk").unwrap();

        assert_eq!(body, b"abc");
        let mut expected = record::encode(record::Header {
            opcode: record::OPEN,
            length: 2,
            sequence: 7,
        })
        .to_vec();
        expected.extend_from_slice(&[1, 2]);
        expected.extend_from_slice(b"[ds] a.vmdk");
        assert_eq!(peer.output(), expected);
    }

    #[test]
    fn a_reply_with_another_opcode_or_sequence_is_refused_naming_both() {
        let reply = record::encode(record::Header {
            opcode: record::HELLO,
            length: 0,
            sequence: 1,
        });
        let mut peer = Peer::replying(&[&reply]);

        let error = exchange(&mut peer, 0, record::HELLO, &[], &[]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "record: opcode 2 sequence 0 was answered with opcode 2 sequence 1"
        );
    }

    #[test]
    fn a_reply_with_a_bad_magic_is_refused_under_the_record_phase() {
        let mut peer = Peer::replying(&[&[0_u8; 16]]);

        let error = exchange(&mut peer, 0, record::HELLO, &[], &[]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "record: record header magic 0x00000000 is not 0xA100DA7A"
        );
    }

    #[test]
    fn a_host_that_closes_during_a_record_reply_is_reported_as_such() {
        let mut peer = Peer::replying(&[&[0x7A, 0xDA]]);

        let error = exchange(&mut peer, 0, record::END, &record::END_PAYLOAD, &[]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host closed the connection during the record"
        );
    }

    #[test]
    fn a_reply_at_the_record_limit_is_read_and_a_longer_one_is_refused_unread() {
        let header = |length: u32| {
            record::encode(record::Header {
                opcode: record::HELLO,
                length,
                sequence: 0,
            })
        };
        let at_limit = u32::try_from(MAX_RECORD_LEN).unwrap();
        let mut peer = Peer::replying(&[&header(at_limit), &vec![7_u8; MAX_RECORD_LEN]]);
        let body = exchange(&mut peer, 0, record::HELLO, &[], &[]).unwrap();
        assert_eq!(body.len(), MAX_RECORD_LEN);

        let mut peer = Peer::replying(&[&header(at_limit + 1)]);
        let error = exchange(&mut peer, 0, record::HELLO, &[], &[]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "record: the reply to opcode 2 announces 1048577 bytes, more than 1048576"
        );
    }

    /// An error record for `sequence`: header, 16-byte payload, then `text` as trailer.
    fn error_record(sequence: u32, code: u64, text: &[u8]) -> Vec<u8> {
        let mut bytes = record::encode(record::Header {
            opcode: record::ERROR,
            length: 16,
            sequence,
        })
        .to_vec();
        bytes.extend_from_slice(&code.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(&u32::try_from(text.len()).unwrap().to_le_bytes());
        bytes.extend_from_slice(text);
        bytes
    }

    #[test]
    fn an_error_record_before_the_reply_is_drained_with_it_and_reported_with_code_and_text() {
        let text =
            b"NfcAioProcessOpenFileMsg: permission check failed for file '[ds] a.vmdk', access = 1";
        let reply = record::encode(record::Header {
            opcode: record::OPEN,
            length: 60,
            sequence: 7,
        });
        let mut peer = Peer::replying(&[&error_record(7, 11, text), &reply, &[0_u8; 60]]);

        let error = exchange(
            &mut peer,
            7,
            record::OPEN,
            &record::open_request(11),
            b"[ds] a.vmdk",
        )
        .unwrap_err();

        assert_eq!(
            error.to_string(),
            format!(
                "opcode 4: the host reported error 11: {}",
                String::from_utf8_lossy(text)
            )
        );
        assert_eq!(
            peer.input.position(),
            u64::try_from(peer.input.get_ref().len()).unwrap(),
            "the error record and the reply are both drained"
        );
    }

    #[test]
    fn an_error_record_with_another_sequence_is_refused_naming_both_headers() {
        let mut peer = Peer::replying(&[&error_record(8, 11, b"late")]);

        let error = exchange(&mut peer, 7, record::OPEN, &[], &[]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "record: opcode 4 sequence 7 was answered with opcode 1 sequence 8"
        );
    }

    #[test]
    fn an_error_text_longer_than_a_record_is_refused_unread_and_a_short_error_record_too() {
        let mut oversized = error_record(7, 11, b"");
        let at_limit = u32::try_from(MAX_RECORD_LEN).unwrap();
        oversized[28..32].copy_from_slice(&(at_limit + 1).to_le_bytes());
        let mut peer = Peer::replying(&[&oversized]);
        let error = exchange(&mut peer, 7, record::OPEN, &[], &[]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "record: the reply to opcode 4 announces 1048577 bytes, more than 1048576"
        );

        let short = record::encode(record::Header {
            opcode: record::ERROR,
            length: 8,
            sequence: 7,
        });
        let mut peer = Peer::replying(&[&short, &[0_u8; 8]]);
        let error = exchange(&mut peer, 7, record::OPEN, &[], &[]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "record: the error record holds 8 bytes instead of 16"
        );
    }

    /// The read `pending` names, as [`Connection::read`] would record it.
    fn pending(sequence: u32, offset: u64, length: u32) -> Pending {
        Pending {
            sent: record::Header {
                opcode: record::READ,
                length: u32::try_from(record::READ_LEN).unwrap(),
                sequence,
            },
            offset,
            length,
        }
    }

    /// One chunk record for `sequence`: header, 44-byte payload, then `data` as trailer.
    fn chunk_record(sequence: u32, reply: record::ReadReply, data: &[u8]) -> Vec<u8> {
        let mut bytes = record::encode(record::Header {
            opcode: record::READ,
            length: u32::try_from(record::READ_LEN).unwrap(),
            sequence,
        })
        .to_vec();
        bytes.extend_from_slice(&reply.status.to_le_bytes());
        bytes.extend_from_slice(&1_u32.to_le_bytes());
        bytes.extend_from_slice(&reply.compression.to_le_bytes());
        bytes.extend_from_slice(&reply.base_offset.to_le_bytes());
        bytes.extend_from_slice(&reply.total_length.to_le_bytes());
        bytes.extend_from_slice(&reply.chunk_offset.to_le_bytes());
        bytes.extend_from_slice(&reply.chunk_length.to_le_bytes());
        bytes.extend_from_slice(&reply.wire_length.to_le_bytes());
        bytes.extend_from_slice(&0_u32.to_le_bytes());
        bytes.extend_from_slice(data);
        bytes
    }

    fn good_chunk() -> record::ReadReply {
        record::ReadReply {
            status: 0,
            compression: 0,
            base_offset: 4096,
            total_length: 1024,
            chunk_offset: 512,
            chunk_length: 3,
            wire_length: 3,
        }
    }

    #[test]
    fn a_chunk_is_read_with_its_header_fields_and_its_trailing_bytes() {
        let mut peer = Peer::replying(&[&chunk_record(3, good_chunk(), b"abc"), b"next"]);

        let (index, reply, data) = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap();

        assert_eq!(index, 0);
        assert_eq!(reply, good_chunk());
        assert_eq!(data, b"abc");
        assert_eq!(
            peer.input.position(),
            u64::try_from(peer.input.get_ref().len() - 4).unwrap(),
            "only the chunk is consumed"
        );
    }

    #[test]
    fn an_error_record_answering_a_read_is_reported_with_the_read_and_nothing_more_awaited() {
        let mut peer = Peer::replying(&[&error_record(3, 13, b"NfcAioReadFile failed")]);

        let error = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "read 1024 bytes at offset 4096: the host reported error 13: NfcAioReadFile failed"
        );
    }

    #[test]
    fn a_chunk_answering_the_second_of_two_reads_in_flight_is_returned_with_its_index() {
        let mut peer = Peer::replying(&[&chunk_record(4, good_chunk(), b"abc")]);
        let in_flight = [pending(3, 0, 512), pending(4, 4096, 1024)];

        let (index, reply, data) = chunk(&mut peer, &in_flight).unwrap();

        assert_eq!((index, reply, data), (1, good_chunk(), b"abc".to_vec()));
    }

    #[test]
    fn an_error_record_answering_the_second_read_in_flight_names_that_read() {
        let mut peer = Peer::replying(&[&error_record(4, 13, b"NfcAioReadFile failed")]);
        let in_flight = [pending(3, 0, 512), pending(4, 4096, 1024)];

        let error = chunk(&mut peer, &in_flight).unwrap_err();

        assert_eq!(
            error.to_string(),
            "read 1024 bytes at offset 4096: the host reported error 13: NfcAioReadFile failed"
        );
    }

    #[test]
    fn a_chunk_answering_no_read_in_flight_is_refused_naming_its_header() {
        let mut peer = Peer::replying(&[&chunk_record(5, good_chunk(), b"abc")]);
        let in_flight = [pending(3, 0, 512), pending(4, 4096, 1024)];

        let error = chunk(&mut peer, &in_flight).unwrap_err();

        assert_eq!(
            error.to_string(),
            "record: opcode 7 sequence 5 answers no read in flight"
        );
    }

    #[test]
    fn a_record_of_another_opcode_answering_a_read_in_flight_is_refused_naming_both_headers() {
        let mut other = chunk_record(3, good_chunk(), b"abc");
        other[4..8].copy_from_slice(&record::OPEN.to_le_bytes());
        let mut peer = Peer::replying(&[&other]);

        let error = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "record: opcode 7 sequence 3 was answered with opcode 4 sequence 3"
        );
    }

    #[test]
    fn a_chunk_with_a_non_zero_status_is_refused_naming_the_read_and_the_status() {
        let refused = record::ReadReply {
            status: 5,
            ..good_chunk()
        };
        let mut peer = Peer::replying(&[&chunk_record(3, refused, b"abc")]);

        let error = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap_err();

        assert_eq!(
            error.to_string(),
            "read 1024 bytes at offset 4096: the host returned status 5"
        );
    }

    #[test]
    fn a_chunk_is_returned_with_the_compression_it_declares() {
        let compressed = record::ReadReply {
            compression: 3,
            ..good_chunk()
        };
        let mut peer = Peer::replying(&[&chunk_record(3, compressed, b"abc")]);

        let (index, reply, data) = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap();

        assert_eq!((index, reply.compression, data), (0, 3, b"abc".to_vec()));
    }

    #[test]
    fn a_host_that_closes_during_a_chunk_is_reported_and_a_short_chunk_reply_refused() {
        let mut peer = Peer::replying(&[&chunk_record(3, good_chunk(), b"ab")]);
        let error = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "the host closed the connection during the record"
        );

        let mut short = chunk_record(3, good_chunk(), b"");
        short[8..12].copy_from_slice(&40_u32.to_le_bytes());
        let mut peer = Peer::replying(&[&short]);
        let error = chunk(&mut peer, &[pending(3, 4096, 1024)]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "record: the read reply holds 40 bytes instead of 44"
        );
    }

    #[test]
    fn a_session_tag_has_sixteen_base64_characters() {
        let tag = draw_tag().unwrap();
        assert_eq!(tag.len(), 16);
        assert!(tag.iter().all(|byte| TAG_ALPHABET.contains(byte)));
    }

    #[test]
    fn an_open_status_error_names_the_path_and_the_status() {
        let error = Error::Open {
            path: "[ds] vm/vm.vmdk".to_owned(),
            status: 5,
        };
        assert_eq!(
            error.to_string(),
            "open \"[ds] vm/vm.vmdk\": the host returned status 5"
        );
        let error = Error::Oversize {
            what: "the datastore path",
            length: usize::MAX,
        };
        assert_eq!(
            error.to_string(),
            format!(
                "record: the datastore path is {} bytes, more than a record can carry",
                usize::MAX
            )
        );
    }
}
