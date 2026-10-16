import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import type { XoAclBasePrivilege } from '@vates/types'

export const EFFECT_ACCENTS = {
  allow: 'success',
  deny: 'danger',
} as const satisfies Record<XoAclBasePrivilege['effect'], TagAccent>
