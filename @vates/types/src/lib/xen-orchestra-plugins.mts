import type { Branded } from '../common.mjs'

// ===================================================================
// used to check that each schema matches its configuration type

type XoPluginJsonSchemaKey<T> = T extends unknown ? Extract<keyof T, string> : never

type XoPluginJsonSchemaValue<T, K extends string> = T extends unknown ? (K extends keyof T ? T[K] : never) : never

type XoPluginJsonSchemaAnnotations<T> = {
  default?: T
  description?: string
  title?: string
}

type IsOpenScalar<T> = string extends T ? true : number extends T ? true : [T] extends [boolean] ? true : false

type XoPluginJsonSchemaTypeName<T> = T extends string
  ? 'string'
  : T extends number
    ? 'integer' | 'number'
    : T extends boolean
      ? 'boolean'
      : never

type XoPluginScalarJsonSchemaOf<T> = XoPluginJsonSchemaAnnotations<T> & {
  $multiline?: boolean
  $type?: string
  enumNames?: string[]
  minimum?: number
} & (IsOpenScalar<T> extends true
    ? { enum?: T[]; type: XoPluginJsonSchemaTypeName<T> }
    : { enum: T[]; type?: XoPluginJsonSchemaTypeName<T> })

type XoPluginArrayJsonSchemaOf<Item> = XoPluginJsonSchemaAnnotations<Item[]> & {
  items: XoPluginJsonSchemaOf<Item>
  maxItems?: number
  minItems?: number
  type: 'array'
}

type XoPluginJsonSchemaConstraintOf<T> = Partial<XoPluginJsonSchemaOf<T>> & {
  anyOf?: (Partial<XoPluginJsonSchemaOf<T>> & { const?: T; not?: Record<string, never> })[]
  const?: T
}

type XoPluginObjectJsonSchemaConstraintOf<T> = {
  properties?: {
    [K in XoPluginJsonSchemaKey<T>]?: XoPluginJsonSchemaConstraintOf<Exclude<XoPluginJsonSchemaValue<T, K>, undefined>>
  }
  required?: XoPluginJsonSchemaKey<T>[]
}

// union members are merged property by property
type XoPluginObjectJsonSchemaOf<T> = XoPluginJsonSchemaAnnotations<T> & {
  additionalProperties?: boolean
  anyOf?: XoPluginObjectJsonSchemaConstraintOf<T>[]
  oneOf?: XoPluginObjectJsonSchemaConstraintOf<T>[]
  properties: {
    [K in XoPluginJsonSchemaKey<T>]: XoPluginJsonSchemaOf<Exclude<XoPluginJsonSchemaValue<T, K>, undefined>>
  }
  required?: XoPluginJsonSchemaKey<T>[]
  type: 'object'
}

type XoPluginJsonSchemaOf<T> = [T] extends [readonly (infer Item)[]]
  ? XoPluginArrayJsonSchemaOf<Item>
  : [T] extends [boolean | number | string]
    ? XoPluginScalarJsonSchemaOf<T>
    : XoPluginObjectJsonSchemaOf<T>

// ===================================================================

type BaseXoPlugin<
  Name extends string,
  Configuration,
  ConfigurationSchema extends XoPluginObjectJsonSchemaOf<Configuration>,
  Testable extends boolean = false,
> = {
  autoload: boolean
  /** secret values (e.g. passwords) are obfuscated */
  configuration?: Configuration
  /** JSON schema describing the expected configuration */
  configurationSchema: ConfigurationSchema
  /**
   * whether the plugin can be loaded: not configurable, configured, or accepting an empty configuration
   * (in which case it has no saved `configuration`)
   */
  configured: boolean
  description?: string
  id: Branded<'plugin'>
  keywords?: string[]
  loaded?: boolean
  loading?: boolean
  name: Name
  testable: Testable
  unloadable: true
  version?: string
}

type XoPluginWithTestSchema<TestData, TestSchema extends XoPluginObjectJsonSchemaOf<TestData>> = {
  /** JSON schema describing the data expected by the plugin test */
  testSchema: TestSchema
}

// ===================================================================
// audit

type XoAuditPluginConfiguration = {
  /** whether to save user actions in the audit log */
  active?: boolean
}

