import { regular, solid } from '@core/icons/kit.generated.ts'
import { defineIconPack, type IconDefinition, type IconSingleConfig } from '@core/packages/icon'

function constructIcon(icon: IconDefinition): IconSingleConfig {
  return {
    icon,
    color: 'currentColor',
  }
}

export const statusIcons = defineIconPack({
  running: constructIcon(solid.faPlay),
  'running-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-success-item-base)',
    },
    {
      icon: solid.faPlay,
      color: 'var(--color-success-txt-item)',
      translate: [0.5, 0],
      size: 8,
    },
  ],
  paused: constructIcon(solid.faPause),
  'paused-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: solid.faPause,
      color: 'var(--color-info-txt-item)',
      size: 8,
    },
  ],
  suspended: constructIcon(solid.faMoon),
  'suspended-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: solid.faMoon,
      color: 'var(--color-neutral-txt-secondary)',
      translate: [-1, 0],
      size: 13,
    },
  ],
  halted: constructIcon(solid.faSquare),
  'halted-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-danger-item-base)',
    },
    {
      icon: solid.faSquare,
      color: 'var(--color-danger-txt-item)',
      size: 7,
    },
  ],
  'host-disabled-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: solid.faBan,
      color: 'var(--color-neutral-txt-secondary)',
      size: 13,
    },
  ],
  info: constructIcon(solid.faInfo),
  'info-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: solid.faInfo,
      color: 'var(--color-info-txt-item)',
      size: [10, 8],
    },
  ],
  'info-picto': constructIcon(solid.faUserAstronaut),
  success: constructIcon(solid.faCheck),
  'success-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-success-item-base)',
    },
    {
      icon: solid.faCheck,
      color: 'var(--color-success-txt-item)',
      size: 10,
    },
  ],
  warning: constructIcon(solid.faExclamation),
  'warning-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-warning-item-base)',
    },
    {
      icon: solid.faExclamation,
      color: 'var(--color-warning-txt-item)',
      size: 10,
    },
  ],
  'warning-picto': constructIcon(solid.faSatelliteDish),
  'danger-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-danger-item-base)',
    },
    {
      icon: solid.faClose,
      color: 'var(--color-danger-txt-item)',
      size: 10,
    },
  ],
  'danger-picto': constructIcon(solid.faMeteor),
  disabled: [
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: solid.faMinus,
      color: 'var(--color-neutral-txt-secondary)',
      size: [8, 10],
    },
  ],
  checkbox: constructIcon(regular.faSquare),
  'checkbox-checked': [
    {
      icon: solid.faSquare,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
    {
      icon: solid.faSquareCheck,
      color: 'var(--color-brand-item-base)',
    },
  ],
  'checkbox-partially-checked': [
    {
      icon: solid.faSquare,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
    {
      icon: solid.faSquareMinus,
      color: 'var(--color-brand-item-base)',
    },
  ],
  'radio-button': constructIcon(regular.faCircle),
  'radio-button-checked': [
    {
      icon: solid.faCircle,
      color: 'var(--color-brand-item-base)',
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-brand-txt-item)',
      size: 6,
    },
  ],
  primary: constructIcon(solid.faStar),
  'primary-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: solid.faStar,
      color: 'var(--color-info-txt-item)',
      size: 10,
    },
  ],
  'primary-circle-disabled': [
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: solid.faStar,
      color: 'var(--color-neutral-background-primary)',
      size: 10,
    },
  ],
  'force-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-warning-item-base)',
    },
    {
      icon: solid.faBolt,
      color: 'var(--color-warning-txt-item)',
      size: 10,
    },
  ],
  lock: {
    icon: solid.faLock,
    color: 'var(--color-neutral-txt-primary)',
    size: [14, 15],
  },
})
