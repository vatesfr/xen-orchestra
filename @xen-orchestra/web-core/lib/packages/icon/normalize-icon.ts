import { toArray } from '@core/utils/to-array.utils.ts'
import type { NormalizedIcon } from './types.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

export function normalizeIcon(icon: IconDefinition | undefined): NormalizedIcon {
  if (icon === undefined) {
    return {
      viewBox: '',
      paths: [],
    }
  }

  return {
    viewBox: `0 0 ${icon.icon[0]} ${icon.icon[1]}`,
    paths: toArray(icon.icon[4]),
  }
}