type XoAuditPluginConfigurationSchema = {
  properties: { active: { description: string; type: 'boolean' } }
  type: 'object'
}

export type XoAuditPlugin = BaseXoPlugin<'audit', XoAuditPluginConfiguration, XoAuditPluginConfigurationSchema>

// ===================================================================
// auth-github

type XoAuthGithubPluginConfiguration = {
  clientID: string
  clientSecret: string
}

type XoAuthGithubPluginConfigurationSchema = {
  properties: { clientID: { type: 'string' }; clientSecret: { type: 'string' } }
  required: ('clientID' | 'clientSecret')[]
  type: 'object'
}

export type XoAuthGithubPlugin = BaseXoPlugin<
  'auth-github',
  XoAuthGithubPluginConfiguration,
  XoAuthGithubPluginConfigurationSchema
>

// ===================================================================
// auth-google

type XoAuthGooglePluginConfiguration = {
  /** must be exactly the same as specified on the Google developer console */
  callbackURL: string
  clientID: string
  clientSecret: string
  /** changing this value will break existing users */
  scope?: 'https://www.googleapis.com/auth/plus.login' | 'email'
}

type XoAuthGooglePluginConfigurationSchema = {
  properties: {
    callbackURL: { description: string; type: 'string' }
    clientID: { type: 'string' }
    clientSecret: { type: 'string' }
    scope: {
      default: 'email' | 'https://www.googleapis.com/auth/plus.login'
      description: string
      enum: ('email' | 'https://www.googleapis.com/auth/plus.login')[]
      enumNames: string[]
    }
  }
  required: ('callbackURL' | 'clientID' | 'clientSecret')[]
  type: 'object'
}

export type XoAuthGooglePlugin = BaseXoPlugin<
  'auth-google',
  XoAuthGooglePluginConfiguration,
  XoAuthGooglePluginConfigurationSchema
>

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

type XoAuthLdapPluginConfiguration = XoAuthLdapPluginDomain & {
  /** extra LDAP domains tried in order when the primary domain returns no match */
  additionalDomains?: XoAuthLdapPluginDomain[]
}

type XoAuthLdapPluginTestData = {
  password: string
  username: string
}

type XoAuthLdapPluginDomainSchema = {
  properties: {
    base: { description: string; title: string; type: 'string' }
    bind: {
      description: string
      properties: { dn: { description: string; type: 'string' }; password: { description: string; type: 'string' } }
      required: ('dn' | 'password')[]
      title: string
      type: 'object'
    }
    certificateAuthorities: { description: string; items: { type: 'string' }; title: string; type: 'array' }
    checkCertificate: { default: boolean; description: string; title: string; type: 'boolean' }
    failoverUris: { description: string; items: { type: 'string' }; title: string; type: 'array' }
    filter: { default: string; description: string; title: string; type: 'string' }
    groups: {
      description: string
      properties: {
        base: { description: string; title: string; type: 'string' }
        displayNameAttribute: { description: string; title: string; type: 'string' }
        filter: { description: string; title: string; type: 'string' }
        idAttribute: { description: string; title: string; type: 'string' }
        membersMapping: {
          properties: {
            groupAttribute: { description: string; title: string; type: 'string' }
            userAttribute: { description: string; title: string; type: 'string' }
          }
          required: ('groupAttribute' | 'userAttribute')[]
          title: string
          type: 'object'
        }
      }
      required: ('base' | 'displayNameAttribute' | 'filter' | 'idAttribute' | 'membersMapping')[]
      title: string
      type: 'object'
    }
    startTls: { title: string; type: 'boolean' }
    uri: { description: string; title: string; type: 'string' }
    userIdAttribute: { description: string; title: string; type: 'string' }
  }
  required: ('base' | 'uri' | 'userIdAttribute')[]
  type: 'object'
}

type XoAuthLdapPluginConfigurationSchema = XoAuthLdapPluginDomainSchema & {
  properties: {
    additionalDomains: { description: string; items: XoAuthLdapPluginDomainSchema; title: string; type: 'array' }
  }
}

