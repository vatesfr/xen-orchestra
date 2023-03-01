> This module provides [Let's Encrypt](https://letsencrypt.org/) integration to `xo-proxy` and `xo-server`.

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
# A identifier `provider/directory` can be passed instead of a URL, see the
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
