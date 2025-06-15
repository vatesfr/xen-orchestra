import { Widget } from '@core/packages/story/story-widget.ts'
import type { MaybeRef } from '@vueuse/core'
import type { InjectionKey, Ref } from 'vue'

export type StoryEventLogs = { name: string; args: { name: string; value: any }[] }[]

export const IK_STORY_EVENT_LOGS = Symbol('IK_STORY_EVENT_LOGS') as InjectionKey<Ref<StoryEventLogs>>

export type PropConfig = {
  preset?: MaybeRef
  type?: string
  required?: boolean
  default?: unknown
  widget?: boolean | Widget
  help?: string
}

export type EventConfig = {
  handler?: (...args: any[]) => void
  args?: Record<string, string>
  help?: string
}

export type SlotConfig = {
  help?: string
  props?: Record<string, string>
}

export type SettingConfig = {
  preset: MaybeRef
  help?: string
  widget?: Widget
}

export type StoryMeta = {
  isStory: boolean
  pathParts: string[]
  label: string
  rootPath: string
  markdownPath: string | undefined
}
