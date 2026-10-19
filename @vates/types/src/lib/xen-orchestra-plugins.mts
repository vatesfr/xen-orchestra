import type { Branded } from '../common.mjs'
import type { XoHost, XoPool, XoSr, XoVm } from '../xo.mjs'

type BaseXoPlugin<Name extends string, Configuration = never> = {
  autoload: boolean
  /** secret values (e.g. passwords) are obfuscated */
  configuration?: Configuration
  configurationPresets?: Record<string, Configuration>
  /** JSON schema describing the expected configuration, undefined if the plugin is not configurable */
  configurationSchema?: Record<string, unknown>
  /**
   * whether the plugin can be loaded: not configurable, configured, or accepting an empty configuration
   * (in which case it has no saved `configuration`)
   */
  configured: boolean
  description?: string
  id: Branded<'plugin'>
  keywords?: string[]
  loaded?: boolean
  name: Name
  testable: boolean
  /** JSON schema describing the data expected by the plugin test */
  testSchema?: Record<string, unknown>
  unloadable: boolean
  version?: string
}

// ===================================================================
// audit

export type XoAuditPluginConfiguration = {
  /** whether to save user actions in the audit log */
  active?: boolean
}

export type XoAuditPlugin = BaseXoPlugin<'audit', XoAuditPluginConfiguration>

// ===================================================================
// auth-github

export type XoAuthGithubPluginConfiguration = {
  clientID: string
  clientSecret: string
}

export type XoAuthGithubPlugin = BaseXoPlugin<'auth-github', XoAuthGithubPluginConfiguration>

// ===================================================================
// auth-google

export type XoAuthGooglePluginConfiguration = {
  /** must be exactly the same as specified on the Google developer console */
  callbackURL: string
  clientID: string
  clientSecret: string
  /** changing this value will break existing users */
  scope?: 'https://www.googleapis.com/auth/plus.login' | 'email'
}

export type XoAuthGooglePlugin = BaseXoPlugin<'auth-google', XoAuthGooglePluginConfiguration>

// ===================================================================
// auth-ldap

type XoAuthLdapPluginDomain = {
  /** the part of the description tree where the users and groups are looked for */
  base: string
  /** credentials to use before looking for the user record */
  bind?: {
    dn: string
    password: string
  }
  /** paths to CA certificates to use when connecting to SSL-secured LDAP servers */
  certificateAuthorities?: string[]
  /** enforce the validity of the server's certificates */
  checkCertificate?: boolean
  /** backup URIs tried in order on TCP-level failure of the primary URI */
  failoverUris?: string[]
  /** filter used to find the user, e.g. `(uid={{name}})` */
  filter?: string
  /** import groups from LDAP directory */
  groups?: {
    base: string
    displayNameAttribute: string
    filter: string
    idAttribute: string
    membersMapping: {
      groupAttribute: string
      userAttribute: string
    }
  }
  startTls?: boolean
  uri: string
  /** attribute used to map LDAP user to XO user, must be unique */
  userIdAttribute: string
}

export type XoAuthLdapPluginConfiguration = XoAuthLdapPluginDomain & {
  /** extra LDAP domains tried in order when the primary domain returns no match */
  additionalDomains?: XoAuthLdapPluginDomain[]
}

export type XoAuthLdapPluginTestData = {
  password: string
  username: string
}

export type XoAuthLdapPlugin = BaseXoPlugin<'auth-ldap', XoAuthLdapPluginConfiguration>

// ===================================================================
// auth-oidc

type XoAuthOidcPluginAdvancedConfiguration = {
  authorizationURL?: string
  callbackURL?: string
  issuer?: string
  /** whitespace separated list of scopes, `openid` is implicitly included */
  scope?: string
  tokenURL?: string
  userInfoURL?: string
  /** field to use as the XO username (e.g. `displayName`, `username` or `email`) */
  usernameField?: string
}

type XoAuthOidcPluginManualAdvancedConfiguration = {
  authorizationURL: string
  callbackURL?: string
  issuer: string
  /** whitespace separated list of scopes, `openid` is implicitly included */
  scope?: string
  tokenURL: string
  userInfoURL: string
  /** field to use as the XO username (e.g. `displayName`, `username` or `email`) */
  usernameField?: string
}

