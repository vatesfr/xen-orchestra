//! The command line: argument parsing, exit codes, and which stream gets what.
//!
//! Exit codes: 0 on success, 1 when talking to the host or writing the result
//! failed, 2 for a usage error. Explanations go to standard error with a
//! `vectura:` prefix; standard output carries results only: the thumbprint
//! lines of `fingerprint`, the NBD stream of `serve`.

use std::env::VarError;
use std::ffi::OsString;
use std::io::{self, Write};
use std::num::{NonZeroU8, NonZeroUsize};
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use clap::{Args, Parser, Subcommand};
use rustls_pki_types::CertificateDer;
use rustls_pki_types::pem::PemObject;

use crate::transcript::Transcript;
use crate::{disk, nfc, serve, soap, tls};

/// Exit code when the host or the output could not be dealt with.
const EXIT_FAILURE: u8 = 1;

/// Exit code for a usage error: bad flags, missing values, unknown commands.
const EXIT_USAGE: u8 = 2;

/// What clap puts before every usage message; `vectura:` replaces it so the
/// line names the program rather than a generic word.
const CLAP_ERROR_PREFIX: &str = "error: ";

/// The management port, where the vSphere API listens over TLS.
const MANAGEMENT_PORT: u16 = 443;

/// The data port, where the host greets in clear before TLS starts.
const DATA_PORT: u16 = 902;

/// The only place the password is read from: never a flag, a file or a prompt.
const PASSWORD_VARIABLE: &str = "VECTURA_PASSWORD";

/// What a `--thumbprint` value starts with; the rest is the SHA-256 hex.
const THUMBPRINT_PREFIX: &str = "sha256:";

/// How many host reads `serve` keeps in flight unless `--depth` says otherwise.
///
/// Half of [`serve::MAX_DEPTH`]: enough to keep a host busy, and two
/// processes reading from one host stay under its limit without being told to.
const DEFAULT_DEPTH: &str = "16";

/// Reads VMware virtual disks over NFC.
#[derive(Debug, Parser)]
#[command(name = "vectura", version)]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    /// Print the certificate thumbprints a host presents on its management and data ports.
    Fingerprint(Fingerprint),
    /// Export one virtual disk, read-only, as an NBD server on standard input and output.
    Serve(Serve),
}

/// Arguments of `vectura fingerprint`.
#[derive(Debug, Args)]
struct Fingerprint {
    /// Host name or address, with an optional management port (default 443).
    #[arg(long, value_parser = parse_host)]
    host: HostPort,
    /// Data port where the host greets before TLS starts.
    #[arg(long, default_value_t = DATA_PORT)]
    nfc_port: u16,
    /// Also report the negotiated TLS version and cipher suite on standard error.
    #[arg(long)]
    verbose: bool,
}

/// Arguments of `vectura serve`; the password comes from `VECTURA_PASSWORD`.
#[derive(Debug, Args)]
struct Serve {
    /// Host name or address, with an optional management port (default 443).
    #[arg(long, value_parser = parse_host)]
    host: HostPort,
    /// User name to log in with.
    #[arg(long)]
    user: String,
    /// Managed object reference of the virtual machine, such as `3` or `vm-42`.
    #[arg(long)]
    vm_id: String,
    /// Datastore path of the disk, such as `[datastore1] vm/vm.vmdk`.
    #[arg(long)]
    disk: String,
    /// Pin the management port's certificate: `sha256:` and 64 hex digits.
    #[arg(long, value_parser = parse_thumbprint, conflicts_with = "ca_file")]
    thumbprint: Option<tls::Pin>,
    /// Verify the management port's certificate against this PEM bundle instead of the system roots.
    #[arg(long)]
    ca_file: Option<PathBuf>,
    /// Host reads kept in flight at once, 1 to 32.
    ///
    /// The limit is per host: lower it when several processes read from the same host.
    #[arg(long, default_value = DEFAULT_DEPTH, value_parser = parse_depth)]
    depth: NonZeroU8,

