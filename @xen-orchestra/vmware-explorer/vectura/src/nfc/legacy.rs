//! The disk session of a host whose greeting does not announce SHA-256 support (ESXi 6.x).
//!
//! Once such a host has acknowledged the tag, it speaks no [`record`](super::record)
//! at all: every message is [`LEN`] bytes, a little-endian `u32` type at
//! offset 0, then the type's own fields, the rest zero. An open request is
//! followed by the path and a NUL byte, a read reply by a [`BLOCK_LEN`]-byte
//! block and the data, an [`ERROR`] message by its text ending in a NUL
//! byte; the client writes each message and each trailer on its own. There
//! is no handle and no sequence number: one disk per session, one read in
//! flight. After a refused read the session stays usable; after a refused
//! open the host closes the connection.

use super::handshake::{self, LEN};
use super::record::{long, word};

/// The open request: the path length, NUL included, at offset 4 and [`OPEN_WORD`] at 8.
pub const OPEN: u32 = 21;
/// The open reply, carrying the disk's sector size and geometry.
pub const OPENED: u32 = 22;
/// The read request, and the reply the block and the data follow.
pub const READ: u32 = 46;
/// The close request, and its acknowledgment.
pub const CLOSE: u32 = 24;
/// The end of the session from either side; from the host, also a refusal without text.
pub const END: u32 = 4;
/// A refusal: a domain, a code and the length of the text that follows.
pub const ERROR: u32 = 20;

/// The `u32` at offset 8 of every open request; its meaning is not known.
const OPEN_WORD: u32 = 30;

/// The code of a read refused because it ends past the disk; the session stays usable.
pub const OUT_OF_BOUNDS: u64 = 17;

/// Length of the block that opens a read reply's trailer, before the data.
pub const BLOCK_LEN: usize = 24;

/// Builds the open request for a path of `path_len` bytes, its NUL included.
#[must_use]
pub fn open_request(path_len: u32) -> [u8; LEN] {
    handshake::message(OPEN, (path_len, OPEN_WORD))
}

/// What an open reply says about the disk: its sector size and geometry.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Opened {
    /// The sector size in bytes, the `u32` at offset 12.
    pub sector_size: u32,
    /// The cylinders, the `u32` at offset 16.
    pub cylinders: u32,
    /// The heads, the `u32` at offset 20.
    pub heads: u32,
    /// The sectors per track, the `u32` at offset 24.
    pub sectors: u32,
}

impl Opened {
    /// The size the geometry gives, which falls short of the capacity by up to a cylinder.
    #[must_use]
    pub fn estimate(&self) -> u64 {
        // Two `u32` factors fit a `u64`; the next two can overflow it.
        (u64::from(self.cylinders) * u64::from(self.heads))
            .saturating_mul(u64::from(self.sectors))
            .saturating_mul(u64::from(self.sector_size))
    }
}

/// Decodes an [`OPENED`] message.
#[must_use]
pub fn opened(message: &[u8; LEN]) -> Opened {
    Opened {
        sector_size: word(message, 12),
        cylinders: word(message, 16),
        heads: word(message, 20),
        sectors: word(message, 24),
    }
}

/// Builds the read request for `length` bytes at `offset`.
///
/// The position is the `u64` at offset 12 and the length the `u32` at 20;
/// there is no compression field.
#[must_use]
pub fn read_request(offset: u64, length: u32) -> [u8; LEN] {
    let mut bytes = handshake::message(READ, (0, 0));
    bytes[12..20].copy_from_slice(&offset.to_le_bytes());
    bytes[20..24].copy_from_slice(&length.to_le_bytes());
    bytes
}

/// How many bytes follow a [`READ`] reply, block included: the `u32` at offset 8.
#[must_use]
pub fn trailer_len(message: &[u8; LEN]) -> u32 {
    word(message, 8)
}

