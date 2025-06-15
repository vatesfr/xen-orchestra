import 'vue-router'
import type { StoryMeta } from '@core/packages/story/type.ts'

declare module 'vue-router' {
  interface RouteMeta {
    story?: StoryMeta
  }
}

export {}
