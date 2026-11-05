//! Splitting a client read into host reads and decoding the chunks that answer them.
//!
//! Everything here is a pure function over numbers and byte slices: no
//! socket, no clock, so it is tested without a host.

use std::fmt;
use std::io::Read as _;
use std::str::FromStr;

/// One mebibyte, the most a host read asks for.
///
/// Cutting on the disk's mebibyte boundaries is a choice made here, not a
/// rule of the host: a mebibyte is the read size the host was measured
/// with, at most sixteen chunks, and the block size the export will advertise
/// as preferred, so a client reading that way sends one host read per command.
pub const MIB: u64 = 1 << 20;
/// The 512-byte sector every host read is widened to.
///
/// Asking whole sectors is a choice made here, not a rule of the host: it
/// gives every host read the same shape whatever a client asks, and the
/// padding around the client's range is dropped when the chunks are placed.
pub const SECTOR: u64 = 512;

/// One host read: sector aligned, within one mebibyte, and the chunks received for it.
#[derive(Debug, PartialEq, Eq)]
pub struct Read {
    /// The disk offset the read starts at.
    pub offset: u64,
    /// How many bytes it asks for.
    pub length: u32,
    /// The ranges within the read that arrived, as `(offset, end)` pairs.
    received: Vec<(u32, u32)>,
}

/// The code of a chunk sent as stored: the wire holds its bytes.
///
/// A read request carries the code at offset 12 and every reply echoes it.
const NONE: u32 = 0;
/// The code of a chunk sent as one zlib stream.
const ZLIB: u32 = 1;
/// The code of a chunk sent as skipz, its runs of zeros left out.
///
/// The code between, 2, is fastlz, which is neither asked for nor decoded.
const SKIPZ: u32 = 3;
/// Every field of a skipz stream is a little-endian word this wide.
const WORD: usize = 4;
/// A skipz stream starts with the chunk length and a reserved word.
const SKIPZ_HEADER_LEN: usize = 2 * WORD;
/// A skipz segment starts with its offset within the chunk and its length.
const SEGMENT_HEADER_LEN: usize = 2 * WORD;

/// How the host is asked to send each chunk.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Compression {
    /// As stored.
    None,
    /// As one zlib stream per chunk.
    Zlib,
    /// As the runs worth sending, the zeros between them left out.
    Skipz,
}

impl Compression {
    /// The code the wire carries for this compression.
    #[must_use]
    pub const fn code(self) -> u32 {
        match self {
            Compression::None => NONE,
            Compression::Zlib => ZLIB,
            Compression::Skipz => SKIPZ,
        }
    }
}

impl FromStr for Compression {
    type Err = String;

    /// Parses `none`, `zlib` or `skipz`, naming the three on any other text.
    fn from_str(text: &str) -> Result<Compression, String> {
        match text {
            "none" => Ok(Compression::None),
            "zlib" => Ok(Compression::Zlib),
            "skipz" => Ok(Compression::Skipz),
            other => Err(format!("{other} is not none, zlib or skipz")),
        }
    }
}

impl fmt::Display for Compression {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Compression::None => "none",
            Compression::Zlib => "zlib",
            Compression::Skipz => "skipz",
        })
    }
}

/// What one reply says about a chunk, in disk terms.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Chunk {
    /// The disk offset the host says the read started at.
    pub base_offset: u64,
    /// The length the host says the read asked for.
    pub total_length: u32,
    /// Where the chunk starts within the read.
    pub offset: u32,
    /// How many disk bytes the chunk holds.
    pub length: u32,
    /// The code of the compression the reply declares, echoed from the request.
    pub compression: u32,
}

