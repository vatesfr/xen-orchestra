import { defineIconPack } from '@core/packages/icon'
import {
  faSquare as checkboxEmpty,
  faCircle as circleEmpty,
  type IconDefinition,
} from '@fortawesome/free-regular-svg-icons'
import {
  faBan,
  faBolt,
  faCheck,
  faCircle,
  faClose,
  faExclamation,
  faInfo,
  faLock,
  faMeteor,
  faMinus,
  faMoon,
  faPause,
  faPlay,
  faSatelliteDish,
  faSquare,
  faSquareCheck,
  faSquareMinus,
  faStar,
  faUserAstronaut,
} from '@fortawesome/free-solid-svg-icons'

function constructIcon(icon: IconDefinition): any {
  return {
    icon,
    color: 'var(--color-neutral-txt-primary)',
  }
}

export const dsStatusIcons = defineIconPack({
  running: constructIcon(faPlay),

  'running-circle': [
    {
      icon: faCircle,
      color: 'var(--color-success-item-base)',
    },
    {
      icon: faPlay,
      color: 'var(--color-success-txt-item)',
      translate: [0.5, 0],
      size: 8,
    },
  ],

  pause: constructIcon(faPause),

  'pause-circle': [
    {
      icon: faCircle,
      color: 'var(--color-brand-item-base)',
    },
    {
      icon: faPause,
      color: 'var(--color-brand-txt-item)',
      size: 8,
    },
  ],

  suspended: constructIcon(faMoon),

  'suspended-circle': [
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: faMoon,
      color: 'var(--color-neutral-txt-secondary)',
      translate: [-1, 0],
      size: 13,
    },
  ],

  halted: constructIcon(faSquare),

  'halted-circle': [
    {
      icon: faCircle,
      color: 'var(--color-danger-item-base)',
    },
    {
      icon: faSquare,
      color: 'var(--color-danger-txt-item)',
      size: 7,
    },
  ],

  'host-disabled-circle': [
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: faBan,
      color: 'var(--color-neutral-txt-secondary)',
      size: 13,
      // increase bold for match with Figma
    },
  ],

  info: constructIcon(faInfo),

  'info-circle': [
    {
      icon: faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: faInfo,
      color: 'var(--color-info-txt-item)',
      size: [10, 8],
    },
  ],

  'info-picto': constructIcon(faUserAstronaut),

  success: constructIcon(faCheck),

  'success-circle': [
    {
      icon: faCircle,
      color: 'var(--color-success-item-base)',
    },
    {
      icon: faCheck,
      color: 'var(--color-success-txt-item)',
      // increase bold for match with Figma
      size: 10,
    },
  ],

  warning: constructIcon(faExclamation),

  'warning-circle': [
    {
      icon: faCircle,
      color: 'var(--color-warning-item-base)',
    },
    {
      icon: faExclamation,
      color: 'var(--color-warning-txt-item)',
      size: 10,
    },
  ],

  'warning-picto': constructIcon(faSatelliteDish),

  'danger-circle': [
    {
      icon: faCircle,
      color: 'var(--color-danger-item-base)',
    },
    // not enough boldered
    {
      icon: faClose,
      color: 'var(--color-danger-txt-item)',
      size: 10,
    },
  ],

  'danger-picto': constructIcon(faMeteor),

  disabled: [
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-disabled)',
    },
    {
      icon: faMinus,
      color: 'var(--color-neutral-txt-secondary)',
      size: [8, 10],
    },
  ],

  checkbox: constructIcon(checkboxEmpty),

  'checkbox-checked': [
    {
      icon: faSquare,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
    {
      icon: faSquareCheck,
      color: 'var(--color-brand-item-base)',
    },
  ],

  'checkbox-partially-checked': [
    {
      icon: faSquare,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
    {
      icon: faSquareMinus,
      color: 'var(--color-brand-item-base)',
    },
  ],

  'radio-button': constructIcon(circleEmpty),

  'radio-button-checked': [
    {
      icon: faCircle,
      color: 'var(--color-brand-item-base)',
    },
    {
      icon: faCircle,
      color: 'var(--color-brand-txt-item)',
      size: 6,
    },
  ],

  primary: constructIcon(faStar),

  'primary-circle': [
    {
      icon: faCircle,
      color: 'var(--color-info-item-base)',
    },
    {
      icon: faStar,
      color: 'var(--color-info-txt-item)',
      size: 10,
    },
  ],

  'force-circle': [
    {
      icon: faCircle,
      color: 'var(--color-warning-item-base)',
    },
    {
      icon: faBolt,
      color: 'var(--color-warning-txt-item)',
      size: 10,
    },
  ],

  lock: {
    icon: faLock,
    color: 'var(--color-neutral-txt-primary)',
    size: [14, 15],
  },
})
