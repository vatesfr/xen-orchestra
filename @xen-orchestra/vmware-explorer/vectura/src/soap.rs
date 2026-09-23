//! The management plane: the vSphere API calls that yield a data-port ticket.
//!
//! Five calls, each a `POST /sdk` over its own TLS connection with a SOAP
//! envelope in the `urn:vim25` namespace: `RetrieveServiceContent`, `Login`,
//! `RetrieveInternalContent`, `NfcGetVmFiles` and `Logout`. The session
//! cookie the `Login` response sets is echoed verbatim on every later call.

pub mod http;

use std::fmt;
use std::io::Write;
use std::time::Instant;

use quick_xml::escape::{escape, resolve_predefined_entity};
use quick_xml::events::Event;
use rustls::Stream;

use crate::tls;
use crate::transcript::Transcript;

/// The `apiType` an ESXi host reports in its service content.
///
/// A vCenter server reports `VirtualCenter` instead, and its NFC service does
/// not hand out tickets for the host's disks, so it is refused before login.
const HOST_AGENT: &str = "HostAgent";

/// The managed object the service content is retrieved from.
const SERVICE_INSTANCE: &str = "ServiceInstance";

/// Errors from the management plane, each naming the call that raised it.
#[derive(Debug, thiserror::Error)]
pub enum Error {
    /// Connecting to the management port or its TLS handshake failed.
    #[error(transparent)]
    Tls(#[from] tls::Error),
    /// The HTTP exchange of a call failed.
    #[error("{call}: {source}")]
    Http {
        /// The call being made.
        call: &'static str,
        /// What went wrong on the wire.
        #[source]
        source: http::Error,
    },
    /// The host answered a call with a SOAP fault.
    #[error("{call}: the host answered: {text}")]
    Fault {
        /// The call being made.
        call: &'static str,
        /// The fault string, as the host wrote it.
        text: String,
    },
    /// The host answered a call with an HTTP status other than 200 and no fault.
    #[error("{call}: the host answered with HTTP status {status}")]
    Status {
        /// The call being made.
        call: &'static str,
        /// The status code.
        status: u16,
    },
    /// A reply lacks an element the call needs.
    #[error("{call}: the reply has no {element} element")]
    Missing {
        /// The call being made.
        call: &'static str,
        /// The element that should have been there.
        element: &'static str,
    },
    /// A reply element holds text of the wrong shape.
    #[error("NfcGetVmFiles: the {element} element holds {text:?}, {reason}")]
    Invalid {
        /// The element concerned.
        element: &'static str,
        /// Its text.
        text: String,
        /// What was expected of it.
        reason: String,
    },
    /// The management port belongs to a vCenter server, not an ESXi host.
    #[error("{name} is not an ESXi host (apiType {api_type}); connect to the host directly")]
    NotHost {
        /// The product's full name, as the service content reports it.
        name: String,
        /// The `apiType` reported.
        api_type: String,
    },
    /// The `Login` response set no cookie to carry the session.
    #[error("Login: the host set no session cookie")]
    NoCookie,
}

/// The operator's password, read once from the environment.
///
/// Its `Debug` rendering never shows the value.
#[derive(Clone)]
pub struct Password(String);

impl Password {
    /// Wraps the password.
    #[must_use]
    pub fn new(text: String) -> Password {
        Password(text)
    }
}

impl fmt::Debug for Password {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Password(<redacted>)")
    }
}

/// The session cookie the `Login` response set, echoed verbatim.
///
/// Its `Debug` rendering never shows the value.
#[derive(Clone)]
struct Cookie(String);

impl fmt::Debug for Cookie {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Cookie(<redacted>)")
    }
}

/// A data-port ticket, as `NfcGetVmFiles` hands it out.
///
/// The secret is the ticket itself: an opaque bearer credential with an
/// expiry and a use count. It is never validated for shape, and the `Debug`
/// rendering never shows it.
#[derive(Clone)]
pub struct Ticket {
    /// The data port to connect to.
    pub port: u16,
    /// The SHA-1 thumbprint of the certificate the data port presents.
    pub thumbprint: tls::Pin,
    /// The ticket itself, presented in the data-port dialogue.
    pub secret: String,
}

impl fmt::Debug for Ticket {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("Ticket")
            .field("port", &self.port)
            .field("thumbprint", &self.thumbprint)
            .field("secret", &"<redacted>")
            .finish()
    }
}

/// A logged-in management session.
#[derive(Debug)]
pub struct Session {
    host: String,
    port: u16,
    client: tls::Client,
    manager: String,
    cookie: Cookie,
    transcript: Transcript,
}

