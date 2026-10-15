//! A fixed-newstyle NBD server over two streams: negotiation and requests.
//!
//! Layouts and constants follow the NBD protocol document
//! (<https://github.com/NetworkBlockDevice/nbd/blob/master/doc/proto.md>);
//! every multi-byte field is big-endian. `NBD_OPT_EXPORT_NAME`,
//! `NBD_OPT_GO`, `NBD_OPT_INFO` and `NBD_OPT_ABORT` are served; every other
//! option is answered `NBD_REP_ERR_UNSUP`. The export is read-only: reads
//! are served, every other request is refused with the error it deserves.

use std::io::{self, Read, Write};

use crate::transcript::Transcript;

/// The initial magic, the ASCII of `NBDMAGIC`.
pub const NBDMAGIC: u64 = 0x4E42_444D_4147_4943;
/// The option magic, the ASCII of `IHAVEOPT`, opening the greeting and every option.
pub const IHAVEOPT: u64 = 0x4948_4156_454F_5054;
/// The magic opening every option reply.
pub const REPLY_MAGIC: u64 = 0x0003_e889_0455_65a9;
/// Handshake flag: the server speaks fixed newstyle.
pub const FLAG_FIXED_NEWSTYLE: u16 = 1;
/// Handshake flag: the server offers to skip the 124 zero bytes after the export size.
pub const FLAG_NO_ZEROES: u16 = 2;
/// Client flag: the client speaks fixed newstyle; required.
pub const FLAG_C_FIXED_NEWSTYLE: u32 = 1;
/// Client flag: the client agrees to skip the 124 zero bytes.
pub const FLAG_C_NO_ZEROES: u32 = 2;
/// The option that names the export and enters transmission at once.
pub const OPT_EXPORT_NAME: u32 = 1;
/// The option that ends the negotiation without an export.
pub const OPT_ABORT: u32 = 2;
/// The option asking about an export while staying in negotiation.
pub const OPT_INFO: u32 = 6;
/// The option asking about an export and entering transmission on success.
pub const OPT_GO: u32 = 7;
/// The reply accepting an option, or closing a run of info replies.
pub const REP_ACK: u32 = 1;
/// The reply carrying one piece of information about the export.
pub const REP_INFO: u32 = 3;
/// The reply refusing an option the server does not serve.
pub const REP_ERR_UNSUP: u32 = 0x8000_0001;
/// The reply refusing an option whose data is malformed.
pub const REP_ERR_INVALID: u32 = 0x8000_0003;
/// The info carrying the export size and the transmission flags.
pub const INFO_EXPORT: u16 = 0;
/// The info naming the minimum, preferred and maximum request sizes.
pub const INFO_BLOCK_SIZE: u16 = 3;
/// The smallest request advertised: one sector, the unit the host reads in.
///
/// Advertised only; a request off a sector is still served, since the host
/// reads are widened to sectors anyway.
pub const MIN_BLOCK_SIZE: u32 = 512;
/// The request size advertised as efficient: one host read, one mebibyte.
pub const PREFERRED_BLOCK_SIZE: u32 = 1 << 20;
/// The longest read served, 32 MiB: the protocol's baseline maximum.
///
/// A reply is held whole in memory, so a longer read is refused before its
/// buffer is allocated.
pub const MAX_PAYLOAD: u32 = 1 << 25;
/// Transmission flag: the flags field is meaningful; always set.
pub const FLAG_HAS_FLAGS: u16 = 1;
/// Transmission flag: the export cannot be written.
pub const FLAG_READ_ONLY: u16 = 2;
/// What the greeting offers: [`FLAG_FIXED_NEWSTYLE`] and [`FLAG_NO_ZEROES`].
const HANDSHAKE_FLAGS: u16 = 0b11;
/// What every export reports: [`FLAG_HAS_FLAGS`] and [`FLAG_READ_ONLY`].
const EXPORT_FLAGS: u16 = 0b11;
/// The magic opening every request.
pub const REQUEST_MAGIC: u32 = 0x2560_9513;
/// The magic opening every simple reply.
pub const SIMPLE_REPLY_MAGIC: u32 = 0x6744_6698;
/// The request for `length` bytes at `offset`; its reply carries them after the header.
pub const CMD_READ: u16 = 0;
/// The request to write the `length` bytes that follow it; refused, the bytes dropped.
pub const CMD_WRITE: u16 = 1;
/// The request that ends the session; it gets no reply.
pub const CMD_DISC: u16 = 2;
/// The request to discard a range; refused.
pub const CMD_TRIM: u16 = 4;
/// The request to zero a range; refused.
pub const CMD_WRITE_ZEROES: u16 = 6;
/// The error a write of any kind is answered with: the export is read-only.
pub const EPERM: u32 = 1;
/// The error a read the server could not complete is answered with.
pub const EIO: u32 = 5;
/// The error a request the server cannot serve is answered with.
pub const EINVAL: u32 = 22;
/// The most option data accepted: an export name and a short info list.
///
/// Anything longer is a protocol failure rather than an allocation.
pub const MAX_OPTION_LEN: u32 = 4096;
/// Length of the greeting: two magics and the handshake flags.
pub const GREETING_LEN: usize = 18;
/// Length of an option header: magic, option and data length.
pub const OPTION_LEN: usize = 16;
/// Length of an option reply without data.
pub const OPTION_REPLY_LEN: usize = 20;
/// Zero bytes after the export size and flags, unless `NO_ZEROES` was agreed.
pub const ZEROES_LEN: usize = 124;
/// Length of a request: magic, flags, type, cookie, offset, length.
pub const REQUEST_LEN: usize = 28;
/// Length of a simple reply header: magic, error, cookie.
pub const SIMPLE_REPLY_LEN: usize = 16;
/// Length of the export info: type, size, transmission flags.
pub const INFO_EXPORT_LEN: usize = 12;
/// Length of the block-size info: type and the three sizes.
pub const INFO_BLOCK_SIZE_LEN: usize = 14;