    /// How the host sends each chunk: skipz, zlib or none.
    ///
    /// skipz leaves out the runs of zeros, zlib deflates every chunk, none
    /// sends the bytes as stored.
    #[arg(long, default_value_t = disk::Compression::Skipz)]
    compression: disk::Compression,
    /// How the disk session runs after the ticket dialogue.
    ///
    /// `nfcssl` opens a second TLS session on the same connection, `nfc` stays
    /// in clear.
    #[arg(long, default_value_t = nfc::Transport::Nfcssl)]
    transport: nfc::Transport,
    /// Write a transcript of the session to standard error.
    #[arg(long)]
    verbose: bool,
}

/// A host name or address and the management port to reach it on.
#[derive(Debug, Clone)]
struct HostPort {
    host: String,
    port: u16,
}

/// Parses `host` or `host:port`; a bare IPv6 address keeps the default port.
fn parse_host(text: &str) -> Result<HostPort, String> {
    let (host, port) = match text.rsplit_once(':') {
        Some((host, port)) if !host.contains(':') => {
            let port = port
                .parse()
                .map_err(|error| format!("invalid port {port:?}: {error}"))?;
            (host, port)
        }
        _ => (text, MANAGEMENT_PORT),
    };
    rustls_pki_types::ServerName::try_from(host)
        .map_err(|error| format!("invalid host {host:?}: {error}"))?;
    Ok(HostPort {
        host: host.to_owned(),
        port,
    })
}

/// Parses `sha256:<hex>`; colons between pairs and either case are accepted.
fn parse_thumbprint(text: &str) -> Result<tls::Pin, String> {
    let hex = text
        .strip_prefix(THUMBPRINT_PREFIX)
        .ok_or_else(|| format!("{text:?} does not start with {THUMBPRINT_PREFIX}"))?;
    tls::Pin::sha256(hex).map_err(|error| error.to_string())
}

/// Parses a depth of 1 to [`serve::MAX_DEPTH`], naming the range when it is not.
fn parse_depth(text: &str) -> Result<NonZeroU8, String> {
    text.parse::<NonZeroU8>()
        .ok()
        .filter(|depth| usize::from(depth.get()) <= serve::MAX_DEPTH)
        .ok_or_else(|| format!("{text} is not in 1..={}", serve::MAX_DEPTH))
}

/// Failures of `vectura fingerprint`, each naming what it happened on.
#[derive(Debug, thiserror::Error)]
enum Failure {
    /// The management port could not be reached or its TLS handshake failed.
    #[error("{address}: {source}")]
    Management {
        address: String,
        #[source]
        source: tls::Error,
    },
    /// The data port could not be reached, greeted wrongly, or its TLS handshake failed.
    #[error("{address}: {source}")]
    Data {
        address: String,
        #[source]
        source: nfc::Error,
    },
    /// The result could not be written.
    #[error("writing to standard output: {0}")]
    Stdout(#[source] io::Error),
}

/// Runs the command line `args` and returns the exit code.
pub fn run<I, T>(args: I) -> ExitCode
where
    I: IntoIterator<Item = T>,
    T: Into<OsString> + Clone,
{
    let cli = match Cli::try_parse_from(args) {
        Ok(cli) => cli,
        Err(error) => return report_parse(&error),
    };
    match cli.command {
        Command::Fingerprint(arguments) => match fingerprint(&arguments) {
            Ok(()) => ExitCode::SUCCESS,
            Err(failure) => {
                eprintln!("vectura: {failure}");
                ExitCode::from(EXIT_FAILURE)
            }
        },
        Command::Serve(arguments) => serve_command(&arguments, std::env::var(PASSWORD_VARIABLE)),
    }
}

/// Runs `serve` with the password as the environment yielded it.
///
/// A missing or empty password and an unreadable CA file are usage errors,
/// reported before any connection is made.
fn serve_command(arguments: &Serve, password: Result<String, VarError>) -> ExitCode {
    let password = match password {
        Ok(text) if !text.is_empty() => soap::Password::new(text),
        _ => {
            eprintln!("vectura: {PASSWORD_VARIABLE} is not set");
            return ExitCode::from(EXIT_USAGE);
        }
    };
    let trust = match trust(arguments) {
        Ok(trust) => trust,
        Err(text) => {
            eprintln!("vectura: {text}");
            return ExitCode::from(EXIT_USAGE);
        }
    };
    if arguments.transport == nfc::Transport::Nfc {
        // A warning standard error cannot take is dropped, as a transcript
        // line is: the disk stream must not stop because its reader left.
        let _ = writeln!(
            io::stderr().lock(),
            "vectura: warning: --transport nfc carries the disk in clear text after the ticket dialogue"
        );
    }
    let target = serve::Target {
        host: arguments.host.host.clone(),
        port: arguments.host.port,
        trust,
        user: arguments.user.clone(),
        vm_id: arguments.vm_id.clone(),
        disk: arguments.disk.clone(),
        depth: NonZeroUsize::from(arguments.depth),
        compression: arguments.compression,
        transport: arguments.transport,
        transcript: Transcript::new(arguments.verbose),
    };
    let mut stdout = io::stdout().lock();
    match serve::run(&target, &password, io::stdin(), &mut stdout) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("vectura: {error}");
            ExitCode::from(EXIT_FAILURE)
        }
    }
}

