//! The `vectura` command-line entry point.

use std::process::ExitCode;

fn main() -> ExitCode {
    vectura::cli::run(std::env::args_os())
}
