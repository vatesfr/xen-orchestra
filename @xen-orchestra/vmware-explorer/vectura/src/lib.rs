//! Vectura reads VMware virtual disks over the NFC protocol.
//!
//! `vectura serve` exports one virtual disk, read-only, as an NBD server on
//! its own standard input and output; `vectura fingerprint` prints the
//! certificate thumbprints a host presents on its management and data ports,
//! so an operator can pin them.

pub mod cli;
pub mod disk;
pub mod nbd;
pub mod nfc;
pub mod serve;
pub mod soap;
pub mod tls;
pub mod transcript;
