import type { Branded, XapiXoRecord } from '@vates/types'

export type SubscriberId = Branded<'Subscriber'>

export type XoListenerType = XapiXoRecord['type'] | 'alarm' | 'task'

export type ListenerType = XoListenerType | 'ping'

export type CollectionEventType = 'add' | 'update' | 'remove'

export type EventType = CollectionEventType | 'ping'