type XoAuthLdapPluginTestSchema = {
  properties: { password: { description: string; type: 'string' }; username: { description: string; type: 'string' } }
  required: ('password' | 'username')[]
  type: 'object'
}

export type XoAuthLdapPlugin = BaseXoPlugin<
  'auth-ldap',
  XoAuthLdapPluginConfiguration,
  XoAuthLdapPluginConfigurationSchema,
  true
> &
  XoPluginWithTestSchema<XoAuthLdapPluginTestData, XoAuthLdapPluginTestSchema>

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
type XoAuthOidcPluginConfiguration =
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

type XoAuthOidcPluginConfigurationSchema = {
  anyOf: (
    | { required: 'discoveryURL'[] }
    | {
        properties: {
          advanced: { required: ('authorizationURL' | 'issuer' | 'tokenURL' | 'userInfoURL')[]; type: 'object' }
        }
        required: 'advanced'[]
      }
  )[]
  properties: {
    advanced: {
      default: {
        authorizationURL?: string
        callbackURL?: string
        issuer?: string
        scope?: string
        tokenURL?: string
        userInfoURL?: string
        usernameField?: string
      }
      properties: {
        authorizationURL: { title: string; type: 'string' }
        callbackURL: { default: string; description: string; title: string; type: 'string' }
        issuer: { title: string; type: 'string' }
        scope: { default: string; description: string; title: string; type: 'string' }
        tokenURL: { title: string; type: 'string' }
        userInfoURL: { title: string; type: 'string' }
        usernameField: { default: string; description: string; title: string; type: 'string' }
      }
      title: string
      type: 'object'
    }
    clientID: { description: string; title: string; type: 'string' }
    clientSecret: { description: string; title: string; type: 'string' }
    discoveryURL: { description: string; title: string; type: 'string' }
  }
  required: ('clientID' | 'clientSecret')[]
  type: 'object'
}

export type XoAuthOidcPlugin = BaseXoPlugin<
  'auth-oidc',
  XoAuthOidcPluginConfiguration,
  XoAuthOidcPluginConfigurationSchema
>

// ===================================================================
// auth-saml

