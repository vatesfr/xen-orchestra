import type { Branded } from '@vates/types'

export type SubscriberId = Branded<'Subscriber'>

export type ListenerType = 'ping'

export type EventType = 'init' | 'ping'
