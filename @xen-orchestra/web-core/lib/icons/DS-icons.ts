import { defineIcon } from '@core/packages/icon'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import {
  faBan,
  faCircle,
  faCity,
  faExclamation,
  faPlay,
  faSatellite,
  faServer,
  faSlash,
  faSquare,
} from '@fortawesome/free-solid-svg-icons'

// info: 'var(--color-info-txt-item)'
// success: 'var(--color-success-txt-item)'
// warning: 'var(--color-warning-txt-item)'
// danger: 'var(--color-danger-txt-item)'
// muted: 'var(--color-neutral-txt-secondary)'
// netral: 'var(--color-neutral-txt-primary)'

const slash = defineIcon([
  {
    icon: faSlash,
    color: 'var(--color-neutral-background-primary)',
    translate: [-0.5, 0.5],
    size: 20,
  },
  {
    icon: faSlash,
    color: 'var(--color-neutral-txt-secondary)',
    translate: [0.5, -0.5],
    size: 20,
  },
])

const running = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-success-item-base)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faPlay,
    color: 'var(--color-success-txt-item)',
    translate: [7.5, 5.5],
    size: 5,
  },
])

const disabled = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-disabled)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faBan,
    color: 'var(--color-neutral-txt-secondary)',
    translate: [7, 5.5],
    size: 8,
    // increase bold for match with Figma
  },
])

const warning = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-warning-item-base)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faExclamation,
    color: 'var(--color-warning-txt-item)',
    translate: [7, 5.5],
    size: 8,
  },
])

const halted = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-danger-item-base)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faSquare,
    color: 'var(--color-danger-txt-item)',
    translate: [7, 5.5],
    size: 4.5,
  },
])

export const ObjectsIcons = defineIconPack({
  instance: {
    icon: faSatellite,
    color: 'var(--color-neutral-txt-primary)',
  },

  pool: {
    icon: faCity,
    color: 'var(--color-neutral-txt-primary)',
  },

  'pool-unknown': [
    {
      icon: faCity,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  host: {
    icon: faServer,
    color: 'var(--color-neutral-txt-primary)',
  },

  'host-unknown': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'host-running': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: running,
    },
  ],

  'host-disabled': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disabled,
    },
  ],

  'host-warning': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: warning,
    },
  ],

  'host-halted': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: halted,
    },
  ],
})
