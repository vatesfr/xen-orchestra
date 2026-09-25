//! A minimal fixed-newstyle NBD client for the child's pipes.
//!
//! It negotiates with `NBD_OPT_EXPORT_NAME`, `NBD_OPT_GO`, `NBD_OPT_INFO`
//! or `NBD_OPT_ABORT`, sends requests of any kind and reads simple replies.
//! The constants come from the NBD protocol document, so the crate is not
//! its own oracle.

use std::io::{Read, Write};

/// `NBDMAGIC`, the first eight bytes of the server greeting.
const NBDMAGIC: u64 = 0x4E42_444D_4147_4943;
/// `IHAVEOPT`, the next eight bytes and the start of every option.
const IHAVEOPT: u64 = 0x4948_4156_454F_5054;
/// The magic opening every option reply.
const REPLY_MAGIC: u64 = 0x0003_e889_0455_65a9;
/// Handshake flags the server may offer.
const FLAG_FIXED_NEWSTYLE: u16 = 1;
const FLAG_NO_ZEROES: u16 = 2;
/// Client flags answering them.
const FLAG_C_FIXED_NEWSTYLE: u32 = 1;
const FLAG_C_NO_ZEROES: u32 = 2;
/// The options.
pub const OPT_EXPORT_NAME: u32 = 1;
pub const OPT_ABORT: u32 = 2;
pub const OPT_LIST: u32 = 3;
pub const OPT_STARTTLS: u32 = 5;
pub const OPT_INFO: u32 = 6;
pub const OPT_GO: u32 = 7;
pub const OPT_STRUCTURED_REPLY: u32 = 8;
/// The option replies.
pub const REP_ACK: u32 = 1;
pub const REP_INFO: u32 = 3;
pub const REP_ERR_UNSUP: u32 = 0x8000_0001;
/// The info types.
pub const INFO_EXPORT: u16 = 0;
pub const INFO_BLOCK_SIZE: u16 = 3;
/// Zero bytes after the export flags unless `NO_ZEROES` was negotiated.
const ZEROES_LEN: usize = 124;
/// The request magic, the commands, the one command flag, the simple reply magic.
const REQUEST_MAGIC: u32 = 0x2560_9513;
pub const CMD_READ: u16 = 0;
pub const CMD_WRITE: u16 = 1;
const CMD_DISC: u16 = 2;
pub const CMD_FLUSH: u16 = 3;
pub const CMD_TRIM: u16 = 4;
pub const CMD_WRITE_ZEROES: u16 = 6;
/// `NBD_CMD_FLAG_FUA`, meaningless on a read.
pub const CMD_FLAG_FUA: u16 = 1;
const SIMPLE_REPLY_MAGIC: u32 = 0x6744_6698;
/// The errors a simple reply may carry.
pub const EPERM: u32 = 1;
pub const EINVAL: u32 = 22;

/// What the server said about the export.
#[derive(Debug, PartialEq, Eq)]
pub struct Export {
    /// The export size in bytes.
    pub size: u64,
    /// The transmission flags.
    pub flags: u16,
    /// Whether the 124 zero bytes followed the flags.
    pub padded: bool,
}

/// What `NBD_OPT_INFO` or `NBD_OPT_GO` reported.
#[derive(Debug, PartialEq, Eq)]
pub struct Info {
    /// The export size in bytes.
    pub size: u64,
    /// The transmission flags.
    pub flags: u16,
    /// The minimum, preferred and maximum request sizes, when reported.
    pub block_size: Option<(u32, u32, u32)>,
    /// The types of the other infos, in order.
    pub other: Vec<u16>,
}

/// Reads exactly enough bytes to fill `bytes`.
fn read<R: Read>(input: &mut R, bytes: &mut [u8]) {
    input
        .read_exact(bytes)
        .expect("the server sends the bytes the protocol calls for");
}

fn read_u16<R: Read>(input: &mut R) -> u16 {
    let mut bytes = [0_u8; 2];
    read(input, &mut bytes);
    u16::from_be_bytes(bytes)
}

fn read_u32<R: Read>(input: &mut R) -> u32 {
    let mut bytes = [0_u8; 4];
    read(input, &mut bytes);
    u32::from_be_bytes(bytes)
}

fn read_u64<R: Read>(input: &mut R) -> u64 {
    let mut bytes = [0_u8; 8];
    read(input, &mut bytes);
    u64::from_be_bytes(bytes)
}

/// Writes `bytes` and flushes them to the server.
fn write<W: Write>(output: &mut W, bytes: &[u8]) {
    output
        .write_all(bytes)
        .and_then(|()| output.flush())
        .expect("the client's bytes are written");
}

/// Reads the greeting and returns the handshake flags the server offers.
fn greeting<R: Read>(input: &mut R) -> u16 {
    assert_eq!(
        read_u64(input),
        NBDMAGIC,
        "the greeting starts with NBDMAGIC"
    );
    assert_eq!(read_u64(input), IHAVEOPT, "IHAVEOPT follows");
    let offered = read_u16(input);
    assert_ne!(
        offered & FLAG_FIXED_NEWSTYLE,
        0,
        "the server offers fixed newstyle"
    );
    offered
}