/// How `serve` judges the management port's certificate: pin, bundle, or system roots.
fn trust(arguments: &Serve) -> Result<tls::Trust, String> {
    if let Some(pin) = &arguments.thumbprint {
        return Ok(tls::Trust::Pin(pin.clone()));
    }
    match &arguments.ca_file {
        Some(path) => read_anchors(path).map(tls::Trust::Anchors),
        None => Ok(tls::Trust::System),
    }
}

/// Reads every certificate of the PEM bundle at `path`.
fn read_anchors(path: &Path) -> Result<Vec<CertificateDer<'static>>, String> {
    let bytes =
        std::fs::read(path).map_err(|error| format!("cannot read {}: {error}", path.display()))?;
    CertificateDer::pem_slice_iter(&bytes)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("cannot parse {}: {error}", path.display()))
}

/// Prints a parse outcome where it belongs and returns its exit code.
///
/// Usage errors go to standard error with exit 2; help and version go to
/// standard output with exit 0.
fn report_parse(error: &clap::Error) -> ExitCode {
    if error.use_stderr() {
        let text = error.to_string();
        let text = text.strip_prefix(CLAP_ERROR_PREFIX).unwrap_or(&text);
        eprintln!("vectura: {text}");
        return ExitCode::from(EXIT_USAGE);
    }
    if error.print().is_ok() {
        ExitCode::SUCCESS
    } else {
        ExitCode::from(EXIT_FAILURE)
    }
}

