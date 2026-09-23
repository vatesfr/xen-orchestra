//! The record protocol carried by the data session once the handshake is done.
//!
//! A record is a 16-byte header, a payload of the announced length and, for
//! an open request or a read reply, a trailer the length does not count. The header holds
//! four little-endian `u32`s: [`MAGIC`], the opcode, the payload length and a
//! sequence number the client increments per record sent. The host answers
//! each record with a header echoing the opcode and sequence number. A
//! record it refuses gets an [`ERROR`] record first, carrying a code and a
//! text, and then the reply itself.

/// Value at offset 0 of every header; on the wire it reads `7a da 00 a1`.
pub const MAGIC: u32 = 0xA100_DA7A;

/// Length of a header in bytes.
pub const HEADER_LEN: usize = 16;

/// Opcode of the first record of a session; its payload is 16 zero bytes.
pub const HELLO: u32 = 2;
/// Opcode of the version record; its payload is 12 zero bytes.
pub const VERSION: u32 = 9;
/// Opcode of the capabilities record; its payload is the `u32` 1.
pub const CAPABILITIES: u32 = 22;
/// Opcode of the open request, [`OPEN_LEN`] bytes plus the path as trailer.
pub const OPEN: u32 = 4;
/// Opcode of the close request; its payload is the `u64` handle then 8 zero bytes.
pub const CLOSE: u32 = 5;
/// Opcode of the last record of a session; its payload is 16 zero bytes.
pub const END: u32 = 3;
/// Opcode of the read request, answered with one record per chunk.
pub const READ: u32 = 7;
/// Opcode of the error record a host sends, with the refused record's sequence number, before its reply.
pub const ERROR: u32 = 1;

/// Payload of the [`HELLO`] record.
pub const HELLO_PAYLOAD: [u8; 16] = [0; 16];
/// Payload of the [`VERSION`] record.
pub const VERSION_PAYLOAD: [u8; 12] = [0; 12];
/// Payload of the [`CAPABILITIES`] record: the one capability set every host accepts.
pub const CAPABILITIES_PAYLOAD: [u8; 4] = 1_u32.to_le_bytes();
/// Payload of the [`END`] record.
pub const END_PAYLOAD: [u8; 16] = [0; 16];

/// Length of an open request or reply payload in bytes.
pub const OPEN_LEN: usize = 60;
/// The `u32` at offset 16 of every open request.
const OPEN_WORD_16: u32 = 2;
/// The `u32` at offset 20 of every open request.
const OPEN_WORD_20: u32 = 30;

/// Errors of the record codec.
#[derive(Debug, PartialEq, Eq, thiserror::Error)]
pub enum Error {
    /// A header did not start with [`MAGIC`].
    #[error("record header magic {0:#010X} is not {MAGIC:#010X}")]
    Magic(u32),
    /// An open reply payload is shorter than [`OPEN_LEN`] bytes.
    #[error("the open reply holds {0} bytes instead of {OPEN_LEN}")]
    ShortOpenReply(usize),
    /// An error record payload is shorter than [`ERROR_LEN`] bytes.
    #[error("the error record holds {0} bytes instead of {ERROR_LEN}")]
    ShortErrorReply(usize),
    /// A read reply payload is shorter than [`READ_LEN`] bytes.
    #[error("the read reply holds {0} bytes instead of {READ_LEN}")]
    ShortReadReply(usize),
}

/// A record header, without the magic.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Header {
    /// What the record asks or answers.
    pub opcode: u32,
    /// How many payload bytes follow the header.
    pub length: u32,
    /// The client's counter for the record, echoed by the host.
    pub sequence: u32,
}

/// Encodes a header with the magic in front.
#[must_use]
pub fn encode(header: Header) -> [u8; HEADER_LEN] {
    let mut bytes = [0_u8; HEADER_LEN];
    bytes[..4].copy_from_slice(&MAGIC.to_le_bytes());
    bytes[4..8].copy_from_slice(&header.opcode.to_le_bytes());
    bytes[8..12].copy_from_slice(&header.length.to_le_bytes());
    bytes[12..].copy_from_slice(&header.sequence.to_le_bytes());
    bytes
}

/// Decodes a header, checking its magic.
///
/// # Errors
/// When the first four bytes are not [`MAGIC`].
pub fn decode(bytes: &[u8; HEADER_LEN]) -> Result<Header, Error> {
    let magic = word(bytes, 0);
    if magic != MAGIC {
        return Err(Error::Magic(magic));
    }
    Ok(Header {
        opcode: word(bytes, 4),
        length: word(bytes, 8),
        sequence: word(bytes, 12),
    })
}