/// Errors of the NBD side, each a protocol violation or a lost client.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// A read from or write to the client failed.
    #[error("nbd: {0}")]
    Io(#[source] io::Error),
    /// The client closed its end before sending `NBD_CMD_DISC`.
    #[error("the nbd client left without disconnecting")]
    Left,
    /// The client does not speak fixed newstyle.
    #[error("nbd: the client flags {0:#x} lack NBD_FLAG_C_FIXED_NEWSTYLE")]
    NotFixedNewstyle(u32),
    /// An option did not start with the option magic.
    #[error("nbd: option magic {0:#018x} is not IHAVEOPT")]
    OptionMagic(u64),
    /// An option carries more data than [`MAX_OPTION_LEN`].
    #[error("nbd: option {option} carries {length} bytes, more than {MAX_OPTION_LEN}")]
    OptionTooLong {
        /// The option.
        option: u32,
        /// Its announced data length.
        length: u32,
    },
    /// A request did not start with the request magic.
    #[error("nbd: request magic {0:#010x} is not NBD_REQUEST_MAGIC")]
    RequestMagic(u32),
}

/// One request read from the client.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Request {
    /// The command flags.
    pub flags: u16,
    /// The command type, such as [`CMD_DISC`].
    pub kind: u16,
    /// The cookie a reply echoes.
    pub cookie: u64,
    /// The offset in the export.
    pub offset: u64,
    /// The length of the range.
    pub length: u32,
}

/// The header of an option the client sent.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct OptionHeader {
    /// The option.
    pub option: u32,
    /// The length of the data that follows.
    pub length: u32,
}

/// How a negotiation ended.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Negotiated {
    /// The client took the export; transmission follows.
    Export,
    /// The client aborted; nothing follows.
    Abort,
}

/// The greeting: both magics and the handshake flags.
#[must_use]
pub fn greeting() -> [u8; GREETING_LEN] {
    let mut bytes = [0_u8; GREETING_LEN];
    bytes[..8].copy_from_slice(&NBDMAGIC.to_be_bytes());
    bytes[8..16].copy_from_slice(&IHAVEOPT.to_be_bytes());
    bytes[16..].copy_from_slice(&HANDSHAKE_FLAGS.to_be_bytes());
    bytes
}

/// Reads the client flags and requires fixed newstyle.
///
/// # Errors
/// When [`FLAG_C_FIXED_NEWSTYLE`] is not set.
pub fn client_flags(bytes: &[u8; 4]) -> Result<u32, Error> {
    let flags = u32::from_be_bytes(*bytes);
    if flags & FLAG_C_FIXED_NEWSTYLE == 0 {
        return Err(Error::NotFixedNewstyle(flags));
    }
    Ok(flags)
}