type XoAuthSamlPluginConfiguration = {
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

type XoAuthSamlPluginConfigurationSchema = {
  description: string
  properties: {
    callbackUrl: { description: string; title: string; type: 'string' }
    cert: { $multiline: true; description: string; title: string; type: 'string' }
    disableRequestedAuthnContext: { default: boolean; description: string; title: string; type: 'boolean' }
    entryPoint: { description: string; title: string; type: 'string' }
    forceAuthn: { default: boolean; description: string; title: string; type: 'boolean' }
    issuer: { description: string; title: string; type: 'string' }
    usernameField: { description: string; title: string; type: 'string' }
    wantAssertionsSigned: { default: boolean; description: string; title: string; type: 'boolean' }
    wantAuthnResponseSigned: { default: boolean; description: string; title: string; type: 'boolean' }
  }
  required: ('cert' | 'entryPoint' | 'issuer' | 'usernameField')[]
  type: 'object'
}

export type XoAuthSamlPlugin = BaseXoPlugin<
  'auth-saml',
  XoAuthSamlPluginConfiguration,
  XoAuthSamlPluginConfigurationSchema
>

// ===================================================================
// backup-reports

type XoBackupReportsPluginConfiguration = {
  /** string added at the end of any backup report email subject */
  customSubject?: string
  toMails?: string[]
  toXmpp?: string[]
}

type XoBackupReportsPluginTestData = {
  runId: string
}

type XoBackupReportsPluginConfigurationSchema = {
  properties: {
    customSubject: { description: string; title: string; type: 'string' }
    toMails: { description: string; items: { type: 'string' }; minItems: number; title: string; type: 'array' }
    toXmpp: { description: string; items: { type: 'string' }; minItems: number; title: string; type: 'array' }
  }
  type: 'object'
}

type XoBackupReportsPluginTestSchema = {
  additionalProperties: false
  properties: { runId: { description: string; type: 'string' } }
  required: 'runId'[]
  type: 'object'
}

export type XoBackupReportsPlugin = BaseXoPlugin<
  'backup-reports',
  XoBackupReportsPluginConfiguration,
  XoBackupReportsPluginConfigurationSchema,
  true
> &
  XoPluginWithTestSchema<XoBackupReportsPluginTestData, XoBackupReportsPluginTestSchema>

// ===================================================================
// ipmi-sensors

type XoIpmiSensorsPluginConfiguration = {
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

type XoIpmiSensorsPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    vendors: {
      default: {
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
      description: string
      items: {
        description: string
        properties: {
          sensorRegexps: {
            description: string
            properties: {
              bmcStatus: { default: string; type: 'string' }
              cpuTemp: { default: string; type: 'string' }
              fanSpeed: { default: string; type: 'string' }
              fanStatus: { default: string; type: 'string' }
              inletTemp: { default: string; type: 'string' }
              ip: { default: string; type: 'string' }
              outletTemp: { default: string; type: 'string' }
              psuPower: { default: string; type: 'string' }
              psuStatus: { default: string; type: 'string' }
              totalPower: { default: string; type: 'string' }
              unknown: { default: string; type: 'string' }
            }
            type: 'object'
          }
          vendor: { default: string; type: 'string' }
        }
        title: string
        type: 'object'
      }
      title: string
      type: 'array'
    }
  }
  type: 'object'
}

export type XoIpmiSensorsPlugin = BaseXoPlugin<
  'ipmi-sensors',
  XoIpmiSensorsPluginConfiguration,
  XoIpmiSensorsPluginConfigurationSchema
> & {
  configurationPresets: { default: XoIpmiSensorsPluginConfiguration }
}

// ===================================================================
// load-balancer

type XoLoadBalancerPluginConfiguration = {
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
    excludedHosts?: string[]
    mode: 'Density mode' | 'Performance mode' | 'Simple mode'
    name: string
    /** pools where to apply the policy */
    pools: string[]
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

type XoLoadBalancerPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    advanced: {
      default: { maxConcurrentMigrations?: number; migrationCooldown?: number }
      properties: {
        maxConcurrentMigrations: {
          default: number
          description: string
          minimum: number
          title: string
          type: 'integer'
        }
        migrationCooldown: { default: number; description: string; minimum: number; title: string; type: 'integer' }
      }
      title: string
      type: 'object'
    }
    ignoredVmTags: { description: string; items: { $type: 'Tag'; type: 'string' }; title: string; type: 'array' }
    plans: {
      description: string
      items: {
        properties: {
          affinityTags: { description: string; items: { $type: 'Tag'; type: 'string' }; title: string; type: 'array' }
          antiAffinityTags: {
            description: string
            items: { $type: 'Tag'; type: 'string' }
            title: string
            type: 'array'
          }
          balanceVcpus: {
            default: 'preventive' | false | true
            description: string
            enum: ('preventive' | false | true)[]
            enumNames: string[]
            title: string
          }
          excludedHosts: { description: string; items: { $type: 'Host'; type: 'string' }; title: string; type: 'array' }
          mode: { enum: ('Density mode' | 'Performance mode' | 'Simple mode')[]; title: string }
          name: { title: string; type: 'string' }
          pools: { description: string; items: { $type: 'Pool'; type: 'string' }; type: 'array' }
          thresholds: {
            properties: {
              cpu: { default: number; title: string; type: 'integer' }
              memoryFree: { default: number; title: string; type: 'integer' }
            }
            title: string
            type: 'object'
          }
          vmToHostAffinityTags: {
            description: string
            items: { $type: 'Tag'; type: 'string' }
            title: string
            type: 'array'
          }
        }
        required: ('mode' | 'name' | 'pools')[]
        title: string
        type: 'object'
      }
      minItems: number
      title: string
      type: 'array'
    }
  }
  type: 'object'
}

export type XoLoadBalancerPlugin = BaseXoPlugin<
  'load-balancer',
  XoLoadBalancerPluginConfiguration,
  XoLoadBalancerPluginConfigurationSchema
>

// ===================================================================
// netbox

