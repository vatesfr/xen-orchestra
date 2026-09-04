# Credential database encryption

Xen Orchestra stores its records (server connections, backup jobs and remotes, schedules, users, groups, authentication tokens, ACLs, tags, cloud configs, proxy registrations and plugin configurations) in Redis. When credential encryption is enabled, every record is encrypted at rest with AES-256-GCM (encrypted values carry an `enc:` prefix), and index keys are replaced with HMAC-SHA256 blind indexes so indexed field values (emails, hostnames, etc.) are never stored as plaintext. The performance impact is negligible for typical deployments.

## Prerequisites

- XO must run as a VM on a XenServer/XCP-ng host with Xen tools available: one of the two key halves lives in XenStore, accessed through the `xenstore-read` and `xenstore-write` commands. This requires running xo-server as root or granting it access to the xenstored socket.
- The path `/var/lib/xo-server/data/` must be writable by the xo-server process.

## Enabling Encryption

Add the following to your [configuration file](configuration.md):

```toml
[redis]
encryptCredentialDatabase = true
```

On the next startup, XO will:

1. Generate two random 32-byte key halves
2. Store one half in XenStore (`vm-data/xo-encryption-key`) and one in `/var/lib/xo-server/data/xo-encryption-key` (mode `0400`)
3. Derive an AES-256 encryption key and an HMAC key from the two halves using HKDF-SHA256
4. Encrypt all existing Redis records and rebuild the indexes as HMAC blind indexes
5. Verify the migration and delete the plaintext backup on success

A plaintext backup is written to `/var/lib/xo-server/data/encryption-backup.json` before the migration begins and deleted on success (if that file already exists, a numbered variant such as `encryption-backup_1.json` is used instead). If the migration fails, the file is preserved for manual recovery.

## Key Management

The encryption key is split across two locations, so the compromise of one alone is not sufficient to decrypt the database:

| Half | Location                                    |
| ---- | ------------------------------------------- |
| A    | XenStore: `vm-data/xo-encryption-key`       |
| B    | `/var/lib/xo-server/data/xo-encryption-key` |

Both halves are required to derive the actual encryption and HMAC keys. Neither half should be backed up in plaintext.

:::warning
If either key half is lost while encryption is enabled, **do not restart xo-server**: at startup, XO treats a missing key half as a fresh setup, generates two new halves (overwriting the one that survived) and re-runs the encryption migration, which skips records that are already encrypted. Those records become permanently undecryptable. Put the missing half back in place before the next restart, or restore a config backup. Keep a fresh config backup at all times.
:::

## Config Backup

When credential encryption is enabled, exporting the XO configuration **requires a passphrase**. The export is then encrypted with OpenPGP using that passphrase. Export from the web interface (Settings > Config, which prompts for a passphrase) or with `xo-cli`:

<Terminal shell title="export the XO config, protected by a passphrase">{`
xo-cli xo.exportConfig passphrase=<your-passphrase> @=/path/to/xo-config.bin
`}</Terminal>

The export contains the decrypted credential data (hence the mandatory passphrase). When restored on any XO instance, records are re-encrypted with that instance's own keys automatically, no manual key transfer is needed:

<Terminal shell title="import a passphrase-protected config backup">{`
xo-cli xo.importConfig passphrase=<your-passphrase> @=/path/to/xo-config.bin
`}</Terminal>

