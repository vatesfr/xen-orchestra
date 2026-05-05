# Credential Database Encryption

Xen Orchestra stores credentials for XenServer connections, remotes, users, and tokens in Redis. When credential encryption is enabled, all records are encrypted at rest using AES-256-GCM, and index keys are replaced with HMAC blind indexes so field values (emails, hostnames, etc.) are not stored as plaintext.

## Prerequisites

- XO must be running as a VM on a XenServer host (XenStore is required to store one of the two key halves)
- The path `/var/lib/xo-server/data/` must be writable by the xo-server process

## Enabling Encryption

Add the following to your configuration file:

```toml
[redis]
encryptCredentialDatabase = true
```

On the next startup, XO will:

1. Generate two random 32-byte key halves
2. Store one half in XenStore (`vm-data/xo-encryption-key`) and one in `/var/lib/xo-server/data/xo-encryption-key` (mode `0400`)
3. Derive an AES-256 encryption key and an HMAC key from the two halves using HKDF-SHA256
4. Encrypt all existing Redis records and rebuild indexes as HMAC blind indexes
5. Verify the migration and delete the plaintext backup on success

A plaintext backup is written to `/var/lib/xo-server/data/encryption-backup.json` before migration begins and deleted on success. If migration fails, this file is preserved for manual recovery.

## Key Management

The encryption key is split across two locations, compromise of one alone is not sufficient to decrypt the database:

| Half | Location |
|------|----------|
| A | XenStore: `vm-data/xo-encryption-key` |
| B | `/var/lib/xo-server/data/xo-encryption-key` |

Both halves are required to derive the actual encryption key. Neither half should be backed up in plaintext.

:::warning
If either key half is lost, the database cannot be decrypted and XO will enter degraded mode. Keep your config backup up to date.
:::

## Config Backup

When credential encryption is enabled, exporting the XO configuration **requires a passphrase**. The passphrase protects the exported credentials with OpenPGP encryption.

The backup contains the decrypted credential data. When restored on any XO instance, it will be re-encrypted with that instance's keys automatically, no manual key transfer needed.

:::tip
Always export a fresh config backup after enabling encryption and store it securely.
:::

## Disabling Encryption

Set `encryptCredentialDatabase = false` (or remove the option) and restart. XO will detect the existing key files, decrypt all records, rebuild plaintext indexes, and delete the key files. The process is automatic.

An encrypted backup is written to `/var/lib/xo-server/data/encryption-backup.json` before migration begins and deleted on success. If migration fails, both key halves are kept and this file is preserved for manual recovery.

## Degraded Mode

If XO cannot load or use the encryption keys at startup (missing keys, corrupted data, or a key mismatch), it enters degraded mode:

- The HTTP server remains available (support tunnel can connect)
- All API calls are rejected with a clear error message
- No server connections, logins, or remote access are possible

Check the server logs for details:

```
xo:crypto-credentials ERROR Credential database decryption failed — running in degraded mode
```

**Recovery options:**

- Restore the missing key files and restart
- Restore from a config backup made before the key was lost: `xo-cli system.importConfig`
- Contact support — the HTTP server being available means a support tunnel can be established