type XoNetboxPluginConfiguration = {
  /** enable this if your Netbox instance uses a self-signed SSL certificate */
  allowUnauthorized?: boolean
  /** Netbox URI (e.g. https://netbox.company.net/) */
  endpoint: string
  /** do not import private IPs (RFC 1918) into Netbox */
  ignoreRfc1918?: boolean
  pools: string[]
  /** synchronization interval in hours, auto-sync is disabled if undefined */
  syncInterval?: number
  /** synchronize XO users as Netbox tenants and bind VM creators */
  syncUsers?: boolean
  token: string
}

type XoNetboxPluginConfigurationSchema = {
  description: string
  properties: {
    allowUnauthorized: { description: string; title: string; type: 'boolean' }
    endpoint: { description: string; title: string; type: 'string' }
    ignoreRfc1918: { description: string; title: string; type: 'boolean' }
    pools: { description: string; items: { $type: 'pool'; type: 'string' }; title: string; type: 'array' }
    syncInterval: { description: string; title: string; type: 'number' }
    syncUsers: { description: string; title: string; type: 'boolean' }
    token: { description: string; title: string; type: 'string' }
  }
  required: ('endpoint' | 'pools' | 'token')[]
  type: 'object'
}

export type XoNetboxPlugin = BaseXoPlugin<
  'netbox',
  XoNetboxPluginConfiguration,
  XoNetboxPluginConfigurationSchema,
  true
>

// ===================================================================
// openmetrics

type XoOpenmetricsPluginConfiguration = {
  /** Prometheus bearer token, generated on first use if undefined */
  secret?: string
}

type XoOpenmetricsPluginConfigurationSchema = {
  additionalProperties: false
  properties: { secret: { description: string; title: string; type: 'string' } }
  type: 'object'
}

export type XoOpenmetricsPlugin = BaseXoPlugin<
  'openmetrics',
  XoOpenmetricsPluginConfiguration,
  XoOpenmetricsPluginConfigurationSchema
>

// ===================================================================
// perf-alert

type XoPerfAlertPluginMonitorSelection =
  | {
      /** if true, selected objects will not be monitored */
      excludeUuids?: boolean
      smartMode?: false
      /** objects to monitor */
      uuids: string[]
    }
  | {
      /** if true, `uuids` will not be monitored */
      excludeUuids?: boolean
      /** monitor all running objects */
      smartMode: true
      /** must be empty unless `excludeUuids` is true */
      uuids?: string[]
    }

type XoPerfAlertPluginMonitorSettings<TVariableName extends string> = {
  /** threshold, the direction of the crossing is given by the comparator */
  alarmTriggerLevel?: number
  comparator?: '<' | '>'
  variableName?: TVariableName
}

type XoPerfAlertPluginHostMonitor = XoPerfAlertPluginMonitorSelection &
  XoPerfAlertPluginMonitorSettings<'cpuUsage' | 'memoryUsage'> & {
    /** average length (s) */
    alarmTriggerPeriod?: 60 | 600
  }

type XoPerfAlertPluginVmMonitor = XoPerfAlertPluginMonitorSelection &
  XoPerfAlertPluginMonitorSettings<'cpuUsage' | 'memoryUsage'> & {
    /** average length (s) */
    alarmTriggerPeriod?: 60 | 600
  }

type XoPerfAlertPluginSrMonitor = XoPerfAlertPluginMonitorSelection & XoPerfAlertPluginMonitorSettings<'storageUsage'>

type XoPerfAlertPluginConfiguration = {
  /** URL used in alert messages to quickly get to the VMs (ex: https://xoa.company.tld/) */
  baseUrl?: string
  hostMonitors?: XoPerfAlertPluginHostMonitor[]
  srMonitors?: XoPerfAlertPluginSrMonitor[]
  toEmails?: string[]
  vmMonitors?: XoPerfAlertPluginVmMonitor[]
}

type XoPerfAlertPluginMonitorSelectionSchema =
  | {
      properties: {
        excludeUuids: { anyOf: ({ not: Record<string, never> } | { const: true } | { const: false })[] }
        smartMode: { anyOf: ({ not: Record<string, never> } | { const: false })[] }
        uuids: { minItems: number; type: 'array' }
      }
      required: 'uuids'[]
    }
  | {
      properties: {
        smartMode: { const: true }
        uuids: { anyOf: ({ not: Record<string, never> } | { maxItems: number; type: 'array' })[] }
      }
      required: 'smartMode'[]
    }
  | {
      properties: {
        excludeUuids: { const: true }
        smartMode: { const: true }
        uuids: { minItems: number; type: 'array' }
      }
      required: ('excludeUuids' | 'smartMode' | 'uuids')[]
    }

