//! The HTTP/1.1 client under the management plane: one request, one response.
//!
//! Every request is a `POST /sdk` with `Connection: close`, so a response is
//! read up to its `Content-Length`, through its chunked encoding, or to the
//! close. No redirects, no compression, no keep-alive.

use std::io::{self, BufRead, BufReader, Read};

use crate::tls;

/// Longest status or header line accepted; real ones are under 200 bytes.
const MAX_LINE_LEN: usize = 8192;

/// Most headers accepted, so a host cannot grow the list without bound.
const MAX_HEADERS: usize = 64;

/// Largest body accepted. A SOAP reply is a few KiB; a `Content-Length`
/// beyond this is refused before anything is allocated.
pub const MAX_BODY_LEN: usize = 1 << 20;

/// Errors reading a response.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// A read or write failed or timed out.
    #[error("{}", tls::describe(.0))]
    Io(#[from] io::Error),
    /// The host closed the connection before the response was complete.
    #[error("the host closed the connection before the response was complete")]
    Closed,
    /// The response does not parse as HTTP/1.1.
    #[error("malformed response: {0}")]
    Malformed(&'static str),
    /// The response body exceeds [`MAX_BODY_LEN`].
    #[error("the response body exceeds {MAX_BODY_LEN} bytes")]
    TooLarge,
}

/// A response: its status code, its headers in order, and its body.
#[derive(Debug, PartialEq, Eq)]
pub struct Response {
    /// The three-digit status code.
    pub status: u16,
    /// Header names and values, trimmed, in the order received.
    pub headers: Vec<(String, String)>,
    /// The body, decoded from its transfer encoding.
    pub body: Vec<u8>,
}

impl Response {
    /// The value of the first header named `name`, compared case-insensitively.
    #[must_use]
    pub fn header(&self, name: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(candidate, _)| candidate.eq_ignore_ascii_case(name))
            .map(|(_, value)| value.as_str())
    }
}

/// Builds a `POST /sdk` request carrying `body`, and `cookie` when there is one.
#[must_use]
pub fn request(host: &str, port: u16, cookie: Option<&str>, body: &[u8]) -> Vec<u8> {
    let authority = match (host.contains(':'), port) {
        (true, 443) => format!("[{host}]"),
        (true, _) => format!("[{host}]:{port}"),
        (false, 443) => host.to_owned(),
        (false, _) => format!("{host}:{port}"),
    };
    let cookie = cookie
        .map(|cookie| format!("Cookie: {cookie}\r\n"))
        .unwrap_or_default();
    let head = format!(
        "POST /sdk HTTP/1.1\r\n\
         Host: {authority}\r\n\
         Content-Type: text/xml; charset=utf-8\r\n\
         SOAPAction: \"urn:vim25\"\r\n\
         Connection: close\r\n\
         Content-Length: {}\r\n\
         {cookie}\r\n",
        body.len()
    );
    let mut bytes = head.into_bytes();
    bytes.extend_from_slice(body);
    bytes
}

/// Reads one response from `reader`.
///
/// # Errors
/// When the read fails, the host closes early, the head does not parse, or
/// the body is longer than [`MAX_BODY_LEN`].
pub fn read_response<R: Read>(reader: R) -> Result<Response, Error> {
    let mut reader = BufReader::new(reader);
    let status_line = line(&mut reader)?;
    let status = status_line
        .strip_prefix("HTTP/1.")
        .and_then(|rest| rest.split(' ').nth(1))
        .and_then(|code| code.parse().ok())
        .ok_or(Error::Malformed("status line"))?;
    let mut headers = Vec::new();
    loop {
        let text = line(&mut reader)?;
        if text.is_empty() {
            break;
        }
        if headers.len() == MAX_HEADERS {
            return Err(Error::Malformed("too many headers"));
        }
        let (name, value) = text.split_once(':').ok_or(Error::Malformed("header"))?;
        headers.push((name.trim().to_owned(), value.trim().to_owned()));
    }
    let mut response = Response {
        status,
        headers,
        body: Vec::new(),
    };
    let chunked = response
        .header("Transfer-Encoding")
        .is_some_and(|encoding| encoding.eq_ignore_ascii_case("chunked"));
    response.body = if chunked {
        chunks(&mut reader)?
    } else if let Some(length) = response.header("Content-Length") {
        let length = length
            .parse()
            .map_err(|_error| Error::Malformed("content length"))?;
        sized(&mut reader, length)?
    } else {
        rest(&mut reader)?
    };
    Ok(response)
}

