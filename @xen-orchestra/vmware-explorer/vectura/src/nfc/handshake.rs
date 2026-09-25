//! The fixed-size messages exchanged on the data port once TLS is up, before any record.
//!
//! Every message is [`LEN`] bytes: a little-endian `u32` type at offset 0,
//! two little-endian `u32` arguments at offsets 4 and 8, and zero padding.
//! A message of type [`TAG`] carries a 16-byte session tag at offset 4
//! instead of arguments, and one of type [`NAME`] is followed by a trailer
//! holding the client name and the operation name back to back, with their
//! lengths in the two arguments. The host reads one message per TLS
//! record, so each message is written on its own. The client sends [`TAG`],
//! [`TAG_END`] and [`VERSION`] and only then waits: the host acknowledges
//! the tag with [`TAG_ACK`] once the version message has arrived, and echoes
//! [`VERSION`] right after. The client then sends [`NAME`], [`MODE`] and
//! [`READY`] and waits for the [`READY`] echo. A reply of type [`ERROR`], or
//! of any type other than the one expected, ends the session.

/// Length of every message in bytes.
pub const LEN: usize = 264;

/// Length of the session tag a [`TAG`] message carries, in bytes.
pub const TAG_LEN: usize = 16;

/// The client's first message, carrying the session tag at offset 4.
pub const TAG: u32 = 43;
/// The client's second message: no arguments; the host acknowledges both after [`VERSION`].
pub const TAG_END: u32 = 33;
/// The host's acknowledgment of [`TAG`] and [`TAG_END`]; its arguments are not read.
pub const TAG_ACK: u32 = 36;
/// The client's protocol proposal, with [`VERSION_ARGS`]; the host answers with type 51 too.
pub const VERSION: u32 = 51;
/// The client name and operation name message, with their lengths as arguments.
pub const NAME: u32 = 54;
/// The client's mode message, with [`MODE_ARGS`].
pub const MODE: u32 = 55;
/// The client's last message, with zero arguments; the host answers with type 52 too.
pub const READY: u32 = 52;
/// A host's refusal, in place of the message it would otherwise echo.
pub const ERROR: u32 = 4;

/// Arguments of the [`VERSION`] message.
pub const VERSION_ARGS: (u32, u32) = (12, 1);
/// Arguments of the [`MODE`] message.
pub const MODE_ARGS: (u32, u32) = (3, 0);

/// The client name sent in the [`NAME`] trailer.
pub const CLIENT_NAME: &[u8] = b"vectura";
/// The operation name sent in the [`NAME`] trailer: a disk read session.
pub const OPERATION: &[u8] = b"nbdmode";

/// Builds a message of `kind` with two little-endian arguments.
#[must_use]
pub fn message(kind: u32, arguments: (u32, u32)) -> [u8; LEN] {
    let mut bytes = [0_u8; LEN];
    bytes[..4].copy_from_slice(&kind.to_le_bytes());
    bytes[4..8].copy_from_slice(&arguments.0.to_le_bytes());
    bytes[8..12].copy_from_slice(&arguments.1.to_le_bytes());
    bytes
}

/// Builds the [`TAG`] message carrying `tag` at offset 4.
#[must_use]
pub fn tag(tag: &[u8; TAG_LEN]) -> [u8; LEN] {
    let mut bytes = message(TAG, (0, 0));
    bytes[4..4 + TAG_LEN].copy_from_slice(tag);
    bytes
}

/// Builds the [`NAME`] message and its trailer, client name then operation name.
#[must_use]
pub fn name() -> Vec<u8> {
    let lengths = (
        u32::try_from(CLIENT_NAME.len()).unwrap_or(u32::MAX),
        u32::try_from(OPERATION.len()).unwrap_or(u32::MAX),
    );
    let mut bytes = message(NAME, lengths).to_vec();
    bytes.extend_from_slice(CLIENT_NAME);
    bytes.extend_from_slice(OPERATION);
    bytes
}

/// The type at offset 0 of a message.
#[must_use]
pub fn kind(bytes: &[u8; LEN]) -> u32 {
    u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_message_holds_its_type_and_arguments_little_endian_then_zeros() {
        let bytes = message(VERSION, VERSION_ARGS);
        assert_eq!(bytes.len(), 264);
        assert_eq!(&bytes[..12], &[51, 0, 0, 0, 12, 0, 0, 0, 1, 0, 0, 0]);
        assert!(bytes[12..].iter().all(|byte| *byte == 0));
        assert_eq!(kind(&bytes), VERSION);
    }

    #[test]
    fn the_tag_message_carries_the_sixteen_byte_tag_at_offset_four() {
        let bytes = tag(b"ABCDEFGHIJKLMNOP");
        assert_eq!(&bytes[..4], &[43, 0, 0, 0]);
        assert_eq!(&bytes[4..20], b"ABCDEFGHIJKLMNOP");
        assert!(bytes[20..].iter().all(|byte| *byte == 0));
    }

    #[test]
    fn the_name_message_announces_both_lengths_and_trails_both_names() {
        let bytes = name();
        assert_eq!(bytes.len(), 264 + 14);
        assert_eq!(&bytes[..12], &[54, 0, 0, 0, 7, 0, 0, 0, 7, 0, 0, 0]);
        assert!(bytes[12..264].iter().all(|byte| *byte == 0));
        assert_eq!(&bytes[264..], b"vecturanbdmode");
    }

    #[test]
    fn the_end_mode_and_ready_messages_carry_their_fixed_arguments() {
        assert_eq!(
            &message(TAG_END, (0, 0))[..12],
            &[33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        );
        assert_eq!(
            &message(MODE, MODE_ARGS)[..12],
            &[55, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0]
        );
        assert_eq!(
            &message(READY, (0, 0))[..12],
            &[52, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        );
    }
}
