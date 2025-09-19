import { defineIconPack } from '@core/packages/icon'
import {
  faA,
  faAlignLeft,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faAngleUp,
  faArrowDown,
  faArrowDownAZ,
  faArrowUp,
  faArrowUpAZ,
  faCalendar,
  faCircle,
  faCirclePlus,
  faClock,
  faEye,
  faEyeSlash,
  faFilter,
  faHashtag,
  faLayerGroup,
  faSquareCaretDown,
} from '@fortawesome/free-solid-svg-icons'

export const dsTableIcon = defineIconPack({
  objcet: {
    icon: faA,
    color: 'var(--color-neutral-txt-primary)',
  },

  string: {
    icon: faAlignLeft,
    color: 'var(--color-neutral-txt-primary)',
  },

  int: {
    icon: faHashtag,
    color: 'var(--color-neutral-txt-primary)',
  },

  select: {
    icon: faSquareCaretDown,
    color: 'var(--color-neutral-txt-primary)',
  },

  date: {
    icon: faCalendar,
    color: 'var(--color-neutral-txt-primary)',
  },

  time: {
    icon: faClock,
    color: 'var(--color-neutral-txt-primary)',
  },

  'arraw-up-a-z': {
    icon: faArrowUpAZ,
    color: 'var(--color-neutral-txt-primary)',
  },

  'arraw-down-a-z': {
    icon: faArrowDownAZ,
    color: 'var(--color-neutral-txt-primary)',
  },

  filter: {
    icon: faFilter,
    color: 'var(--color-neutral-txt-primary)',
  },

  'filter-add': [
    {
      icon: faFilter,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: faCirclePlus,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],

  group: {
    icon: faLayerGroup,
    color: 'var(--color-neutral-txt-primary)',
  },

  'group-add': [
    {
      icon: faLayerGroup,
      color: 'var(--color-neutral-txt-primary)',
    },
    {
      icon: faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: faCirclePlus,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],

  show: {
    icon: faEye,
    color: 'var(--color-neutral-txt-primary)',
  },

  'show-hide': {
    icon: faEyeSlash,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angle-up': {
    icon: faAngleUp,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angle-left': {
    icon: faAngleLeft,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angle-down': {
    icon: faAngleDown,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angle-right': {
    icon: faAngleRight,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angles-left': {
    icon: faAnglesLeft,
    color: 'var(--color-neutral-txt-primary)',
  },

  'angles-right': {
    icon: faAnglesRight,
    color: 'var(--color-neutral-txt-primary)',
  },

  'arrow-up': {
    icon: faArrowUp,
    color: 'var(--color-neutral-txt-primary)',
  },

  'arrow-down': {
    icon: faArrowDown,
    color: 'var(--color-neutral-txt-primary)',
  },
})