/// Decodes an option header.
///
/// # Errors
/// When the magic is not [`IHAVEOPT`] or the data is longer than [`MAX_OPTION_LEN`].
pub fn option_header(bytes: &[u8; OPTION_LEN]) -> Result<OptionHeader, Error> {
    let magic = u64::from_be_bytes([
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5], bytes[6], bytes[7],
    ]);
    if magic != IHAVEOPT {
        return Err(Error::OptionMagic(magic));
    }
    let header = OptionHeader {
        option: u32::from_be_bytes([bytes[8], bytes[9], bytes[10], bytes[11]]),
        length: u32::from_be_bytes([bytes[12], bytes[13], bytes[14], bytes[15]]),
    };
    if header.length > MAX_OPTION_LEN {
        return Err(Error::OptionTooLong {
            option: header.option,
            length: header.length,
        });
    }
    Ok(header)
}

/// An option reply of type `reply` to `option`, carrying `data`.
#[must_use]
pub fn option_reply(option: u32, reply: u32, data: &[u8]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(OPTION_REPLY_LEN + data.len());
    bytes.extend_from_slice(&REPLY_MAGIC.to_be_bytes());
    bytes.extend_from_slice(&option.to_be_bytes());
    bytes.extend_from_slice(&reply.to_be_bytes());
    let length = u32::try_from(data.len()).unwrap_or(u32::MAX);
    bytes.extend_from_slice(&length.to_be_bytes());
    bytes.extend_from_slice(data);
    bytes
}

/// Whether `NBD_OPT_INFO` or `NBD_OPT_GO` data holds a name and an info list exactly.
///
/// Neither is read: there is one disk, and both infos are sent whatever the
/// list asks.
fn is_info_request(data: &[u8]) -> bool {
    let Some((length, rest)) = data.split_first_chunk::<4>() else {
        return false;
    };
    let Ok(length) = usize::try_from(u32::from_be_bytes(*length)) else {
        return false;
    };
    let Some((_, rest)) = rest.split_at_checked(length) else {
        return false;
    };
    let Some((count, rest)) = rest.split_first_chunk::<2>() else {
        return false;
    };
    rest.len() == usize::from(u16::from_be_bytes(*count)) * 2
}

/// The export info: size and the read-only transmission flags.
#[must_use]
pub fn export_info(size: u64) -> [u8; INFO_EXPORT_LEN] {
    let mut bytes = [0_u8; INFO_EXPORT_LEN];
    bytes[..2].copy_from_slice(&INFO_EXPORT.to_be_bytes());
    bytes[2..10].copy_from_slice(&size.to_be_bytes());
    bytes[10..].copy_from_slice(&EXPORT_FLAGS.to_be_bytes());
    bytes
}

/// The block-size info: minimum, preferred and maximum request sizes.
#[must_use]
pub fn block_size_info() -> [u8; INFO_BLOCK_SIZE_LEN] {
    let mut bytes = [0_u8; INFO_BLOCK_SIZE_LEN];
    bytes[..2].copy_from_slice(&INFO_BLOCK_SIZE.to_be_bytes());
    bytes[2..6].copy_from_slice(&MIN_BLOCK_SIZE.to_be_bytes());
    bytes[6..10].copy_from_slice(&PREFERRED_BLOCK_SIZE.to_be_bytes());
    bytes[10..].copy_from_slice(&MAX_PAYLOAD.to_be_bytes());
    bytes
}

/// Both infos then the ack, answering a well-formed `NBD_OPT_INFO` or `NBD_OPT_GO`.
///
/// The client's info list is not consulted: the export info is mandatory,
/// the block-size info is sent whether or not it was asked, since the
/// limits hold either way, and any other type is ignored.
fn info_replies(option: u32, size: u64) -> Vec<u8> {
    let mut bytes = option_reply(option, REP_INFO, &export_info(size));
    bytes.extend(option_reply(option, REP_INFO, &block_size_info()));
    bytes.extend(option_reply(option, REP_ACK, &[]));
    bytes
}

/// The reply to one option, its outcome if it is final, and a transcript word.
///
/// The export name is ignored: there is one disk, whatever the client calls it.
fn answer(
    option: u32,
    data: &[u8],
    size: u64,
    no_zeroes: bool,
) -> (Vec<u8>, Option<Negotiated>, &'static str) {
    match option {
        OPT_EXPORT_NAME => (
            export_reply(size, no_zeroes),
            Some(Negotiated::Export),
            "export",
        ),
        OPT_ABORT => (
            option_reply(option, REP_ACK, &[]),
            Some(Negotiated::Abort),
            "acknowledged",
        ),
        OPT_INFO | OPT_GO if is_info_request(data) => (
            info_replies(option, size),
            (option == OPT_GO).then_some(Negotiated::Export),
            "info",
        ),
        OPT_INFO | OPT_GO => (option_reply(option, REP_ERR_INVALID, &[]), None, "invalid"),
        _ => (
            option_reply(option, REP_ERR_UNSUP, &[]),
            None,
            "unsupported",
        ),
    }
}

