import type { Branded, XapiXoRecord } from '@vates/types'

export type SubscriberId = Branded<'Subscriber'>

export type XapiListenerType = XapiXoRecord['type']

export type NonXapiListenerType =
  | 'alarm'
  | 'task'
  | 'user'
  | 'group'
  | 'acl-privilege'
  | 'acl-role'
  | 'proxy'
  | 'server'
  | 'backup-repository'
  | 'backup-job'
  | 'schedule'

export type XoListenerType = XapiListenerType | NonXapiListenerType

export type ListenerType = XoListenerType | 'ping'

export type CollectionEventType = 'add' | 'update' | 'remove'

export type EventType = CollectionEventType | 'ping'