/// What the block opening a read reply's trailer says about the data after it.
///
/// Its first 8 bytes are not read: their meaning is not known.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Block {
    /// The position the read asked, the `u64` at offset 8.
    pub offset: u64,
    /// The length the read asked, the `u32` at offset 16.
    pub length: u32,
    /// How many data bytes follow the block, the `u32` at offset 20.
    pub wire_length: u32,
}

/// Decodes the block opening a read reply's trailer.
#[must_use]
pub fn block(bytes: &[u8; BLOCK_LEN]) -> Block {
    Block {
        offset: long(bytes, 8),
        length: word(bytes, 16),
        wire_length: word(bytes, 20),
    }
}

/// What an [`ERROR`] message says: a code, and the length of the text that follows.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Refusal {
    /// The host's error code, the `u32` at offset 8.
    pub code: u64,
    /// The length of the text, NUL included, the `u32` at offset 12.
    pub text_len: u32,
}

/// Decodes an [`ERROR`] message; its domain, at offset 4, is not read.
#[must_use]
pub fn error(message: &[u8; LEN]) -> Refusal {
    Refusal {
        code: u64::from(word(message, 8)),
        text_len: word(message, 12),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The bytes the hex words of `text` spell, zero-padded to `length`.
    fn hex(text: &str, length: usize) -> Vec<u8> {
        let digits = text.split_whitespace().collect::<String>();
        let mut bytes = (0..digits.len())
            .step_by(2)
            .map(|at| u8::from_str_radix(&digits[at..at + 2], 16).unwrap())
            .collect::<Vec<_>>();
        bytes.resize(length, 0);
        bytes
    }

    fn message(text: &str) -> [u8; LEN] {
        hex(text, LEN).try_into().unwrap()
    }

    #[test]
    fn the_open_request_names_the_path_length_with_its_nul_and_the_fixed_word() {
        let path = "[datastore1] miniubuntu/miniubuntu_0-000002.vmdk";
        assert_eq!(path.len(), 48);

        let bytes = open_request(49);

        assert_eq!(bytes, message("15000000 31000000 1e000000"));
    }

    #[test]
    fn the_open_reply_yields_the_sector_size_and_a_geometry_short_of_the_capacity() {
        let opened = opened(&message(
            "16000000 00000000 02000000 00020000 14040000 ff000000 3f000000",
        ));

        assert_eq!(
            opened,
            Opened {
                sector_size: 512,
                cylinders: 1044,
                heads: 255,
                sectors: 63,
            }
        );
        assert_eq!(opened.estimate(), 8_587_192_320);
    }

    #[test]
    fn a_geometry_too_large_for_64_bits_saturates() {
        let opened = Opened {
            sector_size: u32::MAX,
            cylinders: u32::MAX,
            heads: u32::MAX,
            sectors: u32::MAX,
        };
        assert_eq!(opened.estimate(), u64::MAX);
    }

    #[test]
    fn the_read_request_carries_the_position_at_12_and_the_length_at_20() {
        assert_eq!(
            read_request(0x10_0000, 0x10_0000),
            message("2e000000 00000000 00000000 00001000 00000000 00001000")
        );
    }

    #[test]
    fn the_read_reply_announces_block_and_data_and_the_block_echoes_the_read() {
        let reply = message("2e000000 00000000 18020000 00000000 01000000");
        let bytes = hex("00301924 00000000 00000000 00000000 00020000 00020000", 24);

        assert_eq!(handshake::kind(&reply), READ);
        assert_eq!(trailer_len(&reply), 24 + 512);
        assert_eq!(
            block(&bytes.try_into().unwrap()),
            Block {
                offset: 0,
                length: 512,
                wire_length: 512,
            }
        );
    }

    #[test]
    fn the_error_message_yields_the_code_and_the_text_length_nul_included() {
        let refusal = error(&message("14000000 01000000 13000000 85000000"));

        assert_eq!(
            refusal,
            Refusal {
                code: 19,
                text_len: 133,
            }
        );
    }
}