/// A chunk that does not fit its read or does not decode, with raw values.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum Error {
    /// The chunk names another base offset than the read asked.
    #[error("chunk: base offset {received} answers a read at offset {asked}")]
    BaseOffset {
        /// The offset the read asked.
        asked: u64,
        /// The base offset the chunk carried.
        received: u64,
    },
    /// The chunk names another total length than the read asked.
    #[error("chunk: total length {received} answers a read of {asked} bytes")]
    TotalLength {
        /// The length the read asked.
        asked: u32,
        /// The total length the chunk carried.
        received: u32,
    },
    /// The chunk ends past the read.
    #[error("chunk: {length} bytes at offset {offset} end past the {asked} bytes read")]
    OutOfRange {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The length the read asked.
        asked: u32,
    },
    /// The chunk covers bytes another chunk already delivered.
    #[error("chunk: {length} bytes at offset {offset} overlap a chunk already received")]
    Overlap {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
    },
    /// The chunk came with a compression that is not decoded.
    #[error(
        "chunk: {length} bytes at offset {offset} came with compression {compression}, which is not decoded"
    )]
    Compression {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The code the reply declares.
        compression: u32,
    },
    /// The chunk came as stored, with another number of bytes than it holds.
    #[error("chunk: {length} bytes at offset {offset} came as {wire} bytes on the wire")]
    WireLength {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The bytes it carried on the wire.
        wire: usize,
    },
    /// The chunk came as a zlib stream that does not inflate.
    #[error("chunk: {length} bytes at offset {offset}: the zlib stream does not inflate: {detail}")]
    Zlib {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// What the inflater reported.
        detail: String,
    },
    /// The chunk's zlib stream inflates to another number of bytes than it holds.
    #[error("chunk: {length} bytes at offset {offset} inflate to {inflated} bytes")]
    Inflated {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The bytes the stream inflates to, counted up to one past the length.
        inflated: usize,
    },
    /// The chunk came as a skipz stream that ends inside a header or a segment.
    #[error(
        "chunk: {length} bytes at offset {offset}: the skipz stream of {wire} bytes ends inside a header or a segment"
    )]
    SkipzShort {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The bytes the stream holds.
        wire: usize,
    },
    /// The chunk came as a skipz stream with a segment ending past the chunk.
    #[error(
        "chunk: {length} bytes at offset {offset}: a skipz segment of {segment_length} bytes at offset {segment_offset} ends past the chunk"
    )]
    SkipzSegment {
        /// The chunk's offset within the read.
        offset: u32,
        /// The chunk's length.
        length: u32,
        /// The segment's offset within the chunk.
        segment_offset: u32,
        /// The segment's length.
        segment_length: u32,
    },
}

impl Chunk {
    /// Decodes the chunk's `wire` bytes, as the reply declares them, into its bytes.
    ///
    /// # Errors
    /// When the compression is one that is not decoded, when the bytes do not
    /// decode, or when they decode to another number of bytes than the chunk holds.
    pub fn decode(&self, wire: &[u8]) -> Result<Vec<u8>, Error> {
        match self.compression {
            NONE => self.raw(wire),
            ZLIB => self.inflate(wire),
            SKIPZ => self.unskip(wire),
            compression => Err(Error::Compression {
                offset: self.offset,
                length: self.length,
                compression,
            }),
        }
    }

    /// The chunk sent as stored: the wire is its bytes.
    fn raw(&self, wire: &[u8]) -> Result<Vec<u8>, Error> {
        if wire.len() != index(self.length) {
            return Err(Error::WireLength {
                offset: self.offset,
                length: self.length,
                wire: wire.len(),
            });
        }
        Ok(wire.to_vec())
    }

    /// The chunk sent as one zlib stream.
    fn inflate(&self, wire: &[u8]) -> Result<Vec<u8>, Error> {
        let mut bytes = Vec::new();
        // One byte past the chunk: a stream running longer shows without
        // inflating all of it.
        flate2::read::ZlibDecoder::new(wire)
            .take(u64::from(self.length) + 1)
            .read_to_end(&mut bytes)
            .map_err(|error| Error::Zlib {
                offset: self.offset,
                length: self.length,
                detail: error.to_string(),
            })?;
        if bytes.len() != index(self.length) {
            return Err(Error::Inflated {
                offset: self.offset,
                length: self.length,
                inflated: bytes.len(),
            });
        }
        Ok(bytes)
    }