impl Session {
    /// Retrieves the service content, refuses a vCenter, and logs in.
    ///
    /// # Errors
    /// When a call fails, the host is not an ESXi host, or the host refuses
    /// the credentials.
    pub fn login(
        host: &str,
        port: u16,
        trust: &tls::Trust,
        user: &str,
        password: &Password,
        transcript: Transcript,
    ) -> Result<Session, Error> {
        let client = tls::Client::new(trust)?;
        let content = call(
            host,
            port,
            &client,
            None,
            "RetrieveServiceContent",
            &this(SERVICE_INSTANCE, SERVICE_INSTANCE),
            transcript,
        )?;
        let manager = service_content(&String::from_utf8_lossy(&content.body))?;
        let inner = format!(
            "{}<userName>{}</userName><password>{}</password>",
            this("SessionManager", &manager),
            escape(user),
            escape(password.0.as_str())
        );
        let response = call(host, port, &client, None, "Login", &inner, transcript)?;
        let cookie = response
            .header("Set-Cookie")
            .map(|value| {
                value
                    .split(';')
                    .next()
                    .unwrap_or_default()
                    .trim()
                    .to_owned()
            })
            .filter(|value| !value.is_empty())
            .ok_or(Error::NoCookie)?;
        Ok(Session {
            host: host.to_owned(),
            port,
            client,
            manager,
            cookie: Cookie(cookie),
            transcript,
        })
    }

    /// Asks the NFC service for a fresh ticket to the files of the VM `vm_id` names.
    ///
    /// # Errors
    /// When a call fails or the reply lacks a field.
    pub fn ticket(&self, vm_id: &str) -> Result<Ticket, Error> {
        let content = self.call(
            "RetrieveInternalContent",
            &this(SERVICE_INSTANCE, SERVICE_INSTANCE),
        )?;
        let service = element(&content, "nfcService").ok_or(Error::Missing {
            call: "RetrieveInternalContent",
            element: "nfcService",
        })?;
        let inner = format!(
            "{}<vm type=\"VirtualMachine\">{}</vm>",
            this("NfcService", &service),
            escape(vm_id)
        );
        ticket(&self.call("NfcGetVmFiles", &inner)?)
    }

    /// Logs the session out; the host forgets the cookie.
    ///
    /// # Errors
    /// When the call fails, which after a long session may mean it had
    /// already expired.
    pub fn logout(self) -> Result<(), Error> {
        self.call("Logout", &this("SessionManager", &self.manager))?;
        Ok(())
    }

    fn call(&self, name: &'static str, inner: &str) -> Result<String, Error> {
        let response = call(
            &self.host,
            self.port,
            &self.client,
            Some(&self.cookie),
            name,
            inner,
            self.transcript,
        )?;
        Ok(String::from_utf8_lossy(&response.body).into_owned())
    }
}

/// Makes one call on its own TLS connection and returns the checked response.
fn call(
    host: &str,
    port: u16,
    client: &tls::Client,
    cookie: Option<&Cookie>,
    name: &'static str,
    inner: &str,
    transcript: Transcript,
) -> Result<http::Response, Error> {
    let started = Instant::now();
    let wire = |source| Error::Http { call: name, source };
    let mut stream = tls::connect(host, port)?;
    let mut session = client.handshake(&mut stream, host)?;
    let mut tls = Stream::new(&mut session, &mut stream);
    let body = envelope(name, inner);
    let request = http::request(
        host,
        port,
        cookie.map(|cookie| cookie.0.as_str()),
        body.as_bytes(),
    );
    tls.write_all(&request)
        .and_then(|()| tls.flush())
        .map_err(|error| wire(http::Error::Io(error)))?;
    let response = http::read_response(&mut tls).map_err(wire)?;
    transcript.call(name, response.status, started.elapsed());
    let text = String::from_utf8_lossy(&response.body);
    if let Some(text) = element(&text, "faultstring") {
        return Err(Error::Fault { call: name, text });
    }
    if response.status != 200 {
        return Err(Error::Status {
            call: name,
            status: response.status,
        });
    }
    Ok(response)
}

/// Wraps the operation `name` and its `inner` elements in a SOAP envelope.
fn envelope(name: &str, inner: &str) -> String {
    format!(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
         <soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\">\
         <soapenv:Body><{name} xmlns=\"urn:vim25\">{inner}</{name}></soapenv:Body>\
         </soapenv:Envelope>"
    )
}

/// The `_this` element naming the managed object a call is made on.
fn this(kind: &str, reference: &str) -> String {
    format!("<_this type=\"{kind}\">{}</_this>", escape(reference))
}