/// The reply to `NBD_OPT_EXPORT_NAME`: size, read-only flags, then the zeros unless skipped.
#[must_use]
pub fn export_reply(size: u64, no_zeroes: bool) -> Vec<u8> {
    let mut bytes = size.to_be_bytes().to_vec();
    bytes.extend_from_slice(&EXPORT_FLAGS.to_be_bytes());
    if !no_zeroes {
        bytes.resize(bytes.len() + ZEROES_LEN, 0);
    }
    bytes
}

/// Decodes a request.
///
/// # Errors
/// When the magic is not [`REQUEST_MAGIC`].
pub fn request(bytes: &[u8; REQUEST_LEN]) -> Result<Request, Error> {
    let magic = u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]);
    if magic != REQUEST_MAGIC {
        return Err(Error::RequestMagic(magic));
    }
    let long = |from: usize| {
        bytes[from..from + 8]
            .try_into()
            .map(u64::from_be_bytes)
            .unwrap_or_default()
    };
    Ok(Request {
        flags: u16::from_be_bytes([bytes[4], bytes[5]]),
        kind: u16::from_be_bytes([bytes[6], bytes[7]]),
        cookie: long(8),
        offset: long(16),
        length: u32::from_be_bytes([bytes[24], bytes[25], bytes[26], bytes[27]]),
    })
}

/// A simple reply header echoing `cookie`, with `error` zero on success.
#[must_use]
pub fn simple_reply(cookie: u64, error: u32) -> [u8; SIMPLE_REPLY_LEN] {
    let mut bytes = [0_u8; SIMPLE_REPLY_LEN];
    bytes[..4].copy_from_slice(&SIMPLE_REPLY_MAGIC.to_be_bytes());
    bytes[4..8].copy_from_slice(&error.to_be_bytes());
    bytes[8..].copy_from_slice(&cookie.to_be_bytes());
    bytes
}

/// The error `request` is answered with, or `None` for a read to serve.
///
/// A command flag, a type that is neither a read nor a write of some kind,
/// or a read longer than [`MAX_PAYLOAD`] or reaching past `size` is
/// [`EINVAL`]; a write, a write of zeroes or a trim is [`EPERM`], the export
/// being read-only. `NBD_CMD_DISC` gets no reply and must be handled first.
#[must_use]
pub fn refusal(request: &Request, size: u64) -> Option<u32> {
    if request.flags != 0 {
        return Some(EINVAL);
    }
    let end = request.offset.checked_add(u64::from(request.length));
    match request.kind {
        CMD_WRITE | CMD_WRITE_ZEROES | CMD_TRIM => Some(EPERM),
        CMD_READ if request.length <= MAX_PAYLOAD && end.is_some_and(|end| end <= size) => None,
        _ => Some(EINVAL),
    }
}

/// Negotiates with the client until it takes the export or aborts.
///
/// The export is `size` bytes and read-only, whatever name the client gives.
///
/// # Errors
/// When a stream fails, the client leaves, or it breaks the protocol.
pub fn negotiate<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    size: u64,
    transcript: Transcript,
) -> Result<Negotiated, Error> {
    send(output, &greeting())?;
    let mut flags = [0_u8; 4];
    receive(input, &mut flags)?;
    let no_zeroes = client_flags(&flags)? & FLAG_C_NO_ZEROES != 0;
    loop {
        let mut header = [0_u8; OPTION_LEN];
        receive(input, &mut header)?;
        let header = option_header(&header)?;
        let mut data = vec![0_u8; usize::try_from(header.length).unwrap_or_default()];
        receive(input, &mut data)?;
        let (reply, outcome, word) = answer(header.option, &data, size, no_zeroes);
        transcript.option(header.option, word);
        send(output, &reply)?;
        if let Some(outcome) = outcome {
            if outcome == Negotiated::Export {
                transcript.export(size);
            }
            return Ok(outcome);
        }
    }
}

/// Reads the next request; the payload of a write is drained and dropped.
///
/// # Errors
/// When the stream fails, the client leaves, or the magic is wrong.
pub fn next_request<R: Read>(input: &mut R) -> Result<Request, Error> {
    let mut bytes = [0_u8; REQUEST_LEN];
    receive(input, &mut bytes)?;
    let request = request(&bytes)?;
    if request.kind == CMD_WRITE {
        let length = u64::from(request.length);
        let drained =
            io::copy(&mut input.by_ref().take(length), &mut io::sink()).map_err(Error::Io)?;
        if drained < length {
            return Err(Error::Left);
        }
    }
    Ok(request)
}