    /// The chunk sent as skipz, or as stored when the host had nothing to skip.
    ///
    /// A skipz stream starts with the chunk length and a reserved word, then
    /// segments, each its offset within the chunk, its length and its bytes,
    /// all little-endian. What no segment covers is zero. A stream whose
    /// first word is not the chunk length is the chunk as stored.
    fn unskip(&self, wire: &[u8]) -> Result<Vec<u8>, Error> {
        if word(wire, 0) != Some(self.length) {
            return self.raw(wire);
        }
        let short = || Error::SkipzShort {
            offset: self.offset,
            length: self.length,
            wire: wire.len(),
        };
        let mut bytes = vec![0_u8; index(self.length)];
        let mut rest = wire.get(SKIPZ_HEADER_LEN..).ok_or_else(short)?;
        while !rest.is_empty() {
            let (Some(at), Some(count)) = (word(rest, 0), word(rest, WORD)) else {
                return Err(short());
            };
            let end = index(at)
                .checked_add(index(count))
                .filter(|end| *end <= bytes.len())
                .ok_or(Error::SkipzSegment {
                    offset: self.offset,
                    length: self.length,
                    segment_offset: at,
                    segment_length: count,
                })?;
            let data_end = SEGMENT_HEADER_LEN + index(count);
            let data = rest.get(SEGMENT_HEADER_LEN..data_end).ok_or_else(short)?;
            bytes[index(at)..end].copy_from_slice(data);
            rest = &rest[data_end..];
        }
        Ok(bytes)
    }
}

/// The little-endian word at `at` of `bytes`, if all its bytes are there.
fn word(bytes: &[u8], at: usize) -> Option<u32> {
    let bytes = bytes.get(at..at + WORD)?;
    <[u8; WORD]>::try_from(bytes).ok().map(u32::from_le_bytes)
}

/// A wire length or offset as an index.
///
/// Every supported target has an index at least as wide as a word, so the
/// fallback never runs; it keeps the conversion free of a panic.
fn index(value: u32) -> usize {
    usize::try_from(value).unwrap_or(usize::MAX)
}

/// Cuts the range of `length` bytes at `offset`, clipped to `capacity`, into host reads.
///
/// Each read stays within one [`MIB`] of the disk and is widened to
/// [`SECTOR`] boundaries, never past `capacity`. The reads come in disk
/// order and do not overlap.
#[must_use]
pub fn reads(offset: u64, length: u32, capacity: u64) -> Vec<Read> {
    let end = offset.saturating_add(u64::from(length)).min(capacity);
    if offset >= end {
        return Vec::new();
    }
    (offset / MIB..=(end - 1) / MIB)
        .map(|mebibyte| {
            let start = offset.max(mebibyte * MIB);
            let stop = end.min(mebibyte.saturating_add(1).saturating_mul(MIB));
            let aligned_start = start / SECTOR * SECTOR;
            let aligned_stop = stop.div_ceil(SECTOR).saturating_mul(SECTOR).min(capacity);
            Read::new(
                aligned_start,
                u32::try_from(aligned_stop - aligned_start).unwrap_or(u32::MAX),
            )
        })
        .collect()
}

impl Read {
    /// A read of `length` bytes at `offset` with no chunk received yet.
    #[must_use]
    pub fn new(offset: u64, length: u32) -> Read {
        Read {
            offset,
            length,
            received: Vec::new(),
        }
    }