/// Builds the payload of an open request for a path of `path_len` bytes.
///
/// The path itself follows the payload as a trailer, without a terminator.
#[must_use]
pub fn open_request(path_len: u32) -> [u8; OPEN_LEN] {
    let mut bytes = [0_u8; OPEN_LEN];
    bytes[..4].copy_from_slice(&path_len.to_le_bytes());
    bytes[16..20].copy_from_slice(&OPEN_WORD_16.to_le_bytes());
    bytes[20..24].copy_from_slice(&OPEN_WORD_20.to_le_bytes());
    bytes
}

/// What a successful open reply says about the disk.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Opened {
    /// The handle later records name the disk by.
    pub handle: u64,
    /// The disk's capacity in bytes.
    pub capacity: u64,
    /// The disk's sector size in bytes.
    pub sector_size: u32,
}

/// Decodes an open reply into its handle, capacity and sector size.
///
/// The status is at offset 0, the handle at 8, the capacity at 28 and the
/// sector size at 36, all little-endian.
/// A non-zero status comes back as the `Err` of the inner result, so a
/// refused open is told apart from a malformed reply.
///
/// # Errors
/// When the payload is shorter than [`OPEN_LEN`] bytes.
pub fn open_reply(payload: &[u8]) -> Result<Result<Opened, u64>, Error> {
    if payload.len() < OPEN_LEN {
        return Err(Error::ShortOpenReply(payload.len()));
    }
    let status = long(payload, 0);
    if status != 0 {
        return Ok(Err(status));
    }
    Ok(Ok(Opened {
        handle: long(payload, 8),
        capacity: long(payload, 28),
        sector_size: word(payload, 36),
    }))
}

/// Length of a close request payload: the handle, then 8 zero bytes.
pub const CLOSE_LEN: usize = 16;

/// Length of an error record payload: the code, a zero word, then the text length.
pub const ERROR_LEN: usize = 16;

/// What an error record says: a code, and the length of the text that trails the payload.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Refusal {
    /// The host's error code, the `u64` at offset 0.
    pub code: u64,
    /// The length of the text following the payload, the `u32` at offset 12.
    pub text_len: u32,
}

/// Decodes an error record payload into its code and text length.
///
/// The text itself follows the payload as a trailer the header length does
/// not count, without a terminator.
///
/// # Errors
/// When the payload is shorter than [`ERROR_LEN`] bytes.
pub fn error_reply(payload: &[u8]) -> Result<Refusal, Error> {
    if payload.len() < ERROR_LEN {
        return Err(Error::ShortErrorReply(payload.len()));
    }
    Ok(Refusal {
        code: long(payload, 0),
        text_len: word(payload, 12),
    })
}

/// Builds the payload of a close request for `handle`.
#[must_use]
pub fn close_request(handle: u64) -> [u8; CLOSE_LEN] {
    let mut bytes = [0_u8; CLOSE_LEN];
    bytes[..8].copy_from_slice(&handle.to_le_bytes());
    bytes
}

/// Length of a read request or reply payload in bytes.
pub const READ_LEN: usize = 44;

/// The word every read request carries after the handle.
///
/// Its meaning is not known: the host answers a read that carries 1 and
/// echoes the word in each reply.
const READ_CONSTANT: u32 = 1;

/// Builds a read request for `length` bytes at `offset` of disk `handle`.
///
/// The length is written three times, as the `u64` at offset 24 and the
/// `u32`s at 32 and 36. The `compression` at offset 12 says how the host
/// sends each chunk, 0 as stored, 1 zlib, 3 skipz, and every reply echoes it.
#[must_use]
pub fn read_request(handle: u64, offset: u64, length: u32, compression: u32) -> [u8; READ_LEN] {
    let mut bytes = [0_u8; READ_LEN];
    bytes[..8].copy_from_slice(&handle.to_le_bytes());
    bytes[8..12].copy_from_slice(&READ_CONSTANT.to_le_bytes());
    bytes[12..16].copy_from_slice(&compression.to_le_bytes());
    bytes[16..24].copy_from_slice(&offset.to_le_bytes());
    bytes[24..32].copy_from_slice(&u64::from(length).to_le_bytes());
    bytes[32..36].copy_from_slice(&length.to_le_bytes());
    bytes[36..40].copy_from_slice(&length.to_le_bytes());
    bytes
}

