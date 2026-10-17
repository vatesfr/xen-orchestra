import { slash } from '@core/icons/custom-icons.ts'
import { solid } from '@core/icons/kit.generated.ts'
import { statusIcons } from '@core/icons/status-icons.ts'
import { defineIcon, type IconDefinition, type IconSingleConfig } from '@core/packages/icon'
import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'

function constructCircleStatus(status: keyof typeof statusIcons): any {
  return [
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: statusIcons[status],
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

const runningNeutral = defineIcon([
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: solid.faPlay,
    color: 'var(--color-neutral-background-primary)',
    translate: [7.5, 5.5],
    size: 5,
  },
])

const arrowLeft = defineIcon([
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
  {
    icon: solid.faArrowLeft,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: [6, 6.5],
  },
])

const schedule = defineIcon([
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: solid.faClock,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
])

const camera = defineIcon([
  {
    icon: solid.faCircle,
    color: 'var(--color-neutral-background-primary)',
    translate: [7, 5.5],
    size: 13,
  },
  {
    icon: solid.faCamera,
    color: 'var(--color-neutral-txt-primary)',
    translate: [7, 5.5],
    size: 10,
  },
])

export const objectIcons = defineIconPack({
  instance: constructIcon(solid.faSatellite),
  pool: constructIcon(solid.faCity),
  'pool:unknown': [
    {
      icon: solid.faCity,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  host: constructIcon(solid.faServer),
  'host:unknown': [
    {
      icon: solid.faServer,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'host:running': [constructIcon(solid.faServer), ...constructCircleStatus('running-circle')],
  'host:disabled': [constructIcon(solid.faServer), ...constructCircleStatus('host-disabled-circle')],
  'host:warning': [constructIcon(solid.faServer), ...constructCircleStatus('warning-circle')],
  'host:halted': [constructIcon(solid.faServer), ...constructCircleStatus('halted-circle')],
  vm: constructIcon(solid.faDesktop),
  'vm:unknown': [
    {
      icon: solid.faDesktop,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'vm:running': [constructIcon(solid.faDesktop), ...constructCircleStatus('running-circle')],
  'vm:paused': [constructIcon(solid.faDesktop), ...constructCircleStatus('paused-circle')],
  'vm:suspended': [constructIcon(solid.faDesktop), ...constructCircleStatus('suspended-circle')],
  'vm:warning': [constructIcon(solid.faDesktop), ...constructCircleStatus('warning-circle')],
  'vm:halted': [constructIcon(solid.faDesktop), ...constructCircleStatus('halted-circle')],
  'vm-snapshot': [
    constructIcon(solid.faDesktop),
    {
      icon: camera,
    },
  ],
  sr: constructIcon(solid.faDatabase),
  'sr:unknown': [
    {
      icon: solid.faDatabase,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'sr:connected': [constructIcon(solid.faDatabase), ...constructCircleStatus('success-circle')],
  'sr:disabled': [constructIcon(solid.faDatabase), ...constructCircleStatus('disabled')],
  'sr:partially-connected': [constructIcon(solid.faDatabase), ...constructCircleStatus('warning-circle')],
  'sr:disconnected': [constructIcon(solid.faDatabase), ...constructCircleStatus('danger-circle')],
  vdi: constructIcon(solid.faHdd),
  'vdi:unknown': [
    {
      icon: solid.faHdd,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'vdi:attached': [constructIcon(solid.faHdd), ...constructCircleStatus('success-circle')],
  'vdi:disabled': [constructIcon(solid.faHdd), ...constructCircleStatus('disabled')],
  'vdi:warning': [constructIcon(solid.faHdd), ...constructCircleStatus('warning-circle')],
  'vdi:detached': [constructIcon(solid.faHdd), ...constructCircleStatus('danger-circle')],
  'vdi-snapshot': [
    constructIcon(solid.faHdd),
    {
      icon: camera,
    },
  ],
  vif: [
    {
      icon: solid.faMapPin,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-primary)',
      translate: [0, -4],
      size: 12,
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [0, -4],
      size: 8,
    },
  ],
  network: constructIcon(solid.faNetworkWired),
  'network:unknown': [
    {
      icon: solid.faNetworkWired,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'network:connected': [constructIcon(solid.faNetworkWired), ...constructCircleStatus('success-circle')],
  'network:partially-connected': [constructIcon(solid.faNetworkWired), ...constructCircleStatus('warning-circle')],
  'network:disconnected': [constructIcon(solid.faNetworkWired), ...constructCircleStatus('danger-circle')],
  br: constructIcon(solid.faBoxesStacked),
  'br:unknown': [
    {
      icon: solid.faBoxesStacked,
      color: 'var(--color-neutral-txt-secondary)',
    },
    {
      icon: slash,
      color: 'var(--color-neutral-txt-secondary)',
    },
  ],
  'br:connected': [constructIcon(solid.faBoxesStacked), ...constructCircleStatus('success-circle')],
  'br:disabled': [constructIcon(solid.faBoxesStacked), ...constructCircleStatus('disabled')],
  'br:warning': [constructIcon(solid.faBoxesStacked), ...constructCircleStatus('warning-circle')],
  'br:disconnected': [constructIcon(solid.faBoxesStacked), ...constructCircleStatus('danger-circle')],
  'backup-archive': constructIcon(solid.faArchive),
  'backup-job': [
    constructIcon(solid.faArchive),
    {
      icon: arrowLeft,
    },
  ],
  'backup-schedule': [
    constructIcon(solid.faArchive),
    {
      icon: schedule,
    },
  ],
  'backup-run': [
    constructIcon(solid.faArchive),
    {
      icon: runningNeutral,
    },
  ],
  proxy: constructIcon(solid.faCircleNodes),
  task: constructIcon(solid.faBarsProgress),
  template: constructIcon(solid.faPuzzlePiece),
  account: constructIcon(solid.faUserCircle),
  // on our version of fa, faUsers icon is reversed compared to the version of fa on fa website
  organization: constructIcon(solid.faUsers),
})