/// Reads one line without its line end; empty means the blank line ending the head.
fn line<R: BufRead>(reader: &mut R) -> Result<String, Error> {
    let mut bytes = Vec::new();
    let read = reader
        .by_ref()
        .take(MAX_LINE_LEN as u64)
        .read_until(b'\n', &mut bytes)?;
    if read == 0 {
        return Err(Error::Closed);
    }
    if bytes.last() != Some(&b'\n') {
        return Err(if bytes.len() >= MAX_LINE_LEN {
            Error::Malformed("line too long")
        } else {
            Error::Closed
        });
    }
    let text = String::from_utf8_lossy(&bytes);
    Ok(text.trim_end_matches(['\r', '\n']).to_owned())
}

/// Reads exactly `length` bytes of body.
fn sized<R: Read>(reader: &mut R, length: usize) -> Result<Vec<u8>, Error> {
    if length > MAX_BODY_LEN {
        return Err(Error::TooLarge);
    }
    let mut body = vec![0_u8; length];
    reader.read_exact(&mut body).map_err(closed)?;
    Ok(body)
}

/// Reads a chunked body: hex sizes, chunks, then the terminating empty chunk.
fn chunks<R: BufRead>(reader: &mut R) -> Result<Vec<u8>, Error> {
    let mut body = Vec::new();
    loop {
        let size_line = line(reader)?;
        let size = size_line.split(';').next().unwrap_or_default().trim();
        let size =
            usize::from_str_radix(size, 16).map_err(|_error| Error::Malformed("chunk size"))?;
        if size == 0 {
            while !line(reader)?.is_empty() {}
            return Ok(body);
        }
        if body.len().saturating_add(size) > MAX_BODY_LEN {
            return Err(Error::TooLarge);
        }
        body.extend_from_slice(&sized(reader, size)?);
        if !line(reader)?.is_empty() {
            return Err(Error::Malformed("chunk end"));
        }
    }
}

/// Reads the body up to the close, which may come without a TLS close notify.
fn rest<R: Read>(reader: &mut R) -> Result<Vec<u8>, Error> {
    let mut body = Vec::new();
    match reader.take(MAX_BODY_LEN as u64 + 1).read_to_end(&mut body) {
        Ok(_) | Err(_) if body.len() > MAX_BODY_LEN => Err(Error::TooLarge),
        Ok(_) => Ok(body),
        Err(error) if error.kind() == io::ErrorKind::UnexpectedEof => Ok(body),
        Err(error) => Err(Error::Io(error)),
    }
}

/// Maps the end of the stream inside a body to [`Error::Closed`].
fn closed(error: io::Error) -> Error {
    match error.kind() {
        io::ErrorKind::UnexpectedEof => Error::Closed,
        _ => Error::Io(error),
    }
}

#[cfg(test)]
mod tests {
    use std::io::Cursor;

    use super::*;

    #[test]
    fn a_request_posts_to_sdk_with_the_soap_headers_and_the_body_length() {
        let bytes = request("esxi.test", 443, None, b"<x/>");

        assert_eq!(
            String::from_utf8(bytes).unwrap(),
            "POST /sdk HTTP/1.1\r\n\
             Host: esxi.test\r\n\
             Content-Type: text/xml; charset=utf-8\r\n\
             SOAPAction: \"urn:vim25\"\r\n\
             Connection: close\r\n\
             Content-Length: 4\r\n\
             \r\n\
             <x/>"
        );
    }

