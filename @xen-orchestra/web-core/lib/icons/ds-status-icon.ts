import { defineIconPack } from '@core/packages/icon'
import { faSquare as checkboxEmpty, faCircle as circleEmpty } from '@fortawesome/free-regular-svg-icons'
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

export const dsStatusIcon = defineIconPack({
  runnign: {
    icon: faPlay,
    color: 'var(--color-neutral-txt-primary)',
  },

  'runnign-circle': [
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

  pause: {
    icon: faPause,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  suspended: {
    icon: faMoon,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  halted: {
    icon: checkboxEmpty,
    color: 'var(--color-neutral-txt-primary)',
  },

  'halted-circle': [
    {
      icon: faCircle,
      color: 'var(--color-danger-item-base)',
    },
    {
      icon: checkboxEmpty,
      color: 'var(--color-danger-txt-item)',
      size: 7,
    },
  ],

  'disabled-host-circle': [
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

  info: {
    icon: faInfo,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  'info-picto': {
    icon: faUserAstronaut,
    color: 'var(--color-neutral-txt-primary)',
  },

  success: {
    icon: faCheck,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  warning: {
    icon: faExclamation,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  'warning-picto': {
    icon: faSatelliteDish,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  'danger-picto': {
    icon: faMeteor,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  checkbox: {
    icon: checkboxEmpty,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  'radio-button': {
    icon: circleEmpty,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  primary: {
    icon: faStar,
    color: 'var(--color-neutral-txt-primary)',
  },

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