/// Probes both ports, then prints their thumbprints, management port first.
fn fingerprint(arguments: &Fingerprint) -> Result<(), Failure> {
    let HostPort { host, port } = &arguments.host;
    let management = tls::connect(host, *port)
        .and_then(|mut stream| tls::capture(&mut stream, host))
        .map_err(|source| Failure::Management {
            address: format!("{host}:{port}"),
            source,
        })?;
    let data = nfc::capture(host, arguments.nfc_port).map_err(|source| Failure::Data {
        address: format!("{host}:{}", arguments.nfc_port),
        source,
    })?;
    let presented = [(*port, management), (arguments.nfc_port, data)];
    let transcript = Transcript::new(arguments.verbose);
    for (port, presented) in &presented {
        transcript.tls(&port.to_string(), presented.version, presented.suite);
    }
    let mut stdout = io::stdout().lock();
    for (port, presented) in &presented {
        writeln!(
            stdout,
            "{port} sha256 {}",
            tls::sha256(&presented.certificate)
        )
        .map_err(Failure::Stdout)?;
        writeln!(stdout, "{port} sha1 {}", tls::sha1(&presented.certificate))
            .map_err(Failure::Stdout)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serve_takes_the_nfc_transport_and_verbose_from_the_flags() {
        let cli = Cli::try_parse_from([
            "vectura",
            "serve",
            "--host",
            "esxi.example",
            "--user",
            "root",
            "--vm-id",
            "3",
            "--disk",
            "d",
            "--transport",
            "nfc",
            "--verbose",
        ])
        .unwrap();
        let Command::Serve(serve) = cli.command else {
            panic!("serve was parsed");
        };
        assert_eq!(serve.transport, nfc::Transport::Nfc);
        assert!(serve.verbose);
    }

    #[test]
    fn the_data_port_defaults_to_902_and_verbose_is_off() {
        let cli =
            Cli::try_parse_from(["vectura", "fingerprint", "--host", "esxi.example"]).unwrap();
        let Command::Fingerprint(fingerprint) = cli.command else {
            panic!("fingerprint was parsed");
        };
        assert_eq!((fingerprint.host.port, fingerprint.nfc_port), (443, 902));
        assert!(!fingerprint.verbose);
    }

    #[test]
    fn serve_takes_its_target_from_the_flags_and_pins_with_a_prefixed_thumbprint() {
        let cli = Cli::try_parse_from([
            "vectura",
            "serve",
            "--host",
            "esxi.example:8443",
            "--user",
            "root",
            "--vm-id",
            "3",
            "--disk",
            "[datastore1] vm/vm.vmdk",
            "--thumbprint",
            &format!("sha256:{}", "ab".repeat(32)),
        ])
        .unwrap();
        let Command::Serve(serve) = cli.command else {
            panic!("serve was parsed");
        };
        assert_eq!(
            (serve.host.host.as_str(), serve.host.port),
            ("esxi.example", 8443)
        );
        assert_eq!((serve.user.as_str(), serve.vm_id.as_str()), ("root", "3"));
        assert_eq!(serve.disk, "[datastore1] vm/vm.vmdk");
        assert!(serve.thumbprint.is_some());
        assert!(matches!(trust(&serve), Ok(tls::Trust::Pin(_))));
        assert_eq!(serve.transport, nfc::Transport::Nfcssl);
        assert!(!serve.verbose);
    }

    #[test]
    fn a_thumbprint_without_the_sha256_prefix_or_with_bad_hex_is_refused() {
        let error = parse_thumbprint(&"ab".repeat(32)).unwrap_err();
        assert!(error.ends_with("does not start with sha256:"), "{error}");
        let error = parse_thumbprint("sha256:zz").unwrap_err();
        assert!(
            error.ends_with("is not a sha256 thumbprint of 64 hex digits"),
            "{error}"
        );
    }

    #[test]
    fn thumbprint_and_ca_file_together_are_a_usage_error() {
        let error = Cli::try_parse_from([
            "vectura",
            "serve",
            "--host",
            "h",
            "--user",
            "u",
            "--vm-id",
            "1",
            "--disk",
            "d",
            "--thumbprint",
            &format!("sha256:{}", "ab".repeat(32)),
            "--ca-file",
            "roots.pem",
        ])
        .unwrap_err();
        assert!(error.use_stderr());
    }

    #[test]
    fn the_compression_defaults_to_skipz_and_takes_zlib_or_none() {
        let base = [
            "vectura", "serve", "--host", "h", "--user", "u", "--vm-id", "1", "--disk", "d",
        ];
        let Command::Serve(serve) = Cli::try_parse_from(base).unwrap().command else {
            panic!("serve was parsed");
        };
        assert_eq!(serve.compression, disk::Compression::Skipz);
        for (name, expected) in [
            ("skipz", Some(disk::Compression::Skipz)),
            ("zlib", Some(disk::Compression::Zlib)),
            ("none", Some(disk::Compression::None)),
            ("gzip", None),
        ] {
            let mut args = base.to_vec();
            args.extend(["--compression", name]);
            let parsed = Cli::try_parse_from(args)
                .ok()
                .and_then(|cli| match cli.command {
                    Command::Serve(serve) => Some(serve.compression),
                    Command::Fingerprint(_) => None,
                });
            assert_eq!(parsed, expected, "--compression {name}");
        }
    }

    #[test]
    fn the_depth_defaults_to_sixteen_and_takes_one_to_thirty_two() {
        let base = [
            "vectura", "serve", "--host", "h", "--user", "u", "--vm-id", "1", "--disk", "d",
        ];
        let Command::Serve(serve) = Cli::try_parse_from(base).unwrap().command else {
            panic!("serve was parsed");
        };
        assert_eq!(serve.depth.get(), 16);
        for (depth, accepted) in [("1", true), ("32", true), ("0", false), ("33", false)] {
            let mut args = base.to_vec();
            args.extend(["--depth", depth]);
            let parsed = Cli::try_parse_from(args);
            assert_eq!(parsed.is_ok(), accepted, "--depth {depth}");
            if let Ok(Cli {
                command: Command::Serve(serve),
            }) = parsed
            {
                assert_eq!(serve.depth.to_string(), depth);
            }
        }
    }

    fn serve_with(ca_file: Option<PathBuf>) -> Serve {
        Serve {
            host: parse_host("esxi.example").unwrap(),
            user: "root".to_owned(),
            vm_id: "3".to_owned(),
            disk: "[ds] vm.vmdk".to_owned(),
            thumbprint: None,
            ca_file,
            depth: parse_depth(DEFAULT_DEPTH).unwrap(),
            compression: disk::Compression::Skipz,
            transport: nfc::Transport::Nfcssl,
            verbose: false,
        }
    }

    #[test]
    fn an_empty_password_is_a_usage_error_like_a_missing_one() {
        let usage = ExitCode::from(EXIT_USAGE);
        assert_eq!(serve_command(&serve_with(None), Ok(String::new())), usage);
        assert_eq!(
            serve_command(&serve_with(None), Err(VarError::NotPresent)),
            usage
        );
    }

    #[test]
    fn without_a_pin_or_a_bundle_the_system_roots_apply() {
        assert!(matches!(trust(&serve_with(None)), Ok(tls::Trust::System)));
    }

    #[test]
    fn an_unreadable_ca_file_is_refused_naming_it() {
        let error = trust(&serve_with(Some(PathBuf::from("/nonexistent/roots.pem")))).unwrap_err();
        assert!(
            error.starts_with("cannot read /nonexistent/roots.pem: "),
            "{error}"
        );
    }

    #[test]
    fn a_pem_bundle_yields_its_certificates_and_a_broken_one_is_refused() {
        let directory = std::env::temp_dir().join(format!("vectura-cli-{}", std::process::id()));
        std::fs::create_dir_all(&directory).unwrap();
        // The PEM reader does not check the DER inside, so two tiny blocks do.
        let block = "-----BEGIN CERTIFICATE-----\nMAA=\n-----END CERTIFICATE-----\n";
        let bundle = directory.join("roots.pem");
        std::fs::write(&bundle, [block, block].concat()).unwrap();
        let Ok(tls::Trust::Anchors(anchors)) = trust(&serve_with(Some(bundle))) else {
            panic!("the bundle was read");
        };
        assert_eq!(anchors.len(), 2);

        let broken = directory.join("broken.pem");
        std::fs::write(
            &broken,
            "-----BEGIN CERTIFICATE-----\nnot base64\n-----END CERTIFICATE-----\n",
        )
        .unwrap();
        let error = trust(&serve_with(Some(broken))).unwrap_err();
        assert!(error.contains("cannot parse"), "{error}");
        std::fs::remove_dir_all(&directory).unwrap();
    }

    #[test]
    fn a_host_without_a_port_gets_the_management_port() {
        let parsed = parse_host("esxi.example").unwrap();
        assert_eq!((parsed.host.as_str(), parsed.port), ("esxi.example", 443));
    }

    #[test]
    fn a_host_with_a_port_keeps_it() {
        let parsed = parse_host("esxi.example:8443").unwrap();
        assert_eq!((parsed.host.as_str(), parsed.port), ("esxi.example", 8443));
        let parsed = parse_host("192.0.2.10:443").unwrap();
        assert_eq!((parsed.host.as_str(), parsed.port), ("192.0.2.10", 443));
    }

    #[test]
    fn a_bare_ipv6_address_is_a_host_with_the_default_port() {
        let parsed = parse_host("2001:db8::10").unwrap();
        assert_eq!((parsed.host.as_str(), parsed.port), ("2001:db8::10", 443));
    }

    #[test]
    fn an_unparsable_port_or_host_is_refused_with_the_offending_text() {
        let error = parse_host("esxi.example:notaport").unwrap_err();
        assert!(error.starts_with("invalid port \"notaport\": "), "{error}");
        let error = parse_host("esxi.example:70000").unwrap_err();
        assert!(error.starts_with("invalid port \"70000\": "), "{error}");
        let error = parse_host("not a host:443").unwrap_err();
        assert!(
            error.starts_with("invalid host \"not a host\": "),
            "{error}"
        );
        let error = parse_host("").unwrap_err();
        assert!(error.starts_with("invalid host \"\": "), "{error}");
    }
}