/** either `discoveryURL` or the discoverable settings in `advanced` must be provided */
export type XoAuthOidcPluginConfiguration =
  | {
      advanced?: XoAuthOidcPluginAdvancedConfiguration
      clientID: string
      clientSecret: string
      discoveryURL: string
    }
  | {
      advanced: XoAuthOidcPluginManualAdvancedConfiguration
      clientID: string
      clientSecret: string
      discoveryURL?: string
    }

export type XoAuthOidcPlugin = BaseXoPlugin<'auth-oidc', XoAuthOidcPluginConfiguration>

// ===================================================================
// auth-saml

export type XoAuthSamlPluginConfiguration = {
  callbackUrl?: string
  /** identity provider's certificate */
  cert: string
  disableRequestedAuthnContext?: boolean
  /** entry point of the identity provider */
  entryPoint: string
  forceAuthn?: boolean
  /** issuer string to supply to the identity provider */
  issuer: string
  /** field to use as the XO username */
  usernameField: string
  wantAssertionsSigned?: boolean
  wantAuthnResponseSigned?: boolean
}

export type XoAuthSamlPlugin = BaseXoPlugin<'auth-saml', XoAuthSamlPluginConfiguration>

// ===================================================================
// backup-reports

export type XoBackupReportsPluginConfiguration = {
  /** string added at the end of any backup report email subject */
  customSubject?: string
  toMails?: string[]
  toXmpp?: string[]
}

export type XoBackupReportsPluginTestData = {
  runId: string
}

export type XoBackupReportsPlugin = BaseXoPlugin<'backup-reports', XoBackupReportsPluginConfiguration>

// ===================================================================
// ipmi-sensors

export type XoIpmiSensorsPluginConfiguration = {
  vendors?: {
    /** map of sensor data type > regex pattern with format /pattern/flags (e.g. /^fan[0-9]+$/i) */
    sensorRegexps?: {
      bmcStatus?: string
      cpuTemp?: string
      fanSpeed?: string
      fanStatus?: string
      inletTemp?: string
      ip?: string
      outletTemp?: string
      psuPower?: string
      psuStatus?: string
      totalPower?: string
      unknown?: string
    }
    vendor?: string
  }[]
}

export type XoIpmiSensorsPlugin = BaseXoPlugin<'ipmi-sensors', XoIpmiSensorsPluginConfiguration>

// ===================================================================
// load-balancer

export type XoLoadBalancerPluginConfiguration = {
  advanced?: {
    maxConcurrentMigrations?: number
    /** minimum time (in minutes) before a VM can be migrated again */
    migrationCooldown?: number
  }
  /** VM tags to never migrate specific VMs */
  ignoredVmTags?: string[]
  plans?: {
    /** VM tags to force place VMs on same hosts */
    affinityTags?: string[]
    /** VM tags to force place VMs on different hosts */
    antiAffinityTags?: string[]
    /** `false`: conservative, `'preventive'`: preventive, `true`: vCPU balancing */
    balanceVcpus?: boolean | 'preventive'
    /** hosts that are not affected by the plan */
    excludedHosts?: XoHost['id'][]
    mode: 'Density mode' | 'Performance mode' | 'Simple mode'
    name: string
    /** pools where to apply the policy */
    pools: XoPool['id'][]
    thresholds?: {
      /** CPU (%) */
      cpu?: number
      /** free memory (MB) */
      memoryFree?: number
    }
    /** tags shared by VMs and hosts to restrict placement of these VMs to these hosts */
    vmToHostAffinityTags?: string[]
  }[]
}

export type XoLoadBalancerPlugin = BaseXoPlugin<'load-balancer', XoLoadBalancerPluginConfiguration>

// ===================================================================
// netbox

export type XoNetboxPluginConfiguration = {
  /** enable this if your Netbox instance uses a self-signed SSL certificate */
  allowUnauthorized?: boolean
  /** Netbox URI (e.g. https://netbox.company.net/) */
  endpoint: string
  /** do not import private IPs (RFC 1918) into Netbox */
  ignoreRfc1918?: boolean
  pools: XoPool['id'][]
  /** synchronization interval in hours, auto-sync is disabled if undefined */
  syncInterval?: number
  /** synchronize XO users as Netbox tenants and bind VM creators */
  syncUsers?: boolean
  token: string
}

