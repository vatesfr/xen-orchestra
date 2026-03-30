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
```

When a certificate needs to be issued or renewed, XO will:

1. Write a JSON file at the configured path:
   ```json
   { "domain": "_acme-challenge.my.domain.net", "value": "<token>" }
   ```
2. Log an `info` message indicating the file path and the domain to configure.
3. Wait for your script or automation to create the corresponding DNS TXT record.
4. Delete the file automatically once validation succeeds.

You are responsible for monitoring the file and creating the DNS TXT record. A simple approach is to watch the file with a script and call your DNS provider's API when it appears.
