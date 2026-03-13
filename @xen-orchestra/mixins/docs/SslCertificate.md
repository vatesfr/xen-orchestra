> This module provides [Let's Encrypt](https://letsencrypt.org/) integration to `xo-proxy` and `xo-server` using DNS-01 ACME challenges.

When a certificate needs to be issued or renewed, XO writes a JSON file at a configured path containing the DNS record to create:

```json
{ "domain": "_acme-challenge.my.domain.net", "value": "..." }
```

An `info` log is also emitted indicating the file path. You (or your own automation) are responsible for creating the corresponding `TXT` record in your DNS before Let's Encrypt attempts to verify it. XO deletes the file automatically once verification succeeds.

This approach does not require XO to be publicly reachable on the internet.

## Configuration

Add the following entries to your HTTPS configuration:

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

# Path to a file where XO will write the DNS-01 challenge value.
#
# The path must be writable by the xo-server process.
# XO will create the file when a certificate needs to be issued or renewed,
# and delete it once Let's Encrypt verifies the challenge.
#
# The file will contain a JSON object with the DNS TXT record to create:
#   { "domain": "_acme-challenge.my.domain.net", "value": "..." }
#
# You are responsible for creating that TXT record before Let's Encrypt
# verifies it. See docs/dns-challenge-hook.example.sh for a starting point.
acmeDnsChallengeFile = '/etc/xo-server/dns-challenge.json'
```

## Hook script

You need a process watching `acmeDnsChallengeFile` and creating the DNS TXT record when it appears. An example hook script is provided at [`docs/dns-challenge-hook.example.sh`](dns-challenge-hook.example.sh). Copy and adapt it for your DNS provider.
