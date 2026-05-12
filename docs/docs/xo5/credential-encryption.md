# Credential Database Encryption

Xen Orchestra stores credentials for XenServer connections, remotes, users, and tokens in Redis. When credential encryption is enabled, all records are encrypted at rest using AES-256-GCM, and index keys are replaced with HMAC blind indexes so indexed field values (emails, hostnames, etc.) are not stored as plaintext. The performance impact is negligible for typical deployments.

## Prerequisites

- XO must be running as a VM on a XenServer/XCP-ng host and must be able to execute xenstore-read and xenstore-write commands (XenStore is required to store one of the two key halves)
- The path `/var/lib/xo-server/data/` must be writable by the xo-server process

## Enabling Encryption

Add the following to your configuration file:

See [Configuration](./configuration.md)

```toml
[redis]
encryptCredentialDatabase = true
```

On the next startup after enabling encryption, XO will:

1. Generate two random 32-byte key halves
2. Store one half in XenStore (`vm-data/xo-encryption-key`) and one in `/var/lib/xo-server/data/xo-encryption-key` (mode `0400`)
3. Derive an AES-256 encryption key and an HMAC key from the two halves using HKDF-SHA256
4. Encrypt all existing Redis records and rebuild indexes as HMAC blind indexes
5. Verify the migration and delete the plaintext backup on success

A plaintext backup is written to `/var/lib/xo-server/data/encryption-backup.json` before migration begins and deleted on success. If migration fails, this file is preserved for manual recovery.

## Key Management

The encryption key is split across two locations, compromise of one alone is not sufficient to decrypt the database:

| Half | Location                                    |
| ---- | ------------------------------------------- |
| A    | XenStore: `vm-data/xo-encryption-key`       |
| B    | `/var/lib/xo-server/data/xo-encryption-key` |

Both halves are required to derive the actual encryption key. Neither half should be backed up in plaintext.

:::warning
If either key half is lost, the database cannot be decrypted and XO will enter degraded mode until both key are setup correctly. Users won't be able to use XO while in degraded mode. Keep your config backup up to date.
:::

## Config Backup

When credential encryption is enabled, exporting the XO configuration **requires a passphrase**. The passphrase protects the exported credentials with OpenPGP encryption.

See [Back up XO backup metadata](./backup_howto.md#Specific-steps-for-the-XOA-VM)

The backup contains the decrypted credential data. When restored on any XO instance, it will be re-encrypted with that instance's keys automatically, no manual key transfer needed.

:::tip
Always export a fresh config backup after enabling encryption and store it securely.
:::

## Disabling Encryption

Set `encryptCredentialDatabase = false` (or remove the option) and restart. XO will detect the existing key files, decrypt all records, rebuild plaintext indexes, and delete the key files. The process is automatic.

An encrypted backup is written to `/var/lib/xo-server/data/encryption-backup.json` before migration begins and deleted on success. If migration fails, both key halves are kept and this file is preserved for manual recovery.

## Recovering from a Failed Migration

Both the encryption and decryption migrations write a backup of all Redis records to `/var/lib/xo-server/data/encryption-backup.json` before touching any data. The backup is deleted only on success.

### Failed Encryption Migration

If enabling encryption fails, XO will log:

```
xo:crypto-credentials ERROR Credential database migration failed - running in degraded mode { backupPath: '/var/lib/xo-server/data/encryption-backup.json' }
```

The backup file contains the original **plaintext** Redis records.

**Option 1 — Retry**

If the failure was transient (Redis timeout, XenStore momentarily unavailable), simply restart xo-server. Because the key files already exist, XO will load them and attempt to serve data normally. If the Redis data was not yet written (the migration is atomic), the data is still plaintext and readable.

**Option 2 — Roll back to plaintext**

If you want to abandon the migration and restore a clean state:

1. Stop xo-server.
2. Remove both key halves:
   ```bash
   xenstore-rm vm-data/xo-encryption-key
   rm /var/lib/xo-server/data/xo-encryption-key
   ```
3. If Redis data was partially written, restore it from the backup:
   ```bash
   cat /var/lib/xo-server/data/encryption-backup.json
   ```
   Use `xo-cli system.importConfig` with a pre-encryption config backup if one is available - this is the safest path.
4. Set `encryptCredentialDatabase = false` (or remove the option) and restart.

**Option 3 — Restore from a config backup**

If you exported a config backup before enabling encryption, restore it:

```bash
xo-cli system.importConfig
```

This re-imports all credentials in plaintext and re-encrypts them with the current instance's keys automatically.

### Failed Decryption Migration

If disabling encryption fails, XO will log:

```
xo:crypto-credentials ERROR Credential database migration failed - running in degraded mode { backupPath: '/var/lib/xo-server/data/encryption-backup.json' }
```

The backup file contains the **encrypted** Redis records (the pre-decryption snapshot).

**Option 1 — Retry**

Both key halves are kept on disk after a decryption migration failure. Simply restart xo-server with `encryptCredentialDatabase` still unset or `false`, XO will detect the key files and retry the decryption migration automatically.

**Option 2 — Re-enable encryption, export config, then disable cleanly**

If retrying does not work, use the existing keys to get back to a working state and then perform a clean transition to plaintext:

1. Set `encryptCredentialDatabase = true` again and restart. XO will load the existing keys and serve the encrypted data normally without triggering any migration.
2. Export your configuration with a passphrase:
   ```bash
   xo-cli system.exportConfig passphrase=<your-passphrase>
   ```
   or via the interface
3. Set `encryptCredentialDatabase = false`, remove both key halves:
   ```bash
   xenstore-rm vm-data/xo-encryption-key
   rm /var/lib/xo-server/data/xo-encryption-key
   ```
   flush redis:
   ```bash
   redis-cli FLUSHALL
   ```
   and restart.
4. XO will start with an empty credential database. Import the config backup:
   ```bash
   xo-cli system.importConfig
   ```
   The credentials are re-imported in plaintext with no encryption active.

## Degraded Mode

If XO cannot load or use the encryption keys at startup (missing keys, corrupted data, or a key mismatch), it enters degraded mode:

- The HTTP server remains available (support tunnel can connect)
- All API calls are rejected with a clear error message
- No server connections, logins, or remote access are possible

Check the server logs for details:

```
xo:crypto-credentials ERROR Credential database encryption failed - running in degraded mode
xo:crypto-credentials ERROR Credential database decryption failed — running in degraded mode
xo:crypto-credentials ERROR Credential database migration failed - running in degraded mode
xo:crypto-credentials ERROR Only one encryption key half found - running in degraded mode
xo:crypto-credentials ERROR Existing key loading failed, decryption migration impossible - running in degraded mode
```

**Recovery options:**

- Restore from a config backup made before the key was lost: `xo-cli system.importConfig`
- Contact support — the HTTP server being available means a support tunnel can be established
