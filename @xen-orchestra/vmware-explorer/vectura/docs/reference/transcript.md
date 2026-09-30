# The transcript

With `--verbose`, `vectura serve` writes one line per event of the
session to standard error, in the order the events happen. `vectura
fingerprint --verbose` writes only the TLS lines. Without `--verbose`,
standard error carries only errors and warnings, all prefixed `vectura: `.

Transcript lines carry no prefix. None ever contains the password, the
NFC ticket or the management session cookie: the ticket is rendered as
`<ticket>`. A line standard error cannot take is dropped; the NBD stream
is never delayed by the transcript.

## Lines, in session order

| Line                                                                       | When                                                                                                                                            | Fields                                                                                                                                           |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `<call>: <status> in <n> ms`                                               | After each management call on port 443: `RetrieveServiceContent`, `Login`, `RetrieveInternalContent`, `NfcGetVmFiles`, and `Logout` at the end. | The HTTP status the host answered, and the time from request to full response.                                                                   |
| `greeting: <capabilities>`                                                 | After the data port's greeting line.                                                                                                            | The capabilities the host announced, comma separated, as the host wrote them, such as `NFCSSL supported, SHA256 supported`.                      |
| `first session tls <version> <suite>`                                      | After the first TLS handshake on the data port.                                                                                                 | The protocol version and cipher suite, in rustls's names, such as `TLSv1_2 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`.                               |
| `> <line>`                                                                 | Each line sent in the ticket dialogue.                                                                                                          | `SESSION <ticket>`, `BANNER `, `THUMBPRINT_SHA2 <tag>`, `PROXY nfcssl` or `PROXY nfc`.                                                           |
| `< <line>`                                                                 | Each line the host answered.                                                                                                                    | The host's reply, such as `220 ...` or `200 <thumbprint>`.                                                                                       |
| `second session tls <version> <suite>`                                     | After the second TLS handshake, `--transport nfcssl` only.                                                                                      | As above.                                                                                                                                        |
| `> handshake type <n>`                                                     | Each handshake message sent.                                                                                                                    | The message type: 43, 33 and 51 are sent, then 54, 55 and 52 after the host's replies.                                                           |
| `< handshake type <n>`                                                     | Each handshake message received.                                                                                                                | The message type: 36 and 51 after the first three, 52 after the last three.                                                                      |
| `open: <capacity> bytes, sector size <n>`                                  | After the host's open reply.                                                                                                                    | The disk's virtual capacity and its sector size, as reported.                                                                                    |
| `nbd option <n>: <outcome>`                                                | After each NBD option.                                                                                                                          | The option number and how it was answered: `export`, `info`, `acknowledged`, `invalid` or `unsupported`.                                         |
| `nbd export: <size> bytes`                                                 | When transmission starts.                                                                                                                       | The export size sent to the client.                                                                                                              |
| `progress: served <n> GiB, compression ratio <r>, depth <d>`               | Each time the bytes served cross a whole gibibyte.                                                                                              | Whole gibibytes served so far, wire bytes per served byte with two decimals, and the depth in use.                                               |
| `summary: bytes served <n>, wire bytes <n>, host reads <n>, elapsed <s> s` | When the session ends, before `Logout`.                                                                                                         | Bytes served to the client, bytes received from the host for them, host reads issued, and the seconds since negotiation began, with one decimal. |

`fingerprint --verbose` writes `<port> tls <version> <suite>` per port,
with `443` or the value of `--nfc-port` as the port.

## Ratios

`compression ratio` is wire bytes divided by served bytes. `1.00` means
the host sent every byte as stored; `0.15` means fifteen bytes on the
wire per hundred bytes of disk. Before any byte is served it reads
`0.00`.

## Example

```
RetrieveServiceContent: 200 in 41 ms
Login: 200 in 63 ms
RetrieveInternalContent: 200 in 38 ms
NfcGetVmFiles: 200 in 52 ms
greeting: SSL Required, ServerDaemonProtocol:SOAP, MKSDisplayProtocol:VNC , VMXARGS supported, NFCSSL supported, SHA256 supported
first session tls TLSv1_2 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
> SESSION <ticket>
> BANNER
< 220 NFC server ready
> THUMBPRINT_SHA2 <tag>
< 200 BA:78:16:...:AD
> PROXY nfcssl
< 200 ...
second session tls TLSv1_2 TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
> handshake type 43
> handshake type 33
> handshake type 51
< handshake type 36
< handshake type 51
> handshake type 54
> handshake type 55
> handshake type 52
< handshake type 52
open: 17179869184 bytes, sector size 512
nbd option 7: info
nbd export: 17179869184 bytes
progress: served 1 GiB, compression ratio 0.16, depth 16
...
summary: bytes served 17179869184, wire bytes 2607992664, host reads 16384, elapsed 628.6 s
Logout: 200 in 35 ms
```

The `220` and `200` lines are illustrative: their text after the code is
the host's and varies by version.
