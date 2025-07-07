import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import { defineIcon } from '@core/packages/icon/define-icon.ts'
import { createMapper } from '@core/packages/mapper/create-mapper.ts'
import {
  faCheck,
  faCircle,
  faCircleInfo,
  faExclamation,
  faInfo,
  faMinus,
  faPlay,
  faStar,
  faStop,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const getStatusIcon = createMapper(
  {
    info: faInfo,
    success: faCheck,
    warning: faExclamation,
    danger: faXmark,
    muted: faMinus,
  },
  'muted'
)

const getStatusColor = createMapper(
  {
    info: 'var(--color-info-txt-item)',
    success: 'var(--color-success-txt-item)',
    warning: 'var(--color-warning-txt-item)',
    danger: 'var(--color-danger-txt-item)',
    muted: 'var(--color-neutral-txt-secondary)',
  },
  'muted'
)

export const legacyIcons = defineIconPack({
  'circle-progress': defineIcon([['success', 'warning', 'danger']], accent => [
    {
      icon: accent === 'success' ? faCheck : faExclamation,
    },
  ]),
  halted: {
    icon: faStop,
    color: 'var(--color-danger-item-base)',
  },
  info: {
    icon: faCircleInfo,
    color: 'var(--color-info-item-base)',
  },
  'legend-circle': { icon: faCircle, size: 8 },
  primary: [
    {
      icon: faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: faStar,
      color: 'var(--color-info-txt-item)',
      size: 8,
    },
  ],
  running: {
    icon: faPlay,
    color: 'var(--color-success-item-base)',
  },
  status: defineIcon([['info', 'success', 'warning', 'danger', 'muted']], accent => [
    {
      icon: faCircle,
      color: accent === 'muted' ? 'var(--color-neutral-background-disabled)' : `var(--color-${accent}-item-base)`,
    },
    {
      icon: getStatusIcon(accent),
      color: getStatusColor(accent),
      size: 8,
    },
  ]),
})
