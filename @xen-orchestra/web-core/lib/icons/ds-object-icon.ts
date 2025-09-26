import { dsStatusIcons } from '@core/icons/ds-status-icon'
import { defineIcon } from '@core/packages/icon'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import {
  faArchive,
  faArrowLeft,
  faBoxesStacked,
  faCircle,
  faCity,
  faClock,
  faDatabase,
  faDesktop,
  faHdd,
  faNetworkWired,
  faPlay,
  faSatellite,
  faServer,
  faSlash,
  faUserCircle,
  faUsers,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

// type this
function CircleStatus(status: keyof typeof dsStatusIcons): any {
  return [
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: dsStatusIcons[status],
      translate: [7, 5.5],
      size: 10,
    },
  ]
}

function constructIcon(icon: IconDefinition): any {
  return {
    icon,
    color: 'var(--color-neutral-txt-primary)',
  }
}

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

const runningNeutral = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: faPlay,
    color: 'var(--color-neutral-background-primary)',
    translate: [7.5, 5.5],
    size: 5,
  },
])

const arrowLeft = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faCircle,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
  // not enough boldered
  {
    icon: faArrowLeft,
    color: 'var(--color-danger-txt-item)',
    translate: [7, 5.5],
    size: [6, 6.5],
  },
])

const schedule = defineIcon([
  {
    icon: faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: faClock,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
])

export const dsObjectsIcons = defineIconPack({
  instance: constructIcon(faSatellite),

  pool: constructIcon(faCity),

  'pool-unknown': [
    {
      icon: faCity,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  host: constructIcon(faServer),

  'host-unknown': [
    {
      icon: faServer,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'host-running': [constructIcon(faServer), ...CircleStatus('running-circle')],

  'host-disabled': [constructIcon(faServer), ...CircleStatus('host-disabled-circle')],

  'host-warning': [constructIcon(faServer), ...CircleStatus('warning-circle')],

  'host-halted': [constructIcon(faServer), ...CircleStatus('halted-circle')],

  vm: constructIcon(faDesktop),

  'vm-unknown': [
    {
      icon: faDesktop,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'vm-running': [constructIcon(faDesktop), ...CircleStatus('running-circle')],

  'vm-paused': [constructIcon(faDesktop), ...CircleStatus('pause-circle')],

  'vm-suspended': [constructIcon(faDesktop), ...CircleStatus('suspended-circle')],

  'vm-warning': [constructIcon(faDesktop), ...CircleStatus('warning-circle')],

  'vm-halted': [constructIcon(faDesktop), ...CircleStatus('halted-circle')],

  sr: constructIcon(faDatabase),

  'sr-unknown': [
    {
      icon: faDatabase,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'sr-connected': [constructIcon(faDatabase), ...CircleStatus('success-circle')],

  'sr-disabled': [constructIcon(faDatabase), ...CircleStatus('disabled')],

  'sr-partially-connected': [constructIcon(faDatabase), ...CircleStatus('warning-circle')],

  'sr-disconnected': [constructIcon(faDatabase), ...CircleStatus('danger-circle')],

  vdi: constructIcon(faHdd),

  'vdi-unknown': [
    {
      icon: faHdd,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'vdi-attached': [constructIcon(faHdd), ...CircleStatus('success-circle')],

  'vdi-disabled': [constructIcon(faHdd), ...CircleStatus('disabled')],

  'vdi-warning': [constructIcon(faHdd), ...CircleStatus('warning-circle')],

  'vdi-detached': [constructIcon(faHdd), ...CircleStatus('danger-circle')],

  network: constructIcon(faNetworkWired),

  'network-unknown': [
    {
      icon: faNetworkWired,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'network-connected': [constructIcon(faNetworkWired), ...CircleStatus('success-circle')],

  'network-warning': [constructIcon(faNetworkWired), ...CircleStatus('warning-circle')],

  'network-detached': [constructIcon(faNetworkWired), ...CircleStatus('danger-circle')],

  br: constructIcon(faBoxesStacked),

  'br-unknown': [
    {
      icon: faBoxesStacked,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
    },
  ],

  'br-connected': [constructIcon(faBoxesStacked), ...CircleStatus('success-circle')],

  'br-disabled': [constructIcon(faBoxesStacked), ...CircleStatus('host-disabled-circle')],

  'br-warning': [constructIcon(faBoxesStacked), ...CircleStatus('warning-circle')],

  'br-detached': [constructIcon(faBoxesStacked), ...CircleStatus('danger-circle')],

  backup: constructIcon(faArchive),

  'backup-job': [
    constructIcon(faArchive),
    {
      icon: arrowLeft,
    },
  ],
  'backup-schedule': [
    constructIcon(faArchive),
    {
      icon: schedule,
    },
  ],
  'backup-run': [
    constructIcon(faArchive),
    {
      icon: runningNeutral,
    },
  ],

  // #TODO user logo is not compatible with actual icon system

  account: constructIcon(faUserCircle),

  // update lib for acces to new faUsers icon
  organization: constructIcon(faUsers),
})
