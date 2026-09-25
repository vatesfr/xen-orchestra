# Pin a host certificate

`vectura serve` verifies the management port's certificate before it sends
the password, and there is no flag to skip that. This guide shows the
three ways to make the check pass and how to keep it passing when the
certificate changes.

## Choose how the port is trusted

| Situation                                          | Flag                         | What is checked                                                                                                    |
| -------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| The host uses its default, self-signed certificate | `--thumbprint sha256:<hash>` | The SHA-256 hash of the certificate the host presents equals `<hash>`. Nothing else: no name, no expiry, no chain. |
| The host's certificate is issued by your own CA    | `--ca-file <bundle.pem>`     | The certificate chains to a certificate in the bundle and names the host given to `--host`.                        |
| The host's certificate is issued by a public CA    | nothing                      | Same check, against the system's root store.                                                                       |

`--thumbprint` and `--ca-file` exclude each other; giving both is a usage
error.

The default ESXi certificate names `localhost.localdomain`, not the host,
so `--ca-file` cannot accept it even with the right issuer. Pin it.

## Get the thumbprint

```sh
vectura fingerprint --host esxi.example
```

```
443 sha256 BA:78:16:...:AD
443 sha1 3B:...:7F
902 sha256 BA:78:16:...:AD
902 sha1 3B:...:7F
```

`fingerprint` accepts whatever certificate the host presents, sends
nothing after the handshake, and drops the connection. That is the point:
it lets you see the certificate before any credential crosses the wire,
but it cannot tell a genuine host from an interceptor. Check the hash out
of band before you pin it. On the host itself:

```sh
openssl x509 -in /etc/vmware/ssl/rui.crt -noout -fingerprint -sha256
```

Or compare with what the host's administrator gives you.

## Pass the pin

The `443 sha256` value is taken as printed, colons and upper case
included; lower case and a bare hex string are accepted too:

```sh
vectura serve --host esxi.example --thumbprint sha256:BA:78:16:...:AD ...
```

The data port needs no pin from you. The ticket Vectura obtains inside the
verified management session carries the SHA-1 thumbprint of the data
port's certificate, the host confirms the SHA-256 in the data-port
dialogue, and both must match the certificate presented there. On the
hosts measured so far, both ports present the same certificate, which is
why the `443` and `902` lines above are equal.

## Use a CA bundle

```sh
vectura serve --host esxi.example --ca-file /etc/ssl/esxi-ca.pem ...
```

The bundle is a PEM file holding one or more CA certificates. Give
`--host` the name the certificate carries, since the name is part of the
check; an address works only if the certificate lists it.

## After the certificate changes

A renewed or replaced certificate has a new hash, and the next `serve`
stops with:

```
vectura: management plane: RetrieveServiceContent: certificate thumbprint mismatch: expected sha256 BA:78:..., the host presented sha256 24:8D:...
```

Run `fingerprint` again, check the new hash out of band, and update the
pin. A mismatch you did not expect is the check doing its job: do not
update the pin until you know why the certificate changed.

## Related

- [The security model](../explanation/security-model.md) says what each
  verification protects.
- [Command line](../reference/command-line.md) lists the flags.
