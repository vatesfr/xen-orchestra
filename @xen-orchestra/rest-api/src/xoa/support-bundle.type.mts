export type SupportBundleGroup = 'backups' | 'misc' | 'plugins' | 'pools' | 'tasks' | 'users' | 'vms' | 'xapiMessages'

export type SupportBundleParams = {
  /** used to encrypt the whole export (OpenPGP), to be sent separately */
  passphrase: string
  /**
   * replaces the fields written by humans (names, descriptions, tags, emails, XAPI message bodies…) by a placeholder
   *
   * unlike the identified secrets, these values are NOT searched in the other fields: a name copied in an error
   * message or in an `other_config` is exported as is. UUIDs, addresses and other identifiers are always exported.
   */
  anonymize?: boolean
  /** all groups when omitted */
  groups?: SupportBundleGroup[]
  /** applies to `pools`, `vms` and `xapiMessages` groups, all pools when omitted */
  pools?: string[]
  /** timestamp in milliseconds, only exports tasks started after it and RPU/RPR traces modified after it */
  tasksSince?: number
}