type XoPerfAlertPluginConfigurationSchema = {
  properties: {
    baseUrl: { description: string; title: string; type: 'string' }
    hostMonitors: {
      description: string
      items: {
        oneOf: XoPerfAlertPluginMonitorSelectionSchema[]
        properties: {
          alarmTriggerLevel: { default: number; description: string; title: string; type: 'number' }
          alarmTriggerPeriod: {
            default: 60 | 600
            description: string
            enum: (60 | 600)[]
            title: string
            type: 'number'
          }
          comparator: { default: '<' | '>'; enum: ('<' | '>')[]; title: string; type: 'string' }
          excludeUuids: { description: string; title: string; type: 'boolean' }
          smartMode: { default: boolean; description: string; title: string; type: 'boolean' }
          uuids: { description: string; items: { $type: 'Host'; type: 'string' }; title: string; type: 'array' }
          variableName: {
            default: 'cpuUsage' | 'memoryUsage'
            description: string
            enum: ('cpuUsage' | 'memoryUsage')[]
            title: string
            type: 'string'
          }
        }
        type: 'object'
      }
      title: string
      type: 'array'
    }
    srMonitors: {
      description: string
      items: {
        oneOf: XoPerfAlertPluginMonitorSelectionSchema[]
        properties: {
          alarmTriggerLevel: { default: number; description: string; title: string; type: 'number' }
          comparator: { default: '<' | '>'; enum: ('<' | '>')[]; title: string; type: 'string' }
          excludeUuids: { description: string; title: string; type: 'boolean' }
          smartMode: { default: boolean; description: string; title: string; type: 'boolean' }
          uuids: { description: string; items: { $type: 'SR'; type: 'string' }; title: string; type: 'array' }
          variableName: {
            default: 'storageUsage'
            description: string
            enum: 'storageUsage'[]
            title: string
            type: 'string'
          }
        }
        type: 'object'
      }
      title: string
      type: 'array'
    }
    toEmails: { description: string; items: { type: 'string' }; minItems: number; title: string; type: 'array' }
    vmMonitors: {
      description: string
      items: {
        oneOf: XoPerfAlertPluginMonitorSelectionSchema[]
        properties: {
          alarmTriggerLevel: { default: number; description: string; title: string; type: 'number' }
          alarmTriggerPeriod: {
            default: 60 | 600
            description: string
            enum: (60 | 600)[]
            title: string
            type: 'number'
          }
          comparator: { default: '<' | '>'; enum: ('<' | '>')[]; title: string; type: 'string' }
          excludeUuids: { description: string; title: string; type: 'boolean' }
          smartMode: { default: boolean; description: string; title: string; type: 'boolean' }
          uuids: { description: string; items: { $type: 'VM'; type: 'string' }; title: string; type: 'array' }
          variableName: {
            default: 'cpuUsage' | 'memoryUsage'
            description: string
            enum: ('cpuUsage' | 'memoryUsage')[]
            title: string
            type: 'string'
          }
        }
        type: 'object'
      }
      title: string
      type: 'array'
    }
  }
  type: 'object'
}

export type XoPerfAlertPlugin = BaseXoPlugin<
  'perf-alert',
  XoPerfAlertPluginConfiguration,
  XoPerfAlertPluginConfigurationSchema,
  true
>

// ===================================================================
// sdn-controller

type XoSdnControllerPluginConfiguration = {
  /** directory containing `client-cert.pem`, `client-key.pem` and `ca-cert.pem`, self-signed certificates are created if undefined */
  'cert-dir'?: string
  /** replace already existing SDN controller CA certificate */
  'override-certs'?: boolean
}

type XoSdnControllerPluginConfigurationSchema = {
  properties: {
    'cert-dir': { description: string; type: 'string' }
    'override-certs': { default: boolean; description: string; type: 'boolean' }
  }
  type: 'object'
}

