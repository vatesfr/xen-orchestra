export type SupportBundleGroup = 'backups' | 'misc' | 'plugins' | 'pools' | 'tasks' | 'users' | 'vms' | 'xapiMessages'

export type SupportBundleParams = {
  /** used to encrypt the whole export (OpenPGP), to be sent separately */
  passphrase: string
  /** all groups when omitted */
  groups?: SupportBundleGroup[]
  /** applies to `pools`, `vms` and `xapiMessages` groups, all pools when omitted */
  pools?: string[]
  /** timestamp in milliseconds, only exports tasks started after it and RPU/RPR traces modified after it */
  tasksSince?: number
}