export type XoNetboxPlugin = BaseXoPlugin<'netbox', XoNetboxPluginConfiguration>

// ===================================================================
// openmetrics

export type XoOpenmetricsPluginConfiguration = {
  /** Prometheus bearer token, generated on first use if undefined */
  secret?: string
}

export type XoOpenmetricsPlugin = BaseXoPlugin<'openmetrics', XoOpenmetricsPluginConfiguration>

// ===================================================================
// perf-alert

type XoPerfAlertPluginMonitorSelection<TId> =
  | {
      /** if true, selected objects will not be monitored */
      excludeUuids?: boolean
      smartMode?: false
      /** objects to monitor */
      uuids: TId[]
    }
  | {
      /** if true, `uuids` will not be monitored */
      excludeUuids?: boolean
      /** monitor all running objects */
      smartMode: true
      /** must be empty unless `excludeUuids` is true */
      uuids?: TId[]
    }

type XoPerfAlertPluginMonitorSettings<TVariableName extends string> = {
  /** threshold, the direction of the crossing is given by the comparator */
  alarmTriggerLevel?: number
  comparator?: '<' | '>'
  variableName?: TVariableName
}

type XoPerfAlertPluginHostMonitor = XoPerfAlertPluginMonitorSelection<XoHost['id']> &
  XoPerfAlertPluginMonitorSettings<'cpuUsage' | 'memoryUsage'> & {
    /** average length (s) */
    alarmTriggerPeriod?: 60 | 600
  }

type XoPerfAlertPluginVmMonitor = XoPerfAlertPluginMonitorSelection<XoVm['id']> &
  XoPerfAlertPluginMonitorSettings<'cpuUsage' | 'memoryUsage'> & {
    /** average length (s) */
    alarmTriggerPeriod?: 60 | 600
  }

type XoPerfAlertPluginSrMonitor = XoPerfAlertPluginMonitorSelection<XoSr['id']> &
  XoPerfAlertPluginMonitorSettings<'storageUsage'>

export type XoPerfAlertPluginConfiguration = {
  /** URL used in alert messages to quickly get to the VMs (ex: https://xoa.company.tld/) */
  baseUrl?: string
  hostMonitors?: XoPerfAlertPluginHostMonitor[]
  srMonitors?: XoPerfAlertPluginSrMonitor[]
  toEmails?: string[]
  vmMonitors?: XoPerfAlertPluginVmMonitor[]
}

export type XoPerfAlertPlugin = BaseXoPlugin<'perf-alert', XoPerfAlertPluginConfiguration>

// ===================================================================
// sdn-controller

export type XoSdnControllerPluginConfiguration = {
  /** directory containing `client-cert.pem`, `client-key.pem` and `ca-cert.pem`, self-signed certificates are created if undefined */
  'cert-dir'?: string
  /** replace already existing SDN controller CA certificate */
  'override-certs'?: boolean
}

export type XoSdnControllerPlugin = BaseXoPlugin<'sdn-controller', XoSdnControllerPluginConfiguration>

// ===================================================================
// test-plugin

export type XoTestPluginPluginConfiguration = {
  foo: string
}

export type XoTestPluginPluginTestData = {
  test: string
}

export type XoTestPluginPlugin = BaseXoPlugin<'test-plugin', XoTestPluginPluginConfiguration>

// ===================================================================
// transport-email

export type XoTransportEmailPluginConfiguration = {
  from: {
    address: string
    name?: string
  }
  transport: {
    host: string
    /** ignore certificates error (e.g. self-signed certificate) */
    ignoreUnauthorized?: boolean
    /** hostname of the local machine, used for identifying to the server */
    name?: string
    password?: string
    /** defaults to 25, or 465 for TLS */
    port?: number
    /** `false`: STARTTLS if available, `'force'`: requires STARTTLS, `'disabled'`: never use STARTTLS, `true`: TLS */
    secure?: boolean | 'disabled' | 'force'
    user?: string
  }
}

