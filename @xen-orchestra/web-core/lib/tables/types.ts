import type { IconName } from '@core/icons/index.ts'
import type { MaybeRefOrGetter } from 'vue'

export type HeaderConfig = {
  headerLabel?: MaybeRefOrGetter<string | undefined>
  headerIcon?: MaybeRefOrGetter<IconName>
}