export type XoSdnControllerPlugin = BaseXoPlugin<
  'sdn-controller',
  XoSdnControllerPluginConfiguration,
  XoSdnControllerPluginConfigurationSchema
>

// ===================================================================
// test-plugin

type XoTestPluginPluginConfiguration = {
  foo: string
}

type XoTestPluginPluginTestData = {
  test: string
}

type XoTestPluginPluginConfigurationSchema = {
  properties: { foo: { description: string; title: string; type: 'string' } }
  required: 'foo'[]
  type: 'object'
}

type XoTestPluginPluginTestSchema = {
  properties: { test: { type: 'string' } }
  required: 'test'[]
  type: 'object'
}

export type XoTestPluginPlugin = BaseXoPlugin<
  'test-plugin',
  XoTestPluginPluginConfiguration,
  XoTestPluginPluginConfigurationSchema,
  true
> &
  XoPluginWithTestSchema<XoTestPluginPluginTestData, XoTestPluginPluginTestSchema>

// ===================================================================
// transport-email

type XoTransportEmailPluginConfiguration = {
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

type XoTransportEmailPluginTestData = {
  /** recipient of the test mail */
  to: string
}

type XoTransportEmailPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    from: {
      additionalProperties: false
      properties: { address: { description: string; type: 'string' }; name: { description: string; type: 'string' } }
      required: 'address'[]
      type: 'object'
    }
    transport: {
      additionalProperties: false
      properties: {
        host: { description: string; type: 'string' }
        ignoreUnauthorized: { description: string; type: 'boolean' }
        name: { description: string; title: string; type: 'string' }
        password: { description: string; type: 'string' }
        port: { description: string; type: 'integer' }
        secure: {
          default: 'disabled' | 'force' | false | true
          description: string
          enum: ('disabled' | 'force' | false | true)[]
          enumNames: string[]
        }
        user: { description: string; type: 'string' }
      }
      required: 'host'[]
      type: 'object'
    }
  }
  required: ('from' | 'transport')[]
  type: 'object'
}

type XoTransportEmailPluginTestSchema = {
  additionalProperties: false
  properties: { to: { description: string; type: 'string' } }
  required: 'to'[]
  type: 'object'
}

export type XoTransportEmailPlugin = BaseXoPlugin<
  'transport-email',
  XoTransportEmailPluginConfiguration,
  XoTransportEmailPluginConfigurationSchema,
  true
> &
  XoPluginWithTestSchema<XoTransportEmailPluginTestData, XoTransportEmailPluginTestSchema>

// ===================================================================
// transport-icinga2

type XoTransportIcinga2PluginConfiguration = {
  acceptUnauthorized?: boolean
  /** e.g. `host.name=="xoa.example.com" && service.name=="xo-backup"` */
  filter?: string
  password?: string
  /** icinga2 server http/https address, port defaults to 5665 */
  server: string
  user?: string
}

type XoTransportIcinga2PluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    acceptUnauthorized: { default: boolean; description: string; type: 'boolean' }
    filter: { description: string; type: 'string' }
    password: { description: string; type: 'string' }
    server: { description: string; type: 'string' }
    user: { description: string; type: 'string' }
  }
  required: 'server'[]
  type: 'object'
}

export type XoTransportIcinga2Plugin = BaseXoPlugin<
  'transport-icinga2',
  XoTransportIcinga2PluginConfiguration,
  XoTransportIcinga2PluginConfigurationSchema,
  true
>

// ===================================================================
// transport-nagios

type XoTransportNagiosPluginConfiguration = {
  host?: string
  /** encryption key */
  key: string
  /** NSCA port */
  port: number
  server: string
  service?: string
}

type XoTransportNagiosPluginTestData = {
  jobName: string
  VmNameLabel: string
}

type XoTransportNagiosPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    host: { default: string; description: string; type: 'string' }
    key: { description: string; type: 'string' }
    port: { description: string; type: 'integer' }
    server: { description: string; type: 'string' }
    service: { default: string; description: string; type: 'string' }
  }
  required: ('key' | 'port' | 'server')[]
  type: 'object'
}