/// What one read reply says about the chunk whose bytes trail it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReadReply {
    /// The host's status, the `u64` at offset 0; zero means the chunk is good.
    pub status: u64,
    /// The compression echoed at offset 12.
    pub compression: u32,
    /// The disk offset the request named, the `u64` at offset 16.
    pub base_offset: u64,
    /// The length the request named, the `u32` at offset 24.
    pub total_length: u32,
    /// Where the chunk starts within the request, the `u32` at offset 28.
    pub chunk_offset: u32,
    /// How many disk bytes the chunk holds, the `u32` at offset 32.
    pub chunk_length: u32,
    /// How many bytes trail the payload, the `u32` at offset 36.
    pub wire_length: u32,
}

/// Decodes a read reply payload.
///
/// # Errors
/// When the payload is shorter than [`READ_LEN`] bytes.
pub fn read_reply(payload: &[u8]) -> Result<ReadReply, Error> {
    if payload.len() < READ_LEN {
        return Err(Error::ShortReadReply(payload.len()));
    }
    Ok(ReadReply {
        status: long(payload, 0),
        compression: word(payload, 12),
        base_offset: long(payload, 16),
        total_length: word(payload, 24),
        chunk_offset: word(payload, 28),
        chunk_length: word(payload, 32),
        wire_length: word(payload, 36),
    })
}

fn word(bytes: &[u8], at: usize) -> u32 {
    u32::from_le_bytes([bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]])
}

