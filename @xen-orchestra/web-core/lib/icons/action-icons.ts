import { slash } from '@core/icons/custom-icons.ts'
import { regular, solid } from '@core/icons/kit.generated.ts'
import { defineIconPack, type IconDefinition, type IconSingleConfig } from '@core/packages/icon'

function constructIcon(icon: IconDefinition): IconSingleConfig {
  return {
    icon,
    color: 'currentColor',
  }
}

function constructBadgedIcon(icon: IconDefinition, badge: IconDefinition): IconSingleConfig[] {
  return [
    constructIcon(icon),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: solid.faCircle,
      color: 'currentColor',
      translate: [7, 5.5],
      size: 10,
    },
    {
      icon: badge,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 6,
    },
  ]
}

export const actionIcons = defineIconPack({
  menu: constructIcon(solid.faBars),
  'pin-panel': constructIcon(solid.faThumbTack),
  'pin-panel-hide': constructIcon(solid.faThumbTackSlash),
  resize: [
    {
      icon: solid.faUpDown,
      color: 'var(--color-neutral-txt-primary)',
      rotate: 90,
    },
    {
      icon: solid.faMinus,
      color: 'var(--color-neutral-txt-primary)',
      rotate: 90,
    },
  ],
  search: constructIcon(solid.faSearch),
  'close-cancel-clear': constructIcon(solid.faClose),
  disable: constructIcon(solid.faBan),
  'disable-and-evacuate': constructBadgedIcon(solid.faBan, solid.faArrowRight),
  add: constructIcon(solid.faAdd),
  'add-circle': [
    {
      icon: solid.faCircle,
      color: 'var(--color-brand-item-base)',
    },
    {
      icon: solid.faAdd,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
  ],
  remove: constructIcon(solid.faMinus),
  force: constructIcon(solid.faBolt),
  smart: constructIcon(solid.faLightbulb),
  'open-in-new-tab': constructIcon(solid.faArrowUpRightFromSquare),
  'open-fullscreen': constructIcon(solid.faUpRightAndDownLeftFromCenter),
  screenshot: [
    // faDrawSquare is pro version
    constructIcon(regular.faSquare),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [6, 6],
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [-6, -6],
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [6, -6],
    },
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [-6, 6],
    },
  ],
  edit: constructIcon(solid.faEdit),
  fill: constructIcon(solid.faFillDrip),
  duplicate: constructIcon(solid.faClone),
  copy: constructIcon(regular.faCopy),
  attach: constructIcon(solid.faLink),
  detach: constructIcon(solid.faLinkSlash),
  connect: constructIcon(solid.faPlug),
  disconnect: [constructIcon(solid.faPlug), { icon: slash }],
  forget: constructIcon(solid.faEraser),
  delete: { icon: solid.faTrash, color: 'var(--color-danger-txt-primary)' },
  'more-actions': constructIcon(solid.faEllipsis),
  'more-actions-vertical': {
    icon: solid.faEllipsis,
    color: 'var(--color-neutral-txt-primary)',
    rotate: 90,
  },
  'import-export': [
    {
      icon: solid.faArrowUpLong,
      color: 'var(--color-neutral-txt-primary)',
      translate: [-5, 0],
    },
    {
      icon: solid.faArrowDownLong,
      color: 'var(--color-neutral-txt-primary)',
      translate: [5, 0],
    },
  ],
  reboot: constructIcon(solid.faArrowRotateRight),
  'force-reboot': constructBadgedIcon(solid.faArrowRotateRight, solid.faBolt),
  shutdown: constructIcon(solid.faSquare),
  'force-shutdown': constructBadgedIcon(solid.faSquare, solid.faBolt),
  'smart-reboot': [
    constructIcon(solid.faArrowRotateRight),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: solid.faLightbulb,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],
  undo: constructIcon(solid.faArrowRotateLeft),
  scan: constructIcon(solid.faRefresh),
  'change-state': constructIcon(solid.faPowerOff),
  migrate: constructIcon(solid.faRoute),
  snapshot: constructIcon(solid.faCamera),
  download: constructIcon(solid.faDownload),
  'health-check': constructIcon(solid.faHeart),
  evacuate: constructIcon(solid.faArrowCircleRight),
  'emergency-shutdown': [
    constructIcon(solid.faSquare),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: solid.faStarOfLife,
      color: 'currentColor',
      translate: [7, 5.5],
      size: 10,
    },
  ],
})
