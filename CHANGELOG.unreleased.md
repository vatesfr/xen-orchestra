> This file contains all changes that have not been released yet.
>
> Keep in mind the changelog is addressed to **users** and should be
> understandable by them.

### Security

> Security fixes and new features should go in this section

- [Plugins/audit] Redact more sensitive values from new audit records (created API tokens, credentials and encryption keys in URLs, one-time download/upload links) (PR [#10618](https://github.com/vatesfr/xen-orchestra/pull/10618))

### Enhancements

> Users must be able to say: "Nice enhancement, I'm eager to test it"

- [Plugins/audit] Forward a copy of each new audit record, as JSON, to a remote syslog server (e.g. a SIEM) over UDP, TCP or TLS, configurable in the plugin settings (PR [#10618](https://github.com/vatesfr/xen-orchestra/pull/10618))

- [Logs] The syslog transport (`[logs.transport.syslog]` in xo-server configuration) supports TLS (`tls://`), and the facility, application name and framing can be configured (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))
- [Logs] **Breaking:** logs are now sent to syslog as RFC 5424 messages, with their namespace as message ID, instead of RFC 3164 messages: set `format = 'rfc3164'` in `[logs.transport.syslog]` to keep the previous format (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))

### Bug fixes

> Users must be able to say: "I had this issue, happy to know it's fixed"

- [Logs] Fix the syslog transport sending every log with the _informational_ severity, splitting a log with line breaks into several messages, keeping the previous connection open when the configuration changes, and accumulating connections and memory when the syslog server is unreachable or does not read (PR [#10619](https://github.com/vatesfr/xen-orchestra/pull/10619))

### Packages to release

> When modifying a package, add it here with its release type.
>
> The format is the following: `- $packageName $releaseType`
>
> Where `$releaseType` is
>
> - patch: if the change is a bug fix or a simple code improvement
> - minor: if the change is a new feature
> - major: if the change breaks compatibility
>
> Keep this list alphabetically ordered to avoid merge conflicts

<!--packages-start-->

- @vates/obfuscate minor
- @vates/syslog minor
- @vates/types minor
- @xen-orchestra/backups minor
- @xen-orchestra/log major
- @xen-orchestra/qa-test patch
- @xen-orchestra/rest-api patch
- @xen-orchestra/web patch
- @xen-orchestra/web-core minor
- xo-server minor
- xo-server-audit minor
- xo-web minor

<!--packages-end-->