    #[test]
    fn a_request_carries_the_cookie_verbatim_and_the_port_when_not_443() {
        let text =
            |host, port, cookie| String::from_utf8(request(host, port, cookie, b"")).unwrap();

        let with_cookie = text("2001:db8::10", 8443, Some("vmware_soap_session=\"x\""));
        assert!(
            with_cookie.contains("Host: [2001:db8::10]:8443\r\n"),
            "{with_cookie}"
        );
        assert!(
            with_cookie.contains("\r\nCookie: vmware_soap_session=\"x\"\r\n\r\n"),
            "{with_cookie}"
        );
        assert!(text("2001:db8::10", 443, None).contains("Host: [2001:db8::10]\r\n"));
        assert!(text("esxi.test", 8443, None).contains("Host: esxi.test:8443\r\n"));
    }

    #[test]
    fn a_response_with_a_content_length_stops_at_that_length() {
        let bytes =
            b"HTTP/1.1 200 OK\r\nContent-Type: text/xml\r\ncontent-length: 5\r\n\r\nhelloEXTRA";

        let response = read_response(Cursor::new(bytes)).unwrap();

        assert_eq!(response.status, 200);
        assert_eq!(response.header("CONTENT-TYPE"), Some("text/xml"));
        assert_eq!(response.body, b"hello");
    }

    #[test]
    fn a_chunked_response_is_reassembled_without_its_sizes_and_trailers() {
        let bytes = b"HTTP/1.1 500 Internal Server Error\r\nTransfer-Encoding: chunked\r\n\r\n\
                      3;ext=1\r\nabc\r\n2\r\nde\r\n0\r\nTrailer: x\r\n\r\n";

        let response = read_response(Cursor::new(bytes)).unwrap();

        assert_eq!(response.status, 500);
        assert_eq!(response.body, b"abcde");
    }

    #[test]
    fn a_response_without_framing_runs_to_the_close() {
        let bytes = b"HTTP/1.0 200 OK\r\n\r\nall of it";

        let response = read_response(Cursor::new(bytes)).unwrap();

        assert_eq!(response.body, b"all of it");
    }

    /// A stream that fails with `kind` where it would report its end.
    struct Failing(Cursor<Vec<u8>>, io::ErrorKind);

    impl Read for Failing {
        fn read(&mut self, buffer: &mut [u8]) -> io::Result<usize> {
            match self.0.read(buffer)? {
                0 => Err(io::Error::from(self.1)),
                read => Ok(read),
            }
        }
    }

    fn failing(bytes: &[u8], kind: io::ErrorKind) -> Failing {
        Failing(Cursor::new(bytes.to_vec()), kind)
    }

    #[test]
    fn a_close_without_tls_close_notify_still_ends_an_unframed_body() {
        let stream = failing(b"HTTP/1.1 200 OK\r\n\r\nbody", io::ErrorKind::UnexpectedEof);

        let response = read_response(stream).unwrap();

        assert_eq!(response.body, b"body");
    }

    #[test]
    fn a_read_error_inside_an_unframed_body_is_reported_not_taken_for_the_close() {
        let stream = failing(
            b"HTTP/1.1 200 OK\r\n\r\nbody",
            io::ErrorKind::ConnectionReset,
        );

        let error = read_response(stream).unwrap_err();

        assert!(
            matches!(error, Error::Io(ref inner) if inner.kind() == io::ErrorKind::ConnectionReset),
            "{error:?}"
        );
    }

    #[test]
    fn a_body_of_exactly_the_limit_is_accepted_under_every_framing() {
        let body = vec![b'x'; MAX_BODY_LEN];

        let mut sized =
            format!("HTTP/1.1 200 OK\r\nContent-Length: {MAX_BODY_LEN}\r\n\r\n").into_bytes();
        sized.extend_from_slice(&body);
        assert_eq!(read_response(Cursor::new(sized)).unwrap().body, body);

        let mut chunked =
            format!("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n{MAX_BODY_LEN:x}\r\n")
                .into_bytes();
        chunked.extend_from_slice(&body);
        chunked.extend_from_slice(b"\r\n0\r\n\r\n");
        assert_eq!(read_response(Cursor::new(chunked)).unwrap().body, body);

        let mut unframed = b"HTTP/1.1 200 OK\r\n\r\n".to_vec();
        unframed.extend_from_slice(&body);
        assert_eq!(read_response(Cursor::new(unframed)).unwrap().body, body);
    }