/// Reads the greeting and answers it, asking `NO_ZEROES` when `no_zeroes`.
///
/// Returns whether the export reply will carry the 124 zero bytes.
pub fn handshake<R: Read, W: Write>(input: &mut R, output: &mut W, no_zeroes: bool) -> bool {
    let offered = greeting(input);
    let mut flags = FLAG_C_FIXED_NEWSTYLE;
    if no_zeroes && offered & FLAG_NO_ZEROES != 0 {
        flags |= FLAG_C_NO_ZEROES;
    }
    write(output, &flags.to_be_bytes());
    flags & FLAG_C_NO_ZEROES == 0
}

/// Reads the greeting and answers it with `flags` as given, whatever is offered.
pub fn handshake_with<R: Read, W: Write>(input: &mut R, output: &mut W, flags: u32) {
    greeting(input);
    write(output, &flags.to_be_bytes());
}

/// Sends the header of `option` announcing `length` bytes of data, and no data.
pub fn option_header<W: Write>(output: &mut W, option: u32, length: u32) {
    let mut bytes = IHAVEOPT.to_be_bytes().to_vec();
    bytes.extend_from_slice(&option.to_be_bytes());
    bytes.extend_from_slice(&length.to_be_bytes());
    write(output, &bytes);
}

/// Sends `option` with `data`.
pub fn option<W: Write>(output: &mut W, option: u32, data: &[u8]) {
    let length = u32::try_from(data.len()).expect("short option data");
    option_header(output, option, length);
    write(output, data);
}

/// Reads one reply to `option`: its type and its data.
pub fn option_reply<R: Read>(input: &mut R, option: u32) -> (u32, Vec<u8>) {
    assert_eq!(
        read_u64(input),
        REPLY_MAGIC,
        "the reply starts with the reply magic"
    );
    assert_eq!(read_u32(input), option, "the reply names the option");
    let reply = read_u32(input);
    let length = read_u32(input);
    let mut data = vec![0_u8; length as usize];
    read(input, &mut data);
    (reply, data)
}

/// Sends `NBD_OPT_EXPORT_NAME` for the unnamed export and reads the export.
pub fn export_name<R: Read, W: Write>(input: &mut R, output: &mut W, padded: bool) -> Export {
    option(output, OPT_EXPORT_NAME, b"");
    let size = read_u64(input);
    let flags = read_u16(input);
    if padded {
        let mut zeroes = [0_u8; ZEROES_LEN];
        read(input, &mut zeroes);
        assert_eq!(zeroes, [0_u8; ZEROES_LEN], "the padding is zero");
    }
    Export {
        size,
        flags,
        padded,
    }
}

/// Negotiates the unnamed export with `NBD_OPT_EXPORT_NAME`, asking `NO_ZEROES` when `no_zeroes`.
pub fn negotiate<R: Read, W: Write>(input: &mut R, output: &mut W, no_zeroes: bool) -> Export {
    let padded = handshake(input, output, no_zeroes);
    export_name(input, output, padded)
}

/// The data of `NBD_OPT_INFO` or `NBD_OPT_GO`: `name`, then the `requests` asked.
pub fn info_data(name: &[u8], requests: &[u16]) -> Vec<u8> {
    let mut data = u32::try_from(name.len())
        .expect("a short name")
        .to_be_bytes()
        .to_vec();
    data.extend_from_slice(name);
    let count = u16::try_from(requests.len()).expect("a few requests");
    data.extend_from_slice(&count.to_be_bytes());
    for request in requests {
        data.extend_from_slice(&request.to_be_bytes());
    }
    data
}

/// Sends `NBD_OPT_INFO` or `NBD_OPT_GO` (`kind`) naming `name` and asking `requests`.
///
/// Returns what the server reported, or the error reply it sent instead.
pub fn info<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    kind: u32,
    name: &[u8],
    requests: &[u16],
) -> Result<Info, u32> {
    option(output, kind, &info_data(name, requests));
    let mut info = Info {
        size: 0,
        flags: 0,
        block_size: None,
        other: Vec::new(),
    };
    let mut export_seen = false;
    loop {
        let (reply, data) = option_reply(input, kind);
        match reply {
            REP_ACK => {
                assert!(export_seen, "NBD_INFO_EXPORT comes before the ack");
                assert!(data.is_empty(), "the ack carries no data");
                return Ok(info);
            }
            REP_INFO => match u16::from_be_bytes([data[0], data[1]]) {
                INFO_EXPORT => {
                    assert_eq!(data.len(), 12, "NBD_INFO_EXPORT is twelve bytes");
                    info.size = u64::from_be_bytes(data[2..10].try_into().expect("eight bytes"));
                    info.flags = u16::from_be_bytes([data[10], data[11]]);
                    export_seen = true;
                }
                INFO_BLOCK_SIZE => {
                    assert_eq!(data.len(), 14, "NBD_INFO_BLOCK_SIZE is fourteen bytes");
                    let size = |from: usize| {
                        u32::from_be_bytes(data[from..from + 4].try_into().expect("four bytes"))
                    };
                    info.block_size = Some((size(2), size(6), size(10)));
                }
                other => info.other.push(other),
            },
            error => return Err(error),
        }
    }
}

