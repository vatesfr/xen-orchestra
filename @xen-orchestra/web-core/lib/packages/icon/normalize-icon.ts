import { toArray } from '@core/utils/to-array.utils.ts'
import type { NormalizedIcon } from './types.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import type { SimpleIcon } from 'simple-icons'

export function normalizeIcon(icon: IconDefinition | SimpleIcon | undefined): NormalizedIcon {
  if (icon === undefined) {
    return {
      viewBox: '',
      paths: [],
    }
  }

  if ('icon' in icon) {
    return {
      viewBox: `0 0 ${icon.icon[0]} ${icon.icon[1]}`,
      paths: toArray(icon.icon[4]),
    }
  }

  return {
    viewBox: '0 0 24 24',
    paths: toArray(icon.path),
  }
}