/// Checks the service content describes an ESXi host and returns its session manager.
fn service_content(content: &str) -> Result<String, Error> {
    let call = "RetrieveServiceContent";
    let api_type = element(content, "apiType").ok_or(Error::Missing {
        call,
        element: "apiType",
    })?;
    if api_type != HOST_AGENT {
        return Err(Error::NotHost {
            name: element(content, "fullName").unwrap_or_default(),
            api_type,
        });
    }
    element(content, "sessionManager").ok_or(Error::Missing {
        call,
        element: "sessionManager",
    })
}

/// Reads the ticket out of an `NfcGetVmFiles` reply.
fn ticket(reply: &str) -> Result<Ticket, Error> {
    let field = |element| {
        self::element(reply, element).ok_or(Error::Missing {
            call: "NfcGetVmFiles",
            element,
        })
    };
    let port = field("port")?;
    let thumbprint = field("sslThumbprint")?;
    Ok(Ticket {
        port: port.parse().map_err(|error| Error::Invalid {
            element: "port",
            text: port.clone(),
            reason: format!("not a port: {error}"),
        })?,
        thumbprint: tls::Pin::sha1(&thumbprint).map_err(|error| Error::Invalid {
            element: "sslThumbprint",
            text: thumbprint.clone(),
            reason: error.to_string(),
        })?,
        secret: field("sessionId")?,
    })
}

