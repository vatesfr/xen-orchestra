import { defineIconPack } from '@core/packages/icon'
import { faSquare as checkboxEmpty, type IconDefinition } from '@fortawesome/free-regular-svg-icons'
import {
  faAdd,
  faArrowCircleRight,
  faArrowRight,
  faArrowRotateLeft,
  faArrowRotateRight,
  faArrowsLeftRight,
  faArrowUpRightFromSquare,
  faBan,
  faBars,
  faBolt,
  faCamera,
  faCircle,
  faClone,
  faClose,
  faCopy,
  faDownload,
  faEdit,
  faEllipsis,
  faEraser,
  faHeart,
  faLightbulb,
  faLink,
  faMinus,
  faPowerOff,
  faRefresh,
  faSearch,
  faThumbTack,
  faThumbTackSlash,
  faTrash,
  faUpRightAndDownLeftFromCenter,
} from '@fortawesome/free-solid-svg-icons'

function constructIcon(icon: IconDefinition): any {
  return {
    icon,
    color: 'var(--color-neutral-txt-primary)',
  }
}

export const dsActionIcon = defineIconPack({
  menu: constructIcon(faBars),

  'pin-panel': constructIcon(faThumbTack),

  'pin-panel-hide': constructIcon(faThumbTackSlash),

  resize: [
    // bad arrow
    constructIcon(faArrowsLeftRight),
    {
      icon: faMinus,
      color: 'var(--color-neutral-txt-primary)',
      rotate: 90,
    },
  ],

  search: constructIcon(faSearch),

  'close-cancel-clear': constructIcon(faClose),

  disable: constructIcon(faBan),

  'disable-and-evacuate': [
    constructIcon(faBan),
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
      icon: faArrowRight,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 4.5,
    },
  ],

  add: constructIcon(faAdd),

  'add-circle': [
    {
      icon: faCircle,
      color: 'var(--color-brand-item-base)',
    },
    {
      icon: faAdd,
      color: 'var(--color-brand-txt-item)',
      size: 10,
    },
  ],

  remove: constructIcon(faMinus),

  force: constructIcon(faBolt),

  smart: constructIcon(faLightbulb),

  'open-in-new-tab': constructIcon(faArrowUpRightFromSquare),

  'open-fullscreen': constructIcon(faUpRightAndDownLeftFromCenter),

  screenshot: [
    // faDrawSquare is pro version
    constructIcon(checkboxEmpty),

    {
      icon: faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [6, 6],
    },
    {
      icon: faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [-6, -6],
    },
    {
      icon: faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [6, -6],
    },
    {
      icon: faCircle,
      color: 'var(--color-neutral-txt-primary)',
      size: 4,
      translate: [-6, 6],
    },
  ],

  edit: constructIcon(faEdit),

  duplicate: constructIcon(faClone),

  copy: constructIcon(faCopy),

  connect: constructIcon(faLink),

  forget: constructIcon(faEraser),

  delete: constructIcon(faTrash),

  'more-action': constructIcon(faEllipsis),

  'more-actions-vertical': {
    icon: faEllipsis,
    color: 'var(--color-neutral-txt-primary)',
    rotate: 90,
  },

  reboot: constructIcon(faArrowRotateRight),

  'reboot-force': [
    constructIcon(faArrowRotateRight),
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
      icon: faBolt,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 4.5,
    },
  ],

  'reboot-smart': [
    constructIcon(faArrowRotateRight),
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: faLightbulb,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],

  undo: constructIcon(faArrowRotateLeft),

  scan: constructIcon(faRefresh),

  'change-state': constructIcon(faPowerOff),

  // #FIXME I don’t know this icon
  migrate: constructIcon(faPowerOff),

  snapshoot: constructIcon(faCamera),

  downloard: constructIcon(faDownload),

  'health-check': constructIcon(faHeart),

  evacuate: constructIcon(faArrowCircleRight),
})
