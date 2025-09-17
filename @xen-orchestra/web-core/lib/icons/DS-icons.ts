import { defineIcon } from '@core/packages/icon'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import {
  faBan,
  faCircle,
  faCity,
  faDesktop,
  faExclamation,
  faPause,
  faPlay,
  faSatellite,
  faServer,
  faSlash,
  faSquare,
  faMoon,
  faDatabase,
  faCheck,
  faMinus,
  faClose,
  faHdd,
} from '@fortawesome/free-solid-svg-icons'
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons/faNetworkWired'

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

const disabledBan = defineIcon([
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

const disableLigne = defineIcon([
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
    icon: faMinus,
    color: 'var(--color-neutral-txt-secondary)',
    translate: [7, 5.5],
    size: [6, 8],
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
    size: [9, 7],
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

const pause = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-brand-item-base)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faPause,
    color: 'var(--color-brand-txt-item)',
    translate: [7, 5.5],
    size: 6,
  },
])

const suspended = defineIcon([
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
    icon: faMoon,
    color: 'var(--color-neutral-txt-secondary)',
    translate: [7, 5.5],
    size: 6,
  },
])

const connected = defineIcon([
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
    icon: faCheck,
    color: 'var(--color-success-txt-item)',
    translate: [7, 5.5],
    size: 6,
  },
  // not enough boldered
  // {
  //   icon: faCheck,
  //   color: 'var(--color-success-txt-item)',
  //   translate: [7.2, 5.5],
  //   size: 6,
  // },
  // {
  //   icon: faCheck,
  //   color: 'var(--color-success-txt-item)',
  //   translate: [7, 5.3],
  //   size: 6,
  // },
])

const disconnected = defineIcon([
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
  // not enough boldered
  {
    icon: faClose,
    color: 'var(--color-danger-txt-item)',
    translate: [7, 5.5],
    size: 8,
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
      icon: disabledBan,
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

  vm: [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
  ],

  'vm-unknown': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'vm-running': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: running,
    },
  ],

  'vm-paused': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: pause,
    },
  ],

  'vm-suspended': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: suspended,
    },
  ],

  'vm-warning': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: warning,
    },
  ],

  'vm-halted': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: halted,
    },
  ],

  sr: [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-primary)',
    },
  ],

  'sr-unknown': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'sr-connected': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: connected,
    },
  ],

  'sr-disable': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disableLigne,
    },
  ],

  'sr-partially-connected': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: warning,
    },
  ],

  'sr-disconnected': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disconnected,
    },
  ],

  vdi: [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-primary)',
    },
  ],

  'vdi-unknown': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'vdi-attached': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: connected,
    },
  ],

  'vdi-disable': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disableLigne,
    },
  ],

  'vdi-warning': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: warning,
    },
  ],

  'vdi-detached': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disconnected,
    },
  ],

  network: [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-primary)',
    },
  ],

  'network-unknown': [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'network-connected': [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: connected,
    },
  ],

  'network-warning': [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: warning,
    },
  ],

  'network-detached': [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: disconnected,
    },
  ],
})
