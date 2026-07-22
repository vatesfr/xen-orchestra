import type { RouteLocationRaw } from 'vue-router'

export type TaskStatus = 'failure' | 'interrupted' | 'pending' | 'success'

export type TaskObjectSegment = {
  text: string
  to?: RouteLocationRaw
}