    #[test]
    fn a_body_cut_short_of_its_content_length_is_a_closed_connection() {
        let bytes = b"HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nshort";

        let error = read_response(Cursor::new(bytes)).unwrap_err();

        assert!(matches!(error, Error::Closed), "{error:?}");
    }

    #[test]
    fn a_status_line_that_is_not_http_is_malformed() {
        let error = read_response(Cursor::new(b"220 hello\r\n\r\n")).unwrap_err();

        assert_eq!(error.to_string(), "malformed response: status line");
    }

    #[test]
    fn a_header_without_a_colon_is_malformed() {
        let error = read_response(Cursor::new(b"HTTP/1.1 200 OK\r\nnocolon\r\n\r\n")).unwrap_err();

        assert_eq!(error.to_string(), "malformed response: header");
    }

    #[test]
    fn a_content_length_beyond_the_limit_is_refused_before_reading_the_body() {
        let bytes = format!(
            "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n",
            MAX_BODY_LEN + 1
        );

        let error = read_response(Cursor::new(bytes.into_bytes())).unwrap_err();

        assert_eq!(error.to_string(), "the response body exceeds 1048576 bytes");
    }

    #[test]
    fn chunks_summing_beyond_the_limit_and_a_bad_chunk_size_are_refused() {
        let mut bytes =
            format!("HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n{MAX_BODY_LEN:x}\r\n")
                .into_bytes();
        bytes.resize(bytes.len() + MAX_BODY_LEN, b'x');
        bytes.extend_from_slice(b"\r\n1\r\nx\r\n0\r\n\r\n");
        let error = read_response(Cursor::new(bytes)).unwrap_err();
        assert!(matches!(error, Error::TooLarge), "{error:?}");

        let bytes = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\nzz\r\n";
        let error = read_response(Cursor::new(bytes)).unwrap_err();
        assert_eq!(error.to_string(), "malformed response: chunk size");

        let bytes = b"HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n2\r\nabXX\r\n0\r\n\r\n";
        let error = read_response(Cursor::new(bytes)).unwrap_err();
        assert_eq!(error.to_string(), "malformed response: chunk end");
    }

    #[test]
    fn an_unframed_body_beyond_the_limit_is_refused() {
        let mut bytes = b"HTTP/1.1 200 OK\r\n\r\n".to_vec();
        bytes.resize(bytes.len() + MAX_BODY_LEN + 1, b'x');

        let error = read_response(Cursor::new(bytes)).unwrap_err();

        assert!(matches!(error, Error::TooLarge), "{error:?}");
    }

    #[test]
    fn a_line_without_an_end_within_the_limit_and_too_many_headers_are_malformed() {
        let bytes = vec![b'x'; MAX_LINE_LEN + 1];
        let error = read_response(Cursor::new(bytes)).unwrap_err();
        assert_eq!(error.to_string(), "malformed response: line too long");

        let mut bytes = b"HTTP/1.1 200 OK\r\n".to_vec();
        for _ in 0..=MAX_HEADERS {
            bytes.extend_from_slice(b"X: y\r\n");
        }
        let error = read_response(Cursor::new(bytes)).unwrap_err();
        assert_eq!(error.to_string(), "malformed response: too many headers");
    }

    #[test]
    fn an_empty_stream_or_a_head_cut_mid_line_is_a_closed_connection() {
        let error = read_response(Cursor::new(b"HTTP/1.1 200 OK\r\nContent-Le")).unwrap_err();
        assert!(matches!(error, Error::Closed), "{error:?}");

        let error = read_response(Cursor::new(b"")).unwrap_err();

        assert_eq!(
            error.to_string(),
            "the host closed the connection before the response was complete"
        );
    }
}
