import type { Branded, XapiXoRecord, XoUser } from '@vates/types'
import type { AnyPrivilege } from '@xen-orchestra/acl'

export type SubscriberId = Branded<'Subscriber'>

export type XapiListenerType = XapiXoRecord['type']

export type NonXapiListenerType =
  | 'alarm'
  | 'task'
  | 'user'
  | 'group'
  | 'acl-privilege'
  | 'acl-role'
  | 'plugin'
  | 'proxy'
  | 'server'
  | 'backup-repository'
  | 'backup-job'
  | 'backup-archive'
  | 'schedule'
  | 'authentication_token'
  | 'backup-log'

export type XoListenerType = XapiListenerType | NonXapiListenerType

export type ListenerType = XoListenerType | 'ping'

export type CollectionEventType = 'add' | 'update' | 'remove'

export type EventType = CollectionEventType | 'ping'

export type UserPrivileges = { user: XoUser; userPrivileges: AnyPrivilege[] }