type XoTransportNagiosPluginTestSchema = {
  properties: {
    VmNameLabel: { description: string; title: string; type: 'string' }
    jobName: { description: string; title: string; type: 'string' }
  }
  required: ('VmNameLabel' | 'jobName')[]
  type: 'object'
}

export type XoTransportNagiosPlugin = BaseXoPlugin<
  'transport-nagios',
  XoTransportNagiosPluginConfiguration,
  XoTransportNagiosPluginConfigurationSchema,
  true
> &
  XoPluginWithTestSchema<XoTransportNagiosPluginTestData, XoTransportNagiosPluginTestSchema>

// ===================================================================
// transport-slack

type XoTransportSlackPluginConfiguration = {
  channel: string
  /** slack emoji or image URL */
  icon_emoji?: string
  username?: string
  /** Mattermost or Slack webhook URL */
  webhookUri: string
}

type XoTransportSlackPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    channel: { description: string; type: 'string' }
    icon_emoji: { description: string; type: 'string' }
    username: { description: string; type: 'string' }
    webhookUri: { description: string; type: 'string' }
  }
  required: ('channel' | 'webhookUri')[]
  type: 'object'
}

export type XoTransportSlackPlugin = BaseXoPlugin<
  'transport-slack',
  XoTransportSlackPluginConfiguration,
  XoTransportSlackPluginConfigurationSchema,
  true
>

// ===================================================================
// transport-xmpp

type XoTransportXmppPluginConfiguration = {
  host?: string
  /** XMPP address to use to authenticate */
  jid: string
  password: string
  port?: number
}

type XoTransportXmppPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    host: { description: string; type: 'string' }
    jid: { description: string; title: string; type: 'string' }
    password: { description: string; type: 'string' }
    port: { default: number; description: string; type: 'integer' }
  }
  required: ('jid' | 'password')[]
  type: 'object'
}

export type XoTransportXmppPlugin = BaseXoPlugin<
  'transport-xmpp',
  XoTransportXmppPluginConfiguration,
  XoTransportXmppPluginConfigurationSchema
>

// ===================================================================
// usage-report

type XoUsageReportPluginConfiguration = {
  /** include all resources' stats */
  all?: boolean
  emails: string[]
  periodicity: 'daily' | 'monthly' | 'weekly'
}

type XoUsageReportPluginConfigurationSchema = {
  additionalProperties: false
  properties: {
    all: { description: string; type: 'boolean' }
    emails: { items: { type: 'string' }; type: 'array' }
    periodicity: { description: string; enum: ('daily' | 'monthly' | 'weekly')[]; type: 'string' }
  }
  required: ('emails' | 'periodicity')[]
  type: 'object'
}

export type XoUsageReportPlugin = BaseXoPlugin<
  'usage-report',
  XoUsageReportPluginConfiguration,
  XoUsageReportPluginConfigurationSchema,
  true
>

// ===================================================================
// web-hooks

type XoWebHooksPluginConfiguration = {
  hooks: {
    format?: 'json' | 'office365'
    /** XO API method to be bound to */
    method: string
    type: 'post' | 'pre' | 'pre/post'
    url: string
    /** wait for the server response before executing the call, only available on `pre` type */
    waitForResponse?: boolean
  }[]
}

type XoWebHooksPluginConfigurationSchema = {
  description: string
  properties: {
    hooks: {
      items: {
        properties: {
          format: {
            default: 'json' | 'office365'
            description: string
            enum: ('json' | 'office365')[]
            enumNames: string[]
            title: string
          }
          method: { description: string; enum: string[]; title: string; type: 'string' }
          type: { description: string; enum: ('post' | 'pre' | 'pre/post')[]; title: string; type: 'string' }
          url: { description: string; title: string; type: 'string' }
          waitForResponse: { description: string; title: string; type: 'boolean' }
        }
        required: ('format' | 'method' | 'type' | 'url')[]
        title: string
        type: 'object'
      }
      title: string
      type: 'array'
    }
  }
  required: 'hooks'[]
  type: 'object'
}

export type XoWebHooksPlugin = BaseXoPlugin<
  'web-hooks',
  XoWebHooksPluginConfiguration,
  XoWebHooksPluginConfigurationSchema,
  true
>

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