/// Sends `NBD_OPT_ABORT` and reads its acknowledgement.
pub fn abort<R: Read, W: Write>(input: &mut R, output: &mut W) {
    option(output, OPT_ABORT, b"");
    let (reply, data) = option_reply(input, OPT_ABORT);
    assert_eq!(reply, REP_ACK, "the abort is acknowledged");
    assert!(data.is_empty(), "the ack carries no data");
}

/// Sends `kind` with `data` and returns the type of the reply.
pub fn refused<R: Read, W: Write>(input: &mut R, output: &mut W, kind: u32, data: &[u8]) -> u32 {
    option(output, kind, data);
    option_reply(input, kind).0
}

/// Sends one request of `kind` carrying `flags`.
pub fn request<W: Write>(
    output: &mut W,
    flags: u16,
    kind: u16,
    cookie: u64,
    offset: u64,
    length: u32,
) {
    write(output, &request_bytes(flags, kind, cookie, offset, length));
}

/// The bytes of one request of `kind` carrying `flags`.
fn request_bytes(flags: u16, kind: u16, cookie: u64, offset: u64, length: u32) -> Vec<u8> {
    let mut request = REQUEST_MAGIC.to_be_bytes().to_vec();
    request.extend_from_slice(&flags.to_be_bytes());
    request.extend_from_slice(&kind.to_be_bytes());
    request.extend_from_slice(&cookie.to_be_bytes());
    request.extend_from_slice(&offset.to_be_bytes());
    request.extend_from_slice(&length.to_be_bytes());
    request
}

/// Sends one `NBD_CMD_READ` per (cookie, offset, length), all in one write.
pub fn requests<W: Write>(output: &mut W, reads: &[(u64, u64, u32)]) {
    let bytes = reads
        .iter()
        .flat_map(|&(cookie, offset, length)| request_bytes(0, CMD_READ, cookie, offset, length))
        .collect::<Vec<_>>();
    write(output, &bytes);
}

/// Reads one reply per (cookie, length) expected, in the order they arrive.
///
/// Each is the cookie with the bytes read, or the error the reply carries.
pub fn replies<R: Read>(
    input: &mut R,
    expected: &[(u64, u32)],
) -> Vec<(u64, Result<Vec<u8>, u32>)> {
    expected
        .iter()
        .map(|_| {
            let (cookie, error) = reply_header(input);
            let Some((_, length)) = expected.iter().find(|(it, _)| *it == cookie) else {
                panic!("a reply for cookie {cookie:#x}, which no request carried");
            };
            if error != 0 {
                return (cookie, Err(error));
            }
            let mut data = vec![0_u8; *length as usize];
            read(input, &mut data);
            (cookie, Ok(data))
        })
        .collect()
}

/// Reads a simple reply header: the cookie it echoes and its error.
fn reply_header<R: Read>(input: &mut R) -> (u64, u32) {
    assert_eq!(
        read_u32(input),
        SIMPLE_REPLY_MAGIC,
        "the reply starts with the simple reply magic"
    );
    let error = read_u32(input);
    (read_u64(input), error)
}

/// Reads a simple reply, asserts it echoes `cookie`, and returns its error.
pub fn reply<R: Read>(input: &mut R, cookie: u64) -> u32 {
    let (echoed, error) = reply_header(input);
    assert_eq!(echoed, cookie, "the reply echoes the cookie");
    error
}

/// Sends a request of `kind` carrying `flags` for a range and returns the reply's error.
pub fn command<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    flags: u16,
    kind: u16,
    cookie: u64,
    offset: u64,
    length: u32,
) -> u32 {
    request(output, flags, kind, cookie, offset, length);
    reply(input, cookie)
}

/// Sends `NBD_CMD_WRITE` with `payload` and returns the reply's error.
pub fn write_at<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    cookie: u64,
    offset: u64,
    payload: &[u8],
) -> u32 {
    let length = u32::try_from(payload.len()).expect("a length a request can carry");
    request(output, 0, CMD_WRITE, cookie, offset, length);
    write(output, payload);
    reply(input, cookie)
}

/// Sends `NBD_CMD_READ` and returns the bytes, or the error the reply carries.
pub fn read_at<R: Read, W: Write>(
    input: &mut R,
    output: &mut W,
    cookie: u64,
    offset: u64,
    length: u32,
) -> Result<Vec<u8>, u32> {
    request(output, 0, CMD_READ, cookie, offset, length);
    let error = reply(input, cookie);
    if error != 0 {
        return Err(error);
    }
    let mut data = vec![0_u8; length as usize];
    read(input, &mut data);
    Ok(data)
}

/// Sends `NBD_CMD_DISC`.
pub fn disconnect<W: Write>(output: &mut W) {
    request(output, 0, CMD_DISC, 0x1234_5678_9ABC_DEF0, 0, 0);
}
