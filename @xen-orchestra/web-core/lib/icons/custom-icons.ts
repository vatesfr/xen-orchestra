import { solid } from '@core/icons/kit.generated.ts'
import { defineIcon } from '@core/packages/icon'

export const slash = defineIcon([
  {
    icon: solid.faSlash,
    color: 'var(--color-neutral-background-primary)',
    translate: [-0.5, 0.5],
    size: 20,
  },
  {
    icon: solid.faSlash,
    translate: [0.5, -0.5],
    size: 20,
  },
])