export type XoTransportEmailPluginTestData = {
  /** recipient of the test mail */
  to: string
}

export type XoTransportEmailPlugin = BaseXoPlugin<'transport-email', XoTransportEmailPluginConfiguration>

// ===================================================================
// transport-icinga2

export type XoTransportIcinga2PluginConfiguration = {
  acceptUnauthorized?: boolean
  /** e.g. `host.name=="xoa.example.com" && service.name=="xo-backup"` */
  filter?: string
  password?: string
  /** icinga2 server http/https address, port defaults to 5665 */
  server: string
  user?: string
}

export type XoTransportIcinga2Plugin = BaseXoPlugin<'transport-icinga2', XoTransportIcinga2PluginConfiguration>

// ===================================================================
// transport-nagios

export type XoTransportNagiosPluginConfiguration = {
  host?: string
  /** encryption key */
  key: string
  /** NSCA port */
  port: number
  server: string
  service?: string
}

export type XoTransportNagiosPluginTestData = {
  jobName: string
  VmNameLabel: string
}

export type XoTransportNagiosPlugin = BaseXoPlugin<'transport-nagios', XoTransportNagiosPluginConfiguration>

// ===================================================================
// transport-slack

export type XoTransportSlackPluginConfiguration = {
  channel: string
  /** slack emoji or image URL */
  icon_emoji?: string
  username?: string
  /** Mattermost or Slack webhook URL */
  webhookUri: string
}

export type XoTransportSlackPlugin = BaseXoPlugin<'transport-slack', XoTransportSlackPluginConfiguration>

// ===================================================================
// transport-xmpp

export type XoTransportXmppPluginConfiguration = {
  host?: string
  /** XMPP address to use to authenticate */
  jid: string
  password: string
  port?: number
}

export type XoTransportXmppPlugin = BaseXoPlugin<'transport-xmpp', XoTransportXmppPluginConfiguration>

// ===================================================================
// usage-report

export type XoUsageReportPluginConfiguration = {
  /** include all resources' stats */
  all?: boolean
  emails: string[]
  periodicity: 'daily' | 'monthly' | 'weekly'
}

export type XoUsageReportPlugin = BaseXoPlugin<'usage-report', XoUsageReportPluginConfiguration>

// ===================================================================
// web-hooks

export type XoWebHooksPluginConfiguration = {
  hooks: {
    format: 'json' | 'office365'
    /** XO API method to be bound to */
    method: string
    type: 'post' | 'pre' | 'pre/post'
    url: string
    /** wait for the server response before executing the call, only available on `pre` type */
    waitForResponse?: boolean
  }[]
}

export type XoWebHooksPlugin = BaseXoPlugin<'web-hooks', XoWebHooksPluginConfiguration>

// ===================================================================

export type XoPluginConfiguration =
  | XoAuditPluginConfiguration
  | XoAuthGithubPluginConfiguration
  | XoAuthGooglePluginConfiguration
  | XoAuthLdapPluginConfiguration
  | XoAuthOidcPluginConfiguration
  | XoAuthSamlPluginConfiguration
  | XoBackupReportsPluginConfiguration
  | XoIpmiSensorsPluginConfiguration
  | XoLoadBalancerPluginConfiguration
  | XoNetboxPluginConfiguration
  | XoOpenmetricsPluginConfiguration
  | XoPerfAlertPluginConfiguration
  | XoSdnControllerPluginConfiguration
  | XoTestPluginPluginConfiguration
  | XoTransportEmailPluginConfiguration
  | XoTransportIcinga2PluginConfiguration
  | XoTransportNagiosPluginConfiguration
  | XoTransportSlackPluginConfiguration
  | XoTransportXmppPluginConfiguration
  | XoUsageReportPluginConfiguration
  | XoWebHooksPluginConfiguration

export type XoPluginTestData =
  | XoAuthLdapPluginTestData
  | XoBackupReportsPluginTestData
  | XoTestPluginPluginTestData
  | XoTransportEmailPluginTestData
  | XoTransportNagiosPluginTestData