fn long(bytes: &[u8], at: usize) -> u64 {
    u64::from_le_bytes([
        bytes[at],
        bytes[at + 1],
        bytes[at + 2],
        bytes[at + 3],
        bytes[at + 4],
        bytes[at + 5],
        bytes[at + 6],
        bytes[at + 7],
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_header_magic_is_written_little_endian_and_read_back() {
        let header = Header {
            opcode: OPEN,
            length: 60,
            sequence: 3,
        };
        let bytes = encode(header);
        assert_eq!(&bytes[..4], &[0x7A, 0xDA, 0x00, 0xA1]);
        assert_eq!(&bytes[4..], &[4, 0, 0, 0, 60, 0, 0, 0, 3, 0, 0, 0]);
        assert_eq!(decode(&bytes).unwrap(), header);
    }

    #[test]
    fn a_header_with_another_magic_is_refused_naming_it() {
        let mut bytes = encode(Header {
            opcode: HELLO,
            length: 0,
            sequence: 0,
        });
        bytes[..4].copy_from_slice(&[0xA1, 0x00, 0xDA, 0x7A]);
        let error = decode(&bytes).unwrap_err();
        assert_eq!(error, Error::Magic(0x7ADA_00A1));
        assert_eq!(
            error.to_string(),
            "record header magic 0x7ADA00A1 is not 0xA100DA7A"
        );
    }

    #[test]
    fn the_open_request_names_the_path_length_and_the_two_fixed_words() {
        let bytes = open_request(24);
        assert_eq!(&bytes[..4], &[24, 0, 0, 0]);
        assert!(bytes[4..16].iter().all(|byte| *byte == 0));
        assert_eq!(&bytes[16..24], &[2, 0, 0, 0, 30, 0, 0, 0]);
        assert!(bytes[24..].iter().all(|byte| *byte == 0));
    }

    #[test]
    fn the_open_reply_yields_handle_capacity_and_sector_size() {
        let mut payload = [0_u8; OPEN_LEN];
        payload[8..16].copy_from_slice(&0x1122_3344_5566_7788_u64.to_le_bytes());
        payload[28..36].copy_from_slice(&(10 * 1024 * 1024 * 1024 + 512_u64).to_le_bytes());
        payload[36..40].copy_from_slice(&512_u32.to_le_bytes());
        payload[40..52].copy_from_slice(&[1, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0]);
        assert_eq!(
            open_reply(&payload),
            Ok(Ok(Opened {
                handle: 0x1122_3344_5566_7788,
                capacity: 10 * 1024 * 1024 * 1024 + 512,
                sector_size: 512,
            }))
        );
    }

    #[test]
    fn a_non_zero_open_status_is_reported_and_a_short_reply_refused() {
        let mut payload = [0_u8; OPEN_LEN];
        payload[..8].copy_from_slice(&5_u64.to_le_bytes());
        assert_eq!(open_reply(&payload), Ok(Err(5)));
        let error = open_reply(&payload[..59]).unwrap_err();
        assert_eq!(error, Error::ShortOpenReply(59));
        assert_eq!(
            error.to_string(),
            "the open reply holds 59 bytes instead of 60"
        );
    }

    #[test]
    fn the_error_reply_yields_the_code_and_the_text_length_and_a_short_one_is_refused() {
        let mut payload = [0_u8; ERROR_LEN];
        payload[..8].copy_from_slice(&11_u64.to_le_bytes());
        payload[12..].copy_from_slice(&97_u32.to_le_bytes());
        assert_eq!(
            error_reply(&payload),
            Ok(Refusal {
                code: 11,
                text_len: 97,
            })
        );
        let error = error_reply(&payload[..15]).unwrap_err();
        assert_eq!(error, Error::ShortErrorReply(15));
        assert_eq!(
            error.to_string(),
            "the error record holds 15 bytes instead of 16"
        );
    }

    #[test]
    fn the_close_request_carries_the_handle_then_zeros() {
        let bytes = close_request(0x0102_0304_0506_0708);
        assert_eq!(&bytes[..8], &[8, 7, 6, 5, 4, 3, 2, 1]);
        assert_eq!(&bytes[8..], &[0; 8]);
    }

    #[test]
    fn the_fixed_payloads_have_their_documented_bytes() {
        assert_eq!(HELLO_PAYLOAD, [0; 16]);
        assert_eq!(VERSION_PAYLOAD, [0; 12]);
        assert_eq!(CAPABILITIES_PAYLOAD, [1, 0, 0, 0]);
        assert_eq!(END_PAYLOAD, [0; 16]);
    }

    #[test]
    fn the_read_request_is_built_byte_by_byte_with_the_compression_asked() {
        for compression in [0, 1, 3] {
            let bytes = read_request(7, 512, 4096, compression);
            assert_eq!(
                &bytes[12..16],
                &[u8::try_from(compression).unwrap(), 0, 0, 0],
                "compression {compression}"
            );
        }
        let bytes = read_request(0xFFFF_FFFF_8000_2A1F, 0x0000_0001_0010_0200, 0x0010_0000, 0);
        assert_eq!(
            &bytes[..8],
            &[0x1F, 0x2A, 0x00, 0x80, 0xFF, 0xFF, 0xFF, 0xFF]
        );
        assert_eq!(&bytes[8..12], &[1, 0, 0, 0]);
        assert_eq!(&bytes[12..16], &[0, 0, 0, 0], "compression none");
        assert_eq!(
            &bytes[16..24],
            &[0x00, 0x02, 0x10, 0x00, 0x01, 0x00, 0x00, 0x00]
        );
        assert_eq!(&bytes[24..32], &[0x00, 0x00, 0x10, 0x00, 0, 0, 0, 0]);
        assert_eq!(&bytes[32..36], &[0x00, 0x00, 0x10, 0x00]);
        assert_eq!(&bytes[36..40], &[0x00, 0x00, 0x10, 0x00]);
        assert_eq!(&bytes[40..], &[0, 0, 0, 0]);
    }

    #[test]
    fn the_read_reply_yields_base_offset_total_length_chunk_offset_chunk_length_and_wire_length() {
        let mut payload = [0_u8; READ_LEN];
        payload[..8].copy_from_slice(&3_u64.to_le_bytes());
        payload[8..12].copy_from_slice(&1_u32.to_le_bytes());
        payload[12..16].copy_from_slice(&3_u32.to_le_bytes());
        payload[16..24].copy_from_slice(&0x0000_0001_0010_0200_u64.to_le_bytes());
        payload[24..28].copy_from_slice(&0x0010_0000_u32.to_le_bytes());
        payload[28..32].copy_from_slice(&0x0003_0000_u32.to_le_bytes());
        payload[32..36].copy_from_slice(&0x0001_0000_u32.to_le_bytes());
        payload[36..40].copy_from_slice(&0x0000_FFFF_u32.to_le_bytes());
        assert_eq!(
            read_reply(&payload),
            Ok(ReadReply {
                status: 3,
                compression: 3,
                base_offset: 0x0000_0001_0010_0200,
                total_length: 0x0010_0000,
                chunk_offset: 0x0003_0000,
                chunk_length: 0x0001_0000,
                wire_length: 0x0000_FFFF,
            })
        );
    }

    #[test]
    fn a_short_read_reply_is_refused_naming_its_length() {
        let error = read_reply(&[0_u8; 43]).unwrap_err();
        assert_eq!(error, Error::ShortReadReply(43));
        assert_eq!(
            error.to_string(),
            "the read reply holds 43 bytes instead of 44"
        );
    }
}
