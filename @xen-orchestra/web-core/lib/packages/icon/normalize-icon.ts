import { toArray } from '@core/utils/to-array.utils.ts'
import type { IconDefinition, NormalizedIcon } from './types.ts'

export function normalizeIcon(icon: IconDefinition | undefined): NormalizedIcon {
  if (icon === undefined) {
    return {
      viewBox: '',
      paths: [],
    }
  }

  return {
    viewBox: `0 0 ${icon[0]} ${icon[1]}`,
    paths: toArray(icon[2]),
  }
}
