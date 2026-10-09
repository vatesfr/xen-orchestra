import { solid } from '@core/icons/kit.generated.ts'
import { defineIconPack, type IconDefinition, type IconSingleConfig } from '@core/packages/icon'

function constructIcon(icon: IconDefinition): IconSingleConfig {
  return {
    icon,
    color: 'var(--color-neutral-txt-primary)',
  }
}

export const tableIcons = defineIconPack({
  object: constructIcon(solid.faA),
  string: constructIcon(solid.faAlignLeft),
  int: constructIcon(solid.faHashtag),
  select: constructIcon(solid.faSquareCaretDown),
  date: constructIcon(solid.faCalendar),
  time: constructIcon(solid.faClock),
  'arrow-up-a-z': constructIcon(solid.faArrowUpAZ),
  'arrow-down-a-z': constructIcon(solid.faArrowDownAZ),
  filter: constructIcon(solid.faFilter),
  'filter-add': [
    constructIcon(solid.faFilter),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: solid.faCirclePlus,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],
  group: constructIcon(solid.faLayerGroup),
  'group-add': [
    constructIcon(solid.faLayerGroup),
    {
      icon: solid.faCircle,
      color: 'var(--color-neutral-background-primary)',
      translate: [7, 5.5],
      size: 13,
    },
    {
      icon: solid.faCirclePlus,
      color: 'var(--color-neutral-txt-primary)',
      translate: [7, 5.5],
      size: 10,
    },
  ],
  show: constructIcon(solid.faEye),
  hide: constructIcon(solid.faEyeSlash),
  'angle-up': constructIcon(solid.faAngleUp),
  'angle-left': constructIcon(solid.faAngleLeft),
  'angle-down': constructIcon(solid.faAngleDown),
  'angle-right': constructIcon(solid.faAngleRight),
  'angles-left': constructIcon(solid.faAnglesLeft),
  'angles-right': constructIcon(solid.faAnglesRight),
  'arrow-up': constructIcon(solid.faArrowUp),
  'arrow-down': constructIcon(solid.faArrowDown),
})