See also [Back up XO metadata](./backup_howto.md#specific-steps-for-the-xoa-vm).

:::tip
Always export a fresh config backup after enabling encryption and store it securely.
:::

## Disabling Encryption

Set `encryptCredentialDatabase = false` (or remove the option) and restart. XO detects the existing key files, decrypts all records, rebuilds plaintext indexes, then deletes both key halves. The process is automatic.

An encrypted backup is written to `/var/lib/xo-server/data/encryption-backup.json` before the migration begins and deleted on success. If the migration fails, both key halves are kept and the file is preserved for manual recovery.

## Recovering from a Failed Migration

Both the encryption and decryption migrations write a backup of all Redis records to `/var/lib/xo-server/data/encryption-backup.json` before touching any data. The backup is deleted only on success. On failure, XO logs:

```
xo:crypto-credentials ERROR Credential database migration failed - running in degraded mode { backupPath: '/var/lib/xo-server/data/encryption-backup.json' }
```

### Failed Encryption Migration

The backup file contains the original **plaintext** Redis records.

**Option 1: restart.** If the failure was transient (for example a temporary Redis error), restart xo-server. The key files already exist, so XO loads them and serves data normally. The encrypted values are written to Redis in a single atomic operation, so if that write never happened the data is still plaintext and readable. Note that the interrupted migration is not retried on restart: records still in plaintext stay in plaintext until they are next written. To force a full re-encryption, disable encryption (see Option 2), let the decryption migration finish and remove the keys, then enable it again.

**Option 2: roll back to plaintext.** To abandon the migration, set `encryptCredentialDatabase = false` (or remove the option) and restart, **leaving the key files in place**. XO detects the keys and runs the decryption migration: any record that was encrypted is decrypted back to plaintext, then both key halves are deleted automatically. Never remove the key halves manually while encrypted records may remain in Redis: they would become impossible to decrypt. If the rollback fails too, restore a pre-encryption config backup with `xo-cli xo.importConfig` (safest path); the backup file keeps the raw plaintext records for manual recovery otherwise.

**Option 3: restore a config backup.** If you exported a config backup before enabling encryption:

<Terminal shell title="restore a pre-encryption config backup">{`
xo-cli xo.importConfig @=/path/to/xo-config.json
`}</Terminal>

This re-imports all records, and XO re-encrypts them with the current instance's keys automatically.

### Failed Decryption Migration

The backup file contains the **encrypted** Redis records (the pre-decryption snapshot).

**Option 1: retry.** Both key halves (XenStore entry and key file) are kept in place after a decryption failure. Restart xo-server with `encryptCredentialDatabase` still unset or `false`: XO detects the key files and retries the decryption migration automatically.

**Option 2: re-enable encryption, export, then disable cleanly.** If retrying does not work:

1. Set `encryptCredentialDatabase = true` again and restart. XO loads the existing keys and serves the encrypted data normally, without triggering any migration.
2. Export your configuration with a passphrase (interface or CLI):

<Terminal shell title="export the config with a passphrase">{`
xo-cli xo.exportConfig passphrase=<your-passphrase> @=/path/to/xo-config.bin
`}</Terminal>

3. Set `encryptCredentialDatabase = false`, remove both key halves and flush Redis:

<Terminal shell title="remove the keys and flush Redis">{`
xenstore-rm vm-data/xo-encryption-key
rm /var/lib/xo-server/data/xo-encryption-key
redis-cli FLUSHALL
`}</Terminal>

4. Restart: XO starts with an empty database. Import the config backup:

<Terminal shell title="import the config backup">{`
xo-cli xo.importConfig passphrase=<your-passphrase> @=/path/to/xo-config.bin
`}</Terminal>

The records are re-imported in plaintext with no encryption active.

## Degraded Mode

If XO cannot safely use the credential database at startup, it enters degraded mode. This happens when the Xen tools are unavailable while a key half must be read, when key generation or loading fails, when a migration fails, or when encryption has been disabled but only the file key half is found (the XenStore half is missing). Note that with encryption **enabled**, a missing key half does not trigger degraded mode: XO regenerates the keys instead (see the warning in [Key Management](#key-management)). In degraded mode:

- The HTTP server remains available (a support tunnel can still connect)
- API calls are rejected with an explicit error: `XO is running in degraded mode: credential decryption failed.`
- No server connections, logins or remote access are possible

Check the server logs for the exact cause:

```
xo:crypto-credentials ERROR Credential database encryption failed - running in degraded mode
xo:crypto-credentials ERROR Credential database decryption failed - running in degraded mode
xo:crypto-credentials ERROR Credential database migration failed - running in degraded mode
xo:crypto-credentials ERROR Only one encryption key half found - running in degraded mode
xo:crypto-credentials ERROR Xenstore tools not available, credential database encryption failed - running in degraded mode
xo:crypto-credentials ERROR Xenstore tools not available, credential database decryption failed - running in degraded mode
xo:crypto-credentials ERROR Existing key loading failed, decryption migration impossible - running in degraded mode
```

**Recovery options:**

- Fix the reported cause and restart: repair the Xen tools or their access rights, or put the missing XenStore key half back in place
- Restore a config backup made before the keys were lost: `xo-cli xo.importConfig`
- Contact support: the HTTP server being available means a support tunnel can be established