/// Writes `bytes` to the client and flushes.
///
/// # Errors
/// When the write fails; a closed pipe counts as the client leaving.
pub fn send<W: Write>(output: &mut W, bytes: &[u8]) -> Result<(), Error> {
    output
        .write_all(bytes)
        .and_then(|()| output.flush())
        .map_err(|error| match error.kind() {
            io::ErrorKind::BrokenPipe => Error::Left,
            _ => Error::Io(error),
        })
}

fn receive<R: Read>(input: &mut R, buffer: &mut [u8]) -> Result<(), Error> {
    input
        .read_exact(buffer)
        .map_err(|error| match error.kind() {
            io::ErrorKind::UnexpectedEof => Error::Left,
            _ => Error::Io(error),
        })
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use super::*;

    const QUIET: Transcript = Transcript::new(false);

    #[test]
    fn the_greeting_is_the_two_magics_then_the_handshake_flags_big_endian() {
        assert_eq!(greeting(), *b"NBDMAGICIHAVEOPT\x00\x03");
        assert_eq!(HANDSHAKE_FLAGS, FLAG_FIXED_NEWSTYLE | FLAG_NO_ZEROES);
    }

    #[test]
    fn client_flags_require_fixed_newstyle() {
        assert_eq!(client_flags(&[0, 0, 0, 3]).unwrap(), 3);
        let error = client_flags(&[0, 0, 0, 2]).unwrap_err();
        assert_eq!(
            error.to_string(),
            "nbd: the client flags 0x2 lack NBD_FLAG_C_FIXED_NEWSTYLE"
        );
    }

    #[test]
    fn an_option_header_round_trips_and_a_wrong_magic_is_refused() {
        let mut bytes = *b"IHAVEOPT\x00\x00\x00\x01\x00\x00\x00\x05";
        assert_eq!(
            option_header(&bytes).unwrap(),
            OptionHeader {
                option: 1,
                length: 5
            }
        );
        bytes[0] = b'X';
        let error = option_header(&bytes).unwrap_err();
        assert_eq!(
            error.to_string(),
            "nbd: option magic 0x58484156454f5054 is not IHAVEOPT"
        );
    }

    #[test]
    fn an_option_at_the_limit_passes_and_a_longer_one_is_refused_naming_it() {
        let mut bytes = *b"IHAVEOPT\x00\x00\x00\x07\x00\x00\x00\x00";
        bytes[12..].copy_from_slice(&MAX_OPTION_LEN.to_be_bytes());
        assert_eq!(option_header(&bytes).unwrap().length, MAX_OPTION_LEN);
        bytes[12..].copy_from_slice(&(MAX_OPTION_LEN + 1).to_be_bytes());
        let error = option_header(&bytes).unwrap_err();
        assert_eq!(
            error.to_string(),
            "nbd: option 7 carries 4097 bytes, more than 4096"
        );
    }

    #[test]
    fn an_option_reply_carries_the_reply_magic_the_option_the_type_and_its_data() {
        let reply = option_reply(7, REP_ERR_UNSUP, &[]);
        assert_eq!(&reply[..8], &[0, 3, 0xe8, 0x89, 0x04, 0x55, 0x65, 0xa9]);
        assert_eq!(&reply[8..12], &[0, 0, 0, 7]);
        assert_eq!(&reply[12..16], &[0x80, 0, 0, 1]);
        assert_eq!(&reply[16..], &[0, 0, 0, 0]);

        let reply = option_reply(OPT_GO, REP_INFO, b"abc");
        assert_eq!(reply.len(), OPTION_REPLY_LEN + 3);
        assert_eq!(&reply[12..16], &[0, 0, 0, 3]);
        assert_eq!(&reply[16..20], &[0, 0, 0, 3]);
        assert_eq!(&reply[20..], b"abc");
    }

    #[test]
    fn an_info_request_is_well_formed_when_its_name_and_its_list_fill_the_data() {
        assert!(is_info_request(
            b"\x00\x00\x00\x04disk\x00\x02\x00\x03\x00\x00"
        ));
        assert!(is_info_request(b"\x00\x00\x00\x00\x00\x00"));
    }

    #[test]
    fn an_info_request_whose_name_or_list_does_not_fit_the_data_is_malformed() {
        for data in [
            &b""[..],
            b"\x00\x00\x00\x00",
            b"\x00\x00\x00\x05disk\x00\x00",
            b"\x00\x00\x00\x04disk\x00\x01",
            b"\x00\x00\x00\x04disk\x00\x00\x00",
            b"\x00\x00\x00\x04disk\x00\x00\x00\x03",
        ] {
            assert!(!is_info_request(data), "{data:?}");
        }
    }

    #[test]
    fn the_export_info_holds_the_type_the_size_and_the_read_only_flags() {
        let info = export_info(0x0001_0000_0000);
        assert_eq!(&info[..2], &[0, 0]);
        assert_eq!(&info[2..10], &[0, 0, 0, 1, 0, 0, 0, 0]);
        assert_eq!(&info[10..], &[0, 3]);
    }

    #[test]
    fn the_block_size_info_advertises_a_sector_a_mebibyte_and_thirty_two_mebibytes() {
        let info = block_size_info();
        assert_eq!(&info[..2], &[0, 3]);
        assert_eq!(&info[2..6], &[0, 0, 2, 0]);
        assert_eq!(&info[6..10], &[0, 0x10, 0, 0]);
        assert_eq!(&info[10..], &[2, 0, 0, 0]);
    }

    #[test]
    fn the_export_reply_holds_the_size_the_read_only_flags_and_the_zeros() {
        let reply = export_reply(0x0001_0000_0000, false);
        assert_eq!(reply.len(), 8 + 2 + ZEROES_LEN);
        assert_eq!(&reply[..8], &[0, 0, 0, 1, 0, 0, 0, 0]);
        assert_eq!(&reply[8..10], &[0, 3]);
        assert_eq!(EXPORT_FLAGS, FLAG_HAS_FLAGS | FLAG_READ_ONLY);
        assert!(reply[10..].iter().all(|byte| *byte == 0));
        assert_eq!(export_reply(16, true).len(), 10);
    }

    #[test]
    fn a_request_round_trips_and_a_wrong_magic_is_refused() {
        let mut bytes = [0_u8; REQUEST_LEN];
        bytes[..4].copy_from_slice(&REQUEST_MAGIC.to_be_bytes());
        bytes[4..6].copy_from_slice(&1_u16.to_be_bytes());
        bytes[6..8].copy_from_slice(&CMD_DISC.to_be_bytes());
        bytes[8..16].copy_from_slice(&0x1122_3344_5566_7788_u64.to_be_bytes());
        bytes[16..24].copy_from_slice(&4096_u64.to_be_bytes());
        bytes[24..].copy_from_slice(&512_u32.to_be_bytes());
        assert_eq!(
            request(&bytes).unwrap(),
            Request {
                flags: 1,
                kind: CMD_DISC,
                cookie: 0x1122_3344_5566_7788,
                offset: 4096,
                length: 512
            }
        );
        bytes[0] = 0;
        let error = request(&bytes).unwrap_err();
        assert_eq!(
            error.to_string(),
            "nbd: request magic 0x00609513 is not NBD_REQUEST_MAGIC"
        );
    }

    #[test]
    fn a_simple_reply_holds_the_magic_the_error_and_the_cookie() {
        let reply = simple_reply(0x0102_0304_0506_0708, EINVAL);
        assert_eq!(&reply[..4], &[0x67, 0x44, 0x66, 0x98]);
        assert_eq!(&reply[4..8], &[0, 0, 0, 22]);
        assert_eq!(&reply[8..], &[1, 2, 3, 4, 5, 6, 7, 8]);
    }

    fn client_bytes(flags: u32, options: &[(u32, &[u8])]) -> Vec<u8> {
        let mut bytes = flags.to_be_bytes().to_vec();
        for (option, data) in options {
            bytes.extend_from_slice(&IHAVEOPT.to_be_bytes());
            bytes.extend_from_slice(&option.to_be_bytes());
            bytes.extend_from_slice(&u32::try_from(data.len()).unwrap().to_be_bytes());
            bytes.extend_from_slice(data);
        }
        bytes
    }

    /// `NBD_OPT_LIST`, `NBD_OPT_STARTTLS` and `NBD_OPT_STRUCTURED_REPLY`, none served.
    const OPT_LIST: u32 = 3;
    const OPT_STARTTLS: u32 = 5;
    const OPT_STRUCTURED_REPLY: u32 = 8;

    #[test]
    fn negotiation_refuses_unserved_options_then_answers_export_name_with_the_size() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE | FLAG_C_NO_ZEROES,
            &[
                (OPT_LIST, b""),
                (OPT_STARTTLS, b""),
                (OPT_STRUCTURED_REPLY, b""),
                (0x4242, b"\x00\x00\x00\x00\x00\x00\x00\x00"),
                (OPT_EXPORT_NAME, b"disk"),
            ],
        ));
        let mut output = Vec::new();

        let outcome = negotiate(&mut input, &mut output, 4096, QUIET).unwrap();

        assert_eq!(outcome, Negotiated::Export);
        let mut expected = greeting().to_vec();
        for option in [OPT_LIST, OPT_STARTTLS, OPT_STRUCTURED_REPLY, 0x4242] {
            expected.extend(option_reply(option, REP_ERR_UNSUP, &[]));
        }
        expected.extend(export_reply(4096, true));
        assert_eq!(output, expected);
    }

    /// The bytes answering a well-formed `NBD_OPT_INFO` or `NBD_OPT_GO`.
    fn info_bytes(option: u32, size: u64) -> Vec<u8> {
        let mut bytes = option_reply(option, REP_INFO, &export_info(size));
        bytes.extend(option_reply(option, REP_INFO, &block_size_info()));
        bytes.extend(option_reply(option, REP_ACK, &[]));
        bytes
    }

    #[test]
    fn negotiation_answers_go_with_both_infos_and_an_ack_then_enters_transmission() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE,
            &[(OPT_GO, b"\x00\x00\x00\x01x\x00\x01\x00\x03")],
        ));
        let mut output = Vec::new();

        let outcome = negotiate(&mut input, &mut output, 4096, QUIET).unwrap();

        assert_eq!(outcome, Negotiated::Export);
        let mut expected = greeting().to_vec();
        expected.extend(info_bytes(OPT_GO, 4096));
        assert_eq!(output, expected, "no zero padding follows the ack");
    }

    #[test]
    fn negotiation_answers_info_the_same_way_and_stays_in_negotiation() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE | FLAG_C_NO_ZEROES,
            &[
                (OPT_INFO, b"\x00\x00\x00\x00\x00\x02\x00\x00\x00\x09"),
                (OPT_EXPORT_NAME, b""),
            ],
        ));
        let mut output = Vec::new();

        let outcome = negotiate(&mut input, &mut output, 4096, QUIET).unwrap();

        assert_eq!(outcome, Negotiated::Export);
        let mut expected = greeting().to_vec();
        expected.extend(info_bytes(OPT_INFO, 4096));
        expected.extend(export_reply(4096, true));
        assert_eq!(output, expected);
    }

    #[test]
    fn negotiation_refuses_a_malformed_go_as_invalid_and_continues() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE | FLAG_C_NO_ZEROES,
            &[(OPT_GO, b"\x00\x00\x00\x09"), (OPT_EXPORT_NAME, b"")],
        ));
        let mut output = Vec::new();

        negotiate(&mut input, &mut output, 4096, QUIET).unwrap();

        let mut expected = greeting().to_vec();
        expected.extend(option_reply(OPT_GO, REP_ERR_INVALID, &[]));
        expected.extend(export_reply(4096, true));
        assert_eq!(output, expected);
    }

    #[test]
    fn negotiation_acknowledges_abort_and_ends_without_an_export() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE,
            &[(OPT_ABORT, b"\x00\x00"), (OPT_EXPORT_NAME, b"")],
        ));
        let mut output = Vec::new();

        let outcome = negotiate(&mut input, &mut output, 4096, QUIET).unwrap();

        assert_eq!(outcome, Negotiated::Abort);
        let mut expected = greeting().to_vec();
        expected.extend(option_reply(OPT_ABORT, REP_ACK, &[]));
        assert_eq!(output, expected, "the option after the abort is never read");
    }

    fn a_request(flags: u16, kind: u16, offset: u64, length: u32) -> Request {
        Request {
            flags,
            kind,
            cookie: 7,
            offset,
            length,
        }
    }

    #[test]
    fn a_read_within_the_export_and_the_payload_limit_is_not_refused() {
        assert_eq!(refusal(&a_request(0, CMD_READ, 0, 512), 512), None);
        assert_eq!(refusal(&a_request(0, CMD_READ, 512, 0), 512), None);
        let whole = u64::from(MAX_PAYLOAD);
        assert_eq!(
            refusal(&a_request(0, CMD_READ, 0, MAX_PAYLOAD), whole),
            None
        );
    }

    #[test]
    fn a_write_a_write_of_zeroes_and_a_trim_are_refused_as_read_only() {
        for kind in [CMD_WRITE, CMD_WRITE_ZEROES, CMD_TRIM] {
            let request = a_request(0, kind, 0, 512);
            assert_eq!(refusal(&request, 512), Some(EPERM), "{request:?}");
        }
    }

    /// `NBD_CMD_FLUSH` and `NBD_CMD_CACHE`, neither served.
    const CMD_FLUSH: u16 = 3;
    const CMD_CACHE: u16 = 5;

    #[test]
    fn a_flag_an_unserved_type_and_a_read_out_of_bounds_are_invalid() {
        for (request, size) in [
            (a_request(1, CMD_READ, 0, 512), 512),
            (a_request(1, CMD_WRITE, 0, 512), 512),
            (a_request(0, CMD_FLUSH, 0, 0), 512),
            (a_request(0, CMD_CACHE, 0, 512), 512),
            (a_request(0, 99, 0, 0), 512),
            (a_request(0, CMD_READ, 511, 2), 512),
            (a_request(0, CMD_READ, u64::MAX, 1), 512),
            (a_request(0, CMD_READ, 0, MAX_PAYLOAD + 1), u64::MAX),
        ] {
            assert_eq!(refusal(&request, size), Some(EINVAL), "{request:?}");
        }
    }

    fn request_bytes(kind: u16, length: u32) -> Vec<u8> {
        let mut bytes = REQUEST_MAGIC.to_be_bytes().to_vec();
        bytes.extend_from_slice(&[0, 0]);
        bytes.extend_from_slice(&kind.to_be_bytes());
        bytes.extend_from_slice(&[0; 16]);
        bytes.extend_from_slice(&length.to_be_bytes());
        bytes
    }

    #[test]
    fn the_next_request_drains_a_write_payload_before_the_request_after_it() {
        let mut bytes = request_bytes(CMD_WRITE, 5);
        bytes.extend_from_slice(b"hello");
        bytes.extend(request_bytes(CMD_DISC, 0));
        let mut input = Cursor::new(bytes);

        assert_eq!(next_request(&mut input).unwrap().kind, CMD_WRITE);
        assert_eq!(next_request(&mut input).unwrap().kind, CMD_DISC);
    }

    #[test]
    fn a_write_whose_payload_is_cut_short_counts_as_the_client_leaving() {
        let mut bytes = request_bytes(CMD_WRITE, 5);
        bytes.extend_from_slice(b"hel");

        let error = next_request(&mut Cursor::new(bytes)).unwrap_err();

        assert!(matches!(error, Error::Left), "{error:?}");
    }

    #[test]
    fn negotiation_sends_the_zeros_when_the_client_did_not_agree_to_skip_them() {
        let mut input = Cursor::new(client_bytes(
            FLAG_C_FIXED_NEWSTYLE,
            &[(OPT_EXPORT_NAME, b"")],
        ));
        let mut output = Vec::new();

        negotiate(&mut input, &mut output, 1, QUIET).unwrap();

        assert_eq!(output.len(), GREETING_LEN + 8 + 2 + ZEROES_LEN);
    }

    #[test]
    fn a_client_that_leaves_during_negotiation_or_before_a_request_is_reported() {
        let mut output = Vec::new();
        let error = negotiate(
            &mut Cursor::new(b"\x00\x00\x00\x01IHAVE"),
            &mut output,
            1,
            QUIET,
        )
        .unwrap_err();
        assert_eq!(
            error.to_string(),
            "the nbd client left without disconnecting"
        );

        let error = next_request(&mut Cursor::new(b"")).unwrap_err();
        assert!(matches!(error, Error::Left), "{error:?}");
    }

    #[test]
    fn a_broken_pipe_on_send_counts_as_the_client_leaving() {
        struct Broken;
        impl Write for Broken {
            fn write(&mut self, _: &[u8]) -> io::Result<usize> {
                Err(io::Error::from(io::ErrorKind::BrokenPipe))
            }
            fn flush(&mut self) -> io::Result<()> {
                Ok(())
            }
        }

        let error = send(&mut Broken, b"x").unwrap_err();

        assert!(matches!(error, Error::Left), "{error:?}");
    }

    #[test]
    fn the_next_request_is_decoded_from_its_twenty_eight_bytes() {
        let mut bytes = REQUEST_MAGIC.to_be_bytes().to_vec();
        bytes.extend_from_slice(&[0, 0, 0, 2]);
        bytes.extend_from_slice(&[0; 20]);

        let request = next_request(&mut Cursor::new(bytes)).unwrap();

        assert_eq!(request.kind, CMD_DISC);
        assert_eq!(request.cookie, 0);
    }
}
