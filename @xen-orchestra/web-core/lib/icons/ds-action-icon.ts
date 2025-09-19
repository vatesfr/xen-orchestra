import { defineIconPack } from '@core/packages/icon'
import { faSquare as checkboxEmpty } from '@fortawesome/free-regular-svg-icons'
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

export const dsActionIcon = defineIconPack({
  menu: {
    icon: faBars,
    color: 'var(--color-neutral-txt-primary)',
  },

  'pin-panel': {
    icon: faThumbTack,
    color: 'var(--color-neutral-txt-primary)',
  },

  'pin-panel-hide': {
    icon: faThumbTackSlash,
    color: 'var(--color-neutral-txt-primary)',
  },

  resize: [
    // bad arrow
    {
      icon: faArrowsLeftRight,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: faMinus,
      color: 'var(--color-neutral-txt-primary)',
      rotate: 90,
    },
  ],

  search: {
    icon: faSearch,
    color: 'var(--color-neutral-txt-primary)',
  },

  'close-cancel-clear': {
    icon: faClose,
    color: 'var(--color-neutral-txt-primary)',
  },

  disable: {
    icon: faBan,
    color: 'var(--color-neutral-txt-primary)',
  },

  'disable-and-evacuate': [
    {
      icon: faBan,
      color: 'var(--color-neutral-txt-primary)',
    },
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

  add: {
    icon: faAdd,
    color: 'var(--color-neutral-txt-primary)',
  },

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

  remove: {
    icon: faMinus,
    color: 'var(--color-neutral-txt-primary)',
  },

  force: {
    icon: faBolt,
    color: 'var(--color-neutral-txt-primary)',
  },

  smart: {
    icon: faLightbulb,
    color: 'var(--color-neutral-txt-primary)',
  },

  'open-in-new-tab': {
    icon: faArrowUpRightFromSquare,
    color: 'var(--color-neutral-txt-primary)',
  },

  'open-fullscreen': {
    icon: faUpRightAndDownLeftFromCenter,
    color: 'var(--color-neutral-txt-primary)',
  },

  screenshot: [
    {
      // faDrawSquare is pro version
      icon: checkboxEmpty,
      color: 'var(--color-neutral-txt-primary)',
    },
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

  edit: {
    icon: faEdit,
    color: 'var(--color-neutral-txt-primary)',
  },

  duplicate: {
    icon: faClone,
    color: 'var(--color-neutral-txt-primary)',
  },

  copy: {
    icon: faCopy,
    color: 'var(--color-neutral-txt-primary)',
  },

  connect: {
    icon: faLink,
    color: 'var(--color-neutral-txt-primary)',
  },

  forget: {
    icon: faEraser,
    color: 'var(--color-neutral-txt-primary)',
  },

  delete: {
    icon: faTrash,
    color: 'var(--color-neutral-txt-primary)',
  },

  'more-action': {
    icon: faEllipsis,
    color: 'var(--color-neutral-txt-primary)',
  },

  'more-actions-vertical': {
    icon: faEllipsis,
    color: 'var(--color-neutral-txt-primary)',
    rotate: 90,
  },

  reboot: {
    icon: faArrowRotateRight,
    color: 'var(--color-neutral-txt-primary)',
  },

  'reboot-force': [
    {
      icon: faArrowRotateRight,
      color: 'var(--color-neutral-txt-primary)',
    },
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
    {
      icon: faArrowRotateRight,
      color: 'var(--color-neutral-txt-primary)',
    },
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

  undo: {
    icon: faArrowRotateLeft,
    color: 'var(--color-neutral-txt-primary)',
  },

  scan: {
    icon: faRefresh,
    color: 'var(--color-neutral-txt-primary)',
  },

  'change-state': {
    icon: faPowerOff,
    color: 'var(--color-neutral-txt-primary)',
  },

  migrate: {
    // #FIXME I don’t know this icon
    icon: faPowerOff,
    color: 'var(--color-neutral-txt-primary)',
  },

  snapshoot: {
    icon: faCamera,
    color: 'var(--color-neutral-txt-primary)',
  },

  downloard: {
    icon: faDownload,
    color: 'var(--color-neutral-txt-primary)',
  },

  'health-check': {
    icon: faHeart,
    color: 'var(--color-neutral-txt-primary)',
  },

  evacuate: {
    icon: faArrowCircleRight,
    color: 'var(--color-neutral-txt-primary)',
  },
})
