import { defineIcon } from '@core/packages/icon'
import { faSlash } from '@fortawesome/free-solid-svg-icons'

export const slash = defineIcon([
  {
    icon: faSlash,
    color: 'var(--color-neutral-background-primary)',
    translate: [-0.5, 0.5],
    size: 20,
  },
  {
    icon: faSlash,
    translate: [0.5, -0.5],
    size: 20,
  },
])
