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
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons'

function constructIcon(icon: IconDefinition): any {
  return {
    icon,
    color: 'var(--color-neutral-txt-primary)',
  }
}

export const dsTableIcons = defineIconPack({
  object: constructIcon(faA),

  string: constructIcon(faAlignLeft),

  int: constructIcon(faHashtag),

  select: constructIcon(faSquareCaretDown),

  date: constructIcon(faCalendar),

  time: constructIcon(faClock),

  'arrow-up-a-z': constructIcon(faArrowUpAZ),

  'arrow-down-a-z': constructIcon(faArrowDownAZ),

  filter: constructIcon(faFilter),

  'filter-add': [
    constructIcon(faFilter),
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

  group: constructIcon(faLayerGroup),

  'group-add': [
    constructIcon(faLayerGroup),
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

  show: constructIcon(faEye),

  hide: constructIcon(faEyeSlash),

  'angle-up': constructIcon(faAngleUp),

  'angle-left': constructIcon(faAngleLeft),

  'angle-down': constructIcon(faAngleDown),

  'angle-right': constructIcon(faAngleRight),

  'angles-left': constructIcon(faAnglesLeft),

  'angles-right': constructIcon(faAnglesRight),

  'arrow-up': constructIcon(faArrowUp),

  'arrow-down': constructIcon(faArrowDown),
})
