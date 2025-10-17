import type { Branded, XapiXoRecord } from '@vates/types'

export type SubscriberId = Branded<'Subscriber'>

export type XapiXoListenerType = XapiXoRecord['type'] | 'alarm'

export type ListenerType = XapiXoListenerType | 'ping'

export type CollectionEventType = 'add' | 'update' | 'remove'

export type EventType = CollectionEventType | 'init' | 'ping'
