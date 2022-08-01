> This module provides [Let's Encrypt](https://letsencrypt.org/) integration to `xo-proxy` and `xo-server`.

## Set up

First of all, make sure your server is listening on HTTP on port 80 and on HTTPS 443.

In `xo-server`, to avoid HTTP access, enable the redirection to HTTPs:

```toml
[http]
redirectToHttps = true
```

Your server must be reachable with the configured domain to the certificate provider (e.g. Let's Encrypt), it usually means publicly reachable.

```toml
[acme]

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
ca = 'zerossl/production'

# Optional email address which will be used for the certificate creation.
#
# It will be notified of any issues.
email = 'admin@my.domain.net'

# Domain for which the certificate should be created.
[acme."my.domain.net"]

# Options documented above can be overriden for a specific domain.
# ca =
# email =
```

## Behind the scenes

The certificates are stored in:

```
$XDG_CONFIG_HOME/<app name>/acme/<ca hostname>/sites/<domain>
├─ cert.pem
└─ key.pem
```

When a request arrives:

- if no ACME domain is configured for it, the certificate configured for this `http.listen` entry will be used;
- if the ACME certificate for this domain and this CA is missing or no longer valid, a new one will be generated and used for this request;
- if the ACME certificate for this domain and this CA expires soon, it is used for this request and a new one is generated.
