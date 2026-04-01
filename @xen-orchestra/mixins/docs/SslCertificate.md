> This module provides [Let's Encrypt](https://letsencrypt.org/) integration to `xo-proxy` and `xo-server`.

Two challenge types are supported: **HTTP-01** (default) and **DNS-01**.

## HTTP-01 challenge (default)

First of all, make sure your server is listening on HTTP on port 80 and on HTTPS 443.

In `xo-server`, to avoid HTTP access, enable the redirection to HTTPs:

```toml
[http]
redirectToHttps = true
```

Your server must be reachable with the configured domain to the certificate provider (e.g. Let's Encrypt), it usually means publicly reachable.

Finally, add the following entries to your HTTPS configuration.

```toml
# Must be set to true for this feature
autoCert = true

# These entries are required and indicates where the certificate and the
# private key will be saved.
cert = 'path/to/cert.pem'
key = 'path/to/key.pem'

# ACME (e.g. Let's Encrypt, ZeroSSL) CA directory
#
# Specifies the URL to the ACME CA's directory.
#
# An identifier `provider/directory` can be passed instead of a URL, see the
# list of supported directories here: https://www.npmjs.com/package/acme-client#directory-urls
#
# Note that the application cannot detect that this value has changed.
#
# In that case delete the certificate and the key files, and restart the
# application to generate new ones.
#
# Default is 'letsencrypt/production'
acmeCa = 'zerossl/production'

# Domain for which the certificate should be created.
#
# This entry is required.
acmeDomain = 'my.domain.net'

# Optional email address which will be used for the certificate creation.
#
# It will be notified of any issues.
acmeEmail = 'admin@my.domain.net'
```

## DNS-01 challenge

Use this method when your XO server is **not publicly reachable** on port 80. Validation is done via a DNS TXT record instead.

Add `acmeDnsChallengeFile` to your HTTPS configuration block:

```toml
autoCert = true

cert = 'path/to/cert.pem'
key = 'path/to/key.pem'

acmeDomain = 'my.domain.net'
acmeEmail = 'admin@my.domain.net'

# Path to a file where XO will write the DNS challenge.
#
# When set, DNS-01 is used instead of HTTP-01.
# XO does not need to be publicly reachable on port 80.
acmeDnsChallengeFile = '/etc/xo-server/dns-challenge.json'

# How long XO will wait for the DNS record to be validated before giving up.
#
# Expressed in milliseconds. Default is 1800000 (30 minutes).
# Increase this value if your DNS provider has slow propagation.
# acmeDnsChallengeTimeout = 1800000
```

### How it works

When a certificate needs to be issued or renewed, XO will:

1. Write a JSON file at the configured path:
   ```json
   { "domain": "_acme-challenge.my.domain.net", "value": "<token>" }
   ```
2. Log an `info` message with the file path and the name of the done file to create.
3. **Wait** — XO is now blocked until you signal that the DNS record is ready (see below).
4. Ask Let's Encrypt to validate the DNS TXT record.
5. Delete the challenge file automatically once validation succeeds.

### Your responsibilities

XO cannot create DNS records on your behalf — it has no knowledge of your DNS provider or credentials. You are responsible for:

1. **Watching** `acmeDnsChallengeFile` for changes (e.g. with `inotifywait` or a cron polling script)
2. **Creating** the DNS TXT record via your provider's API or interface, with the `domain` and `value` from the JSON file
3. **Waiting** for the record to propagate — this can take anywhere from a few seconds to several hours depending on your DNS provider and TTL settings
4. **Signalling** XO that the record is ready by creating a done file at `<acmeDnsChallengeFile>.done` (e.g. `/etc/xo-server/dns-challenge.json.done`)

Once XO detects the done file, it deletes it and immediately asks Let's Encrypt to validate.

> **DNS propagation time varies greatly between providers.** Some propagate within seconds, others can take up to 24 hours. Make sure the TXT record is fully propagated before creating the done file, otherwise Let's Encrypt validation will fail.

### Timeout

XO will wait up to 30 minutes by default for the done file to appear. If the timeout is reached, XO logs a warning and aborts the certificate renewal — it will retry on the next restart or incoming HTTPS request.

If your setup requires more time, increase `acmeDnsChallengeTimeout` in your configuration.

### Example automation scripts

Template scripts are available alongside this document:

- **Shell** (Linux/macOS, requires `inotify-tools` and `jq`): [`dns-challenge.example.sh`](./dns-challenge.example.sh)
- **PowerShell** (Windows): [`dns-challenge.example.ps1`](./dns-challenge.example.ps1)

To use them:

1. Copy the file for your platform and remove the `.example` extension:
   ```sh
   cp dns-challenge.example.sh dns-challenge.sh
   chmod +x dns-challenge.sh
   ```
2. Edit the `# TODO` section to call your DNS provider's API.
3. Run the script before or alongside `xo-server`.
