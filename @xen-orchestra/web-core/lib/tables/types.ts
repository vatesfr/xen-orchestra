import type { MaybeRefOrGetter } from 'vue'

export type HeaderConfig = {
  headerLabel?: MaybeRefOrGetter<string | undefined>
}

export type FlexibleColumnConfig = HeaderConfig & {
  flexible?: boolean
}
