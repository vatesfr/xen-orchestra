import { dsStatusIcons } from '@core/icons/ds-status-icon'
import { defineIcon, type IconSingleConfig } from '@core/packages/icon'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import {
  faArchive,
  faArrowLeft,
  faBarsProgress,
  faBoxesStacked,
  faCircle,
  faCity,
  faClock,
  faDatabase,
  faDesktop,
  faHdd,
  faNetworkWired,
  faPlay,
  faPuzzlePiece,
  faSatellite,
  faServer,
  faSlash,
  faUserCircle,
  faUsers,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

function constructCircleStatus(status: keyof typeof dsStatusIcons): any {
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

function constructIcon(icon: IconDefinition): IconSingleConfig {
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

  'host-running': [constructIcon(faServer), ...constructCircleStatus('running-circle')],

  'host-disabled': [constructIcon(faServer), ...constructCircleStatus('host-disabled-circle')],

  'host-warning': [constructIcon(faServer), ...constructCircleStatus('warning-circle')],

  'host-halted': [constructIcon(faServer), ...constructCircleStatus('halted-circle')],

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

  'vm-running': [constructIcon(faDesktop), ...constructCircleStatus('running-circle')],

  'vm-paused': [constructIcon(faDesktop), ...constructCircleStatus('paused-circle')],

  'vm-suspended': [constructIcon(faDesktop), ...constructCircleStatus('suspended-circle')],

  'vm-warning': [constructIcon(faDesktop), ...constructCircleStatus('warning-circle')],

  'vm-halted': [constructIcon(faDesktop), ...constructCircleStatus('halted-circle')],

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

  'sr-connected': [constructIcon(faDatabase), ...constructCircleStatus('success-circle')],

  'sr-disabled': [constructIcon(faDatabase), ...constructCircleStatus('disabled')],

  'sr-partially-connected': [constructIcon(faDatabase), ...constructCircleStatus('warning-circle')],

  'sr-disconnected': [constructIcon(faDatabase), ...constructCircleStatus('danger-circle')],

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

  'vdi-attached': [constructIcon(faHdd), ...constructCircleStatus('success-circle')],

  'vdi-disabled': [constructIcon(faHdd), ...constructCircleStatus('disabled')],

  'vdi-warning': [constructIcon(faHdd), ...constructCircleStatus('warning-circle')],

  'vdi-detached': [constructIcon(faHdd), ...constructCircleStatus('danger-circle')],

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

  'network-connected': [constructIcon(faNetworkWired), ...constructCircleStatus('success-circle')],

  'network-warning': [constructIcon(faNetworkWired), ...constructCircleStatus('warning-circle')],

  'network-disconnected': [constructIcon(faNetworkWired), ...constructCircleStatus('danger-circle')],

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

  'br-connected': [constructIcon(faBoxesStacked), ...constructCircleStatus('success-circle')],

  'br-disabled': [constructIcon(faBoxesStacked), ...constructCircleStatus('disabled')],

  'br-warning': [constructIcon(faBoxesStacked), ...constructCircleStatus('warning-circle')],

  'br-disconnected': [constructIcon(faBoxesStacked), ...constructCircleStatus('danger-circle')],

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

  task: constructIcon(faBarsProgress),

  template: constructIcon(faPuzzlePiece),

  // #TODO user logo is not compatible with actual icon system

  account: constructIcon(faUserCircle),

  // on our version of fa, faUsers icon is reversed compared to the version of fa on fa website
  organization: constructIcon(faUsers),
})