    /// Checks `chunk` against the read and the chunks before it, then counts it.
    ///
    /// # Errors
    /// When the chunk answers another read, ends past this one, or overlaps
    /// a chunk already accepted.
    pub fn accept(&mut self, chunk: &Chunk) -> Result<(), Error> {
        if chunk.base_offset != self.offset {
            return Err(Error::BaseOffset {
                asked: self.offset,
                received: chunk.base_offset,
            });
        }
        if chunk.total_length != self.length {
            return Err(Error::TotalLength {
                asked: self.length,
                received: chunk.total_length,
            });
        }
        let end = chunk
            .offset
            .checked_add(chunk.length)
            .filter(|end| *end <= self.length)
            .ok_or(Error::OutOfRange {
                offset: chunk.offset,
                length: chunk.length,
                asked: self.length,
            })?;
        if self
            .received
            .iter()
            .any(|(start, stop)| chunk.offset < *stop && *start < end)
        {
            return Err(Error::Overlap {
                offset: chunk.offset,
                length: chunk.length,
            });
        }
        self.received.push((chunk.offset, end));
        Ok(())
    }

    /// Whether the accepted chunks cover the whole read.
    #[must_use]
    pub fn is_complete(&self) -> bool {
        self.received
            .iter()
            .map(|(start, stop)| stop - start)
            .sum::<u32>()
            == self.length
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// A mebibyte as a read length.
    const MIB_LEN: u32 = 1 << 20;

    fn read(offset: u64, length: u32) -> Read {
        Read::new(offset, length)
    }

    fn chunk(offset: u32, length: u32) -> Chunk {
        Chunk {
            base_offset: 4096,
            total_length: 2048,
            offset,
            length,
            compression: NONE,
        }
    }

    #[test]
    fn a_range_inside_one_sector_becomes_that_whole_sector() {
        assert_eq!(reads(700, 100, MIB), vec![read(512, 512)]);
    }

    #[test]
    fn a_range_is_widened_to_the_sectors_it_touches() {
        assert_eq!(reads(511, 2, MIB), vec![read(0, 1024)]);
        assert_eq!(reads(512, 512, MIB), vec![read(512, 512)]);
    }

    #[test]
    fn a_range_over_three_mebibytes_is_cut_on_the_boundaries() {
        assert_eq!(
            reads(MIB - 100, 2 * MIB_LEN + 200, 10 * MIB),
            vec![
                read(MIB - 512, 512),
                read(MIB, MIB_LEN),
                read(2 * MIB, MIB_LEN),
                read(3 * MIB, 512),
            ]
        );
    }

    #[test]
    fn a_range_ending_on_a_boundary_stops_there() {
        assert_eq!(reads(0, MIB_LEN, 10 * MIB), vec![read(0, MIB_LEN)]);
        assert_eq!(reads(MIB - 1, 1, 10 * MIB), vec![read(MIB - 512, 512)]);
    }

    #[test]
    fn a_range_is_clipped_to_the_capacity_and_never_widened_past_it() {
        assert_eq!(
            reads(MIB - 512, 4096, MIB + 100),
            vec![read(MIB - 512, 512), read(MIB, 100)]
        );
        assert_eq!(reads(MIB, 1, MIB), vec![]);
        assert_eq!(reads(u64::MAX, 1, u64::MAX), vec![]);
        assert_eq!(
            reads(u64::MAX - 1, 1, u64::MAX),
            vec![read(u64::MAX - 511, 511)]
        );
    }

    #[test]
    fn an_empty_range_yields_no_read() {
        assert_eq!(reads(4096, 0, MIB), vec![]);
        assert_eq!(reads(700, 0, MIB), vec![]);
        assert_eq!(reads(0, 0, 0), vec![]);
    }

    #[test]
    fn chunks_in_any_order_complete_the_read_once_they_cover_it() {
        let mut read = read(4096, 2048);
        assert!(!read.is_complete());
        read.accept(&chunk(1500, 548)).unwrap();
        read.accept(&chunk(0, 700)).unwrap();
        assert!(!read.is_complete());
        read.accept(&chunk(700, 800)).unwrap();
        assert!(read.is_complete());
    }

    #[test]
    fn a_chunk_answering_another_read_is_refused_naming_both() {
        let mut read = read(4096, 2048);
        let error = read
            .accept(&Chunk {
                base_offset: 8192,
                ..chunk(0, 512)
            })
            .unwrap_err();
        assert_eq!(
            error,
            Error::BaseOffset {
                asked: 4096,
                received: 8192
            }
        );
        assert_eq!(
            error.to_string(),
            "chunk: base offset 8192 answers a read at offset 4096"
        );
        let error = read
            .accept(&Chunk {
                total_length: 1024,
                ..chunk(0, 512)
            })
            .unwrap_err();
        assert_eq!(
            error.to_string(),
            "chunk: total length 1024 answers a read of 2048 bytes"
        );
    }

    #[test]
    fn a_chunk_ending_past_the_read_is_refused() {
        let mut read = read(4096, 2048);
        read.accept(&chunk(1536, 512)).unwrap();
        assert_eq!(
            read.accept(&chunk(1024, 1025)).unwrap_err().to_string(),
            "chunk: 1025 bytes at offset 1024 end past the 2048 bytes read"
        );
        assert_eq!(
            read.accept(&chunk(u32::MAX, 1)).unwrap_err(),
            Error::OutOfRange {
                offset: u32::MAX,
                length: 1,
                asked: 2048
            }
        );
    }

    #[test]
    fn a_chunk_overlapping_one_already_received_is_refused() {
        let mut read = read(4096, 2048);
        read.accept(&chunk(512, 512)).unwrap();
        assert_eq!(
            read.accept(&chunk(1023, 1)).unwrap_err(),
            Error::Overlap {
                offset: 1023,
                length: 1
            }
        );
        assert_eq!(
            read.accept(&chunk(0, 513)).unwrap_err().to_string(),
            "chunk: 513 bytes at offset 0 overlap a chunk already received"
        );
        read.accept(&chunk(1024, 1024)).unwrap();
        read.accept(&chunk(0, 512)).unwrap();
        assert!(read.is_complete());
    }

    /// A chunk of `length` bytes at offset 0, sent with `compression`.
    fn sent(length: u32, compression: u32) -> Chunk {
        Chunk {
            compression,
            ..chunk(0, length)
        }
    }

    /// The bytes 0 to `length - 1`.
    fn counting(length: u8) -> Vec<u8> {
        (0..length).collect()
    }

    /// The bytes 0 to 15 as one zlib stream, the output of Python's `zlib.compress`.
    const ZLIB_16: [u8; 24] = [
        0x78, 0x9C, 0x63, 0x60, 0x64, 0x62, 0x66, 0x61, 0x65, 0x63, 0xE7, 0xE0, 0xE4, 0xE2, 0xE6,
        0xE1, 0xE5, 0xE3, 0x07, 0x00, 0x02, 0xB8, 0x00, 0x79,
    ];
    /// The bytes 0 to 14 as one zlib stream.
    const ZLIB_15: [u8; 23] = [
        0x78, 0x9C, 0x63, 0x60, 0x64, 0x62, 0x66, 0x61, 0x65, 0x63, 0xE7, 0xE0, 0xE4, 0xE2, 0xE6,
        0xE1, 0xE5, 0x03, 0x00, 0x02, 0x3F, 0x00, 0x6A,
    ];
    /// The bytes 0 to 16 as one zlib stream.
    const ZLIB_17: [u8; 25] = [
        0x78, 0x9C, 0x63, 0x60, 0x64, 0x62, 0x66, 0x61, 0x65, 0x63, 0xE7, 0xE0, 0xE4, 0xE2, 0xE6,
        0xE1, 0xE5, 0xE3, 0x17, 0x00, 0x00, 0x03, 0x41, 0x00, 0x89,
    ];

    /// A skipz stream for a `length`-byte chunk holding `segments`, an offset and bytes each.
    fn skipz(length: u32, segments: &[(u32, &[u8])]) -> Vec<u8> {
        let mut wire = length.to_le_bytes().to_vec();
        wire.extend_from_slice(&0_u32.to_le_bytes());
        for (offset, data) in segments {
            wire.extend_from_slice(&offset.to_le_bytes());
            wire.extend_from_slice(&u32::try_from(data.len()).unwrap().to_le_bytes());
            wire.extend_from_slice(data);
        }
        wire
    }

    #[test]
    fn the_compression_codes_are_none_zero_zlib_one_and_skipz_three() {
        assert_eq!(Compression::None.code(), 0);
        assert_eq!(Compression::Zlib.code(), 1);
        assert_eq!(Compression::Skipz.code(), 3);
    }

    #[test]
    fn a_compression_is_parsed_from_its_name_and_prints_as_it() {
        for (name, compression) in [
            ("none", Compression::None),
            ("zlib", Compression::Zlib),
            ("skipz", Compression::Skipz),
        ] {
            assert_eq!(name.parse::<Compression>(), Ok(compression));
            assert_eq!(compression.to_string(), name);
        }
        assert_eq!(
            "gzip".parse::<Compression>(),
            Err("gzip is not none, zlib or skipz".to_owned())
        );
        assert!("Skipz".parse::<Compression>().is_err());
    }

    #[test]
    fn a_chunk_sent_as_stored_is_its_wire_bytes() {
        assert_eq!(sent(3, NONE).decode(b"abc"), Ok(b"abc".to_vec()));
    }

    #[test]
    fn a_chunk_sent_as_stored_with_another_number_of_bytes_is_refused_naming_both() {
        let error = sent(512, NONE).decode(&[0; 511]).unwrap_err();
        assert_eq!(
            error,
            Error::WireLength {
                offset: 0,
                length: 512,
                wire: 511
            }
        );
        assert_eq!(
            error.to_string(),
            "chunk: 512 bytes at offset 0 came as 511 bytes on the wire"
        );
        assert_eq!(
            sent(512, NONE).decode(&[0; 513]),
            Err(Error::WireLength {
                offset: 0,
                length: 512,
                wire: 513
            })
        );
    }

    #[test]
    fn a_zlib_chunk_is_inflated() {
        assert_eq!(sent(16, ZLIB).decode(&ZLIB_16), Ok(counting(16)));
    }

    #[test]
    fn a_zlib_stream_that_does_not_inflate_is_refused_with_the_reason() {
        let mut bad_header = ZLIB_16;
        bad_header[0] = 0x00;
        let error = sent(16, ZLIB).decode(&bad_header).unwrap_err();
        assert!(
            matches!(
                error,
                Error::Zlib {
                    offset: 0,
                    length: 16,
                    ..
                }
            ),
            "{error:?}"
        );
        let message = error.to_string();
        assert!(
            message.starts_with("chunk: 16 bytes at offset 0: the zlib stream does not inflate: "),
            "{message}"
        );
        let mut bad_checksum = ZLIB_16;
        bad_checksum[ZLIB_16.len() - 1] ^= 0xFF;
        assert!(matches!(
            sent(16, ZLIB).decode(&bad_checksum),
            Err(Error::Zlib { .. })
        ));
    }

    #[test]
    fn a_zlib_stream_inflating_to_another_number_of_bytes_is_refused_naming_both() {
        let error = sent(16, ZLIB).decode(&ZLIB_15).unwrap_err();
        assert_eq!(
            error,
            Error::Inflated {
                offset: 0,
                length: 16,
                inflated: 15
            }
        );
        assert_eq!(
            error.to_string(),
            "chunk: 16 bytes at offset 0 inflate to 15 bytes"
        );
        assert_eq!(
            sent(16, ZLIB).decode(&ZLIB_17),
            Err(Error::Inflated {
                offset: 0,
                length: 16,
                inflated: 17
            })
        );
    }

    #[test]
    fn a_skipz_chunk_without_segments_is_all_zeros() {
        assert_eq!(
            sent(2048, SKIPZ).decode(&skipz(2048, &[])),
            Ok(vec![0; 2048])
        );
    }

    #[test]
    fn a_skipz_segment_covering_the_chunk_is_the_whole_chunk() {
        let data = counting(16);
        assert_eq!(sent(16, SKIPZ).decode(&skipz(16, &[(0, &data)])), Ok(data));
    }

    #[test]
    fn the_reserved_word_of_a_skipz_stream_is_ignored() {
        let data = counting(16);
        let mut wire = skipz(16, &[(0, &data)]);
        wire[WORD..SKIPZ_HEADER_LEN].copy_from_slice(&u32::MAX.to_le_bytes());
        assert_eq!(sent(16, SKIPZ).decode(&wire), Ok(data));
    }

    #[test]
    fn skipz_segments_at_both_ends_are_placed_with_zeros_between() {
        let wire = skipz(16, &[(0, b"ab"), (13, b"xyz")]);
        let mut expected = vec![0; 16];
        expected[..2].copy_from_slice(b"ab");
        expected[13..].copy_from_slice(b"xyz");
        assert_eq!(sent(16, SKIPZ).decode(&wire), Ok(expected));
    }

    #[test]
    fn a_skipz_chunk_whose_first_word_is_not_its_length_is_taken_as_stored() {
        let data = counting(16);
        assert_eq!(sent(16, SKIPZ).decode(&data), Ok(data.clone()));
        assert_eq!(
            sent(16, SKIPZ).decode(&data[..15]),
            Err(Error::WireLength {
                offset: 0,
                length: 16,
                wire: 15
            })
        );
        assert_eq!(sent(3, SKIPZ).decode(b"abc"), Ok(b"abc".to_vec()));
    }

    #[test]
    fn a_skipz_stream_cut_inside_its_header_or_a_segment_is_refused() {
        let short = |wire: &[u8]| Error::SkipzShort {
            offset: 0,
            length: 16,
            wire: wire.len(),
        };
        let header = skipz(16, &[]);
        assert_eq!(
            sent(16, SKIPZ).decode(&header[..6]),
            Err(short(&header[..6]))
        );
        let segment = skipz(16, &[(4, b"abcd")]);
        assert_eq!(
            sent(16, SKIPZ).decode(&segment[..12]),
            Err(short(&segment[..12]))
        );
        assert_eq!(
            sent(16, SKIPZ).decode(&segment[..18]),
            Err(short(&segment[..18]))
        );
        assert_eq!(
            short(&header[..6]).to_string(),
            "chunk: 16 bytes at offset 0: the skipz stream of 6 bytes ends inside a header or a segment"
        );
    }

    #[test]
    fn a_skipz_segment_ending_past_the_chunk_is_refused_naming_it() {
        let error = sent(16, SKIPZ)
            .decode(&skipz(16, &[(13, b"abcd")]))
            .unwrap_err();
        assert_eq!(
            error,
            Error::SkipzSegment {
                offset: 0,
                length: 16,
                segment_offset: 13,
                segment_length: 4
            }
        );
        assert_eq!(
            error.to_string(),
            "chunk: 16 bytes at offset 0: a skipz segment of 4 bytes at offset 13 ends past the chunk"
        );
        let mut wrapping = skipz(16, &[]);
        wrapping.extend_from_slice(&u32::MAX.to_le_bytes());
        wrapping.extend_from_slice(&2_u32.to_le_bytes());
        wrapping.extend_from_slice(b"ab");
        assert!(matches!(
            sent(16, SKIPZ).decode(&wrapping),
            Err(Error::SkipzSegment { .. })
        ));
    }

    #[test]
    fn a_chunk_with_a_compression_that_is_not_decoded_is_refused_naming_it() {
        let error = sent(16, 2).decode(&[0; 16]).unwrap_err();
        assert_eq!(
            error,
            Error::Compression {
                offset: 0,
                length: 16,
                compression: 2
            }
        );
        assert_eq!(
            error.to_string(),
            "chunk: 16 bytes at offset 0 came with compression 2, which is not decoded"
        );
    }
}