/// The text of the first element named `name`, whatever its namespace prefix.
fn element(xml: &str, name: &str) -> Option<String> {
    let mut reader = quick_xml::Reader::from_str(xml);
    let mut inside = false;
    let mut text = String::new();
    loop {
        let event = reader.read_event().ok()?;
        if event == Event::Eof {
            return None;
        }
        match event {
            Event::Start(start) if start.local_name().as_ref() == name => inside = true,
            Event::End(_) if inside => return Some(text),
            Event::Text(content) if inside => text.push_str(&content.xml10_content()),
            Event::CData(content) if inside => text.push_str(&content.xml10_content()),
            Event::GeneralRef(reference) if inside => match reference.resolve_char_ref() {
                Ok(Some(character)) => text.push(character),
                _ => text.push_str(resolve_predefined_entity(&reference).unwrap_or_default()),
            },
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SERVICE_CONTENT: &str = "<soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\">\
        <soapenv:Body><RetrieveServiceContentResponse xmlns=\"urn:vim25\"><returnval>\
        <rootFolder type=\"Folder\">ha-folder-root</rootFolder>\
        <about><name>VMware ESXi</name><fullName>VMware ESXi 8.0.1 build-21495797</fullName>\
        <apiType>HostAgent</apiType></about>\
        <sessionManager type=\"SessionManager\">ha-sessionmgr</sessionManager>\
        </returnval></RetrieveServiceContentResponse></soapenv:Body></soapenv:Envelope>";

    const TICKET: &str = "<returnval><port>902</port>\
        <sslThumbprint>A9:99:3E:36:47:06:81:6A:BA:3E:25:71:78:50:C2:6C:9C:D0:D8:9D</sslThumbprint>\
        <service>nfc</service><serviceVersion>1.1</serviceVersion>\
        <sessionId>00000000-mock-ticket-000000000000</sessionId></returnval>";

    #[test]
    fn the_password_never_appears_in_a_debug_rendering() {
        let password = Password::new("hunter2".to_owned());

        let rendered = format!("{password:?}");

        assert!(!rendered.contains("hunter2"), "{rendered}");
        assert_eq!(rendered, "Password(<redacted>)");
    }

    #[test]
    fn the_cookie_never_appears_in_a_debug_rendering_of_a_session() {
        let session = Session {
            host: "esxi.test".to_owned(),
            port: 443,
            client: tls::Client::new(&tls::Trust::Pin(
                tls::Pin::sha256(&"ab".repeat(32)).unwrap(),
            ))
            .unwrap(),
            manager: "ha-sessionmgr".to_owned(),
            cookie: Cookie("vmware_soap_session=\"mock-cookie\"".to_owned()),
            transcript: Transcript::new(false),
        };

        let rendered = format!("{session:?}");

        assert!(!rendered.contains("mock-cookie"), "{rendered}");
        assert!(rendered.contains("Cookie(<redacted>)"), "{rendered}");
    }

    #[test]
    fn the_ticket_reply_yields_port_thumbprint_and_secret() {
        let ticket = ticket(TICKET).unwrap();

        assert_eq!(ticket.port, 902);
        assert_eq!(
            ticket.thumbprint.to_string(),
            "sha1:A9:99:3E:36:47:06:81:6A:BA:3E:25:71:78:50:C2:6C:9C:D0:D8:9D"
        );
        assert_eq!(ticket.secret, "00000000-mock-ticket-000000000000");
    }

    #[test]
    fn the_secret_never_appears_in_a_debug_rendering_of_the_ticket() {
        let rendered = format!("{:?}", ticket(TICKET).unwrap());

        assert!(!rendered.contains("mock-ticket"), "{rendered}");
        assert!(rendered.contains("secret: \"<redacted>\""), "{rendered}");
    }

    #[test]
    fn a_ticket_reply_missing_a_field_names_it() {
        let error = ticket("<returnval><port>902</port></returnval>").unwrap_err();

        assert_eq!(
            error.to_string(),
            "NfcGetVmFiles: the reply has no sslThumbprint element"
        );
    }

    #[test]
    fn a_ticket_with_a_bad_port_or_thumbprint_quotes_the_text() {
        let reply = TICKET.replace("902", "port-902");
        let error = ticket(&reply).unwrap_err();
        assert!(
            error
                .to_string()
                .starts_with("NfcGetVmFiles: the port element holds \"port-902\", not a port: "),
            "{error}"
        );

        let reply = TICKET.replace("A9:99:3E", "zz:99:3E");
        let error = ticket(&reply).unwrap_err();
        assert!(
            error
                .to_string()
                .starts_with("NfcGetVmFiles: the sslThumbprint element holds \"zz:99:3E:"),
            "{error}"
        );
    }

    #[test]
    fn an_esxi_service_content_yields_its_session_manager() {
        assert_eq!(service_content(SERVICE_CONTENT).unwrap(), "ha-sessionmgr");
    }

    #[test]
    fn a_vcenter_service_content_is_refused_naming_the_product() {
        let content = SERVICE_CONTENT
            .replace("HostAgent", "VirtualCenter")
            .replace(
                "VMware ESXi 8.0.1 build-21495797",
                "VMware vCenter Server 8.0.1 build-1",
            );

        let error = service_content(&content).unwrap_err();

        assert_eq!(
            error.to_string(),
            "VMware vCenter Server 8.0.1 build-1 is not an ESXi host (apiType VirtualCenter); \
             connect to the host directly"
        );
    }

    #[test]
    fn a_service_content_without_an_api_type_or_session_manager_names_the_element() {
        let error = service_content("<returnval/>").unwrap_err();
        assert_eq!(
            error.to_string(),
            "RetrieveServiceContent: the reply has no apiType element"
        );

        let error = service_content("<about><apiType>HostAgent</apiType></about>").unwrap_err();
        assert_eq!(
            error.to_string(),
            "RetrieveServiceContent: the reply has no sessionManager element"
        );
    }

    #[test]
    fn an_element_is_found_by_local_name_with_its_entities_decoded() {
        let xml = "<a:r xmlns:a=\"urn:x\"><a:faultstring>Cannot &amp; will &#x6e;ot &lt;log in&gt;</a:faultstring></a:r>";

        assert_eq!(
            element(xml, "faultstring").as_deref(),
            Some("Cannot & will not <log in>")
        );
        assert_eq!(element(xml, "other"), None);
        assert_eq!(element("<broken", "faultstring"), None);
        assert_eq!(
            element("<x><![CDATA[a<b]]></x>", "x").as_deref(),
            Some("a<b")
        );
        assert_eq!(
            element("<r>out<![CDATA[side]]>&amp;<f>in</f></r>", "f").as_deref(),
            Some("in")
        );
    }

    #[test]
    fn the_envelope_names_the_operation_in_the_vim25_namespace() {
        let body = envelope("Logout", &this("SessionManager", "ha-sessionmgr"));

        assert_eq!(
            body,
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
             <soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\">\
             <soapenv:Body><Logout xmlns=\"urn:vim25\">\
             <_this type=\"SessionManager\">ha-sessionmgr</_this>\
             </Logout></soapenv:Body></soapenv:Envelope>"
        );
    }

    #[test]
    fn operator_supplied_values_are_xml_escaped() {
        assert_eq!(
            this("VirtualMachine", "<3 & \"4\">"),
            "<_this type=\"VirtualMachine\">&lt;3 &amp; &quot;4&quot;&gt;</_this>"
        );
    }

    #[test]
    fn a_fault_error_carries_the_call_and_the_host_text() {
        let error = Error::Fault {
            call: "Login",
            text: "Cannot complete login due to an incorrect user name or password.".to_owned(),
        };

        assert_eq!(
            error.to_string(),
            "Login: the host answered: Cannot complete login due to an incorrect user name or password."
        );
    }
}
