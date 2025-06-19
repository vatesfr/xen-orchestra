import { defineIconPack } from '@core/packages/icon/define-icon-pack.ts'
import { defineIcon } from '@core/packages/icon/define-icon.ts'
import type { IconTransforms } from '@core/packages/icon/types.ts'
import { createMapper } from '@core/packages/mapper/create-mapper.ts'
import {
  faBan,
  faCheck,
  faCircle,
  faDatabase,
  faDesktop,
  faMinus,
  faMoon,
  faNetworkWired,
  faPause,
  faPlay,
  faQuestion,
  faServer,
  faStop,
  faTriangleExclamation,
  faWarehouse,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const defaultTransforms: IconTransforms = {
  translate: 6,
  size: 8,
  borderColor: 'var(--color-neutral-background-primary)',
}

const getStatusIcon = createMapper(
  {
    running: defineIcon({
      icon: faPlay,
      color: 'var(--color-success-item-base)',
      ...defaultTransforms,
    }),
    halted: defineIcon({
      icon: faStop,
      color: 'var(--color-danger-item-base)',
      ...defaultTransforms,
    }),
    suspended: defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-neutral-border)',
        },
        {
          icon: faMoon,
          color: 'var(--color-neutral-txt-secondary)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
    paused: defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-brand-item-base)',
        },
        {
          icon: faPause,
          color: 'var(--color-info-txt-item)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
    muted: undefined,
    unknown: defineIcon([
      {
        icon: faQuestion,
        color: 'var(--color-neutral-txt-secondary)',
        ...defaultTransforms,
      },
    ]),
    maintenance: defineIcon([
      {
        icon: faTriangleExclamation,
        color: 'var(--color-warning-item-base)',
        ...defaultTransforms,
      },
    ]),
    disabled: defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-neutral-border)',
        },
        {
          icon: faBan,
          color: 'var(--color-neutral-txt-secondary)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
    connected: defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-success-item-base)',
        },
        {
          icon: faCheck,
          color: 'var(--color-success-txt-item)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
    'partially-connected': defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-warning-item-base)',
        },
        {
          icon: faMinus,
          color: 'var(--color-warning-txt-item)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
    disconnected: defineIcon(
      [
        {
          icon: faCircle,
          color: 'var(--color-danger-item-base)',
        },
        {
          icon: faXmark,
          color: 'var(--color-danger-txt-item)',
          size: 12,
        },
      ],
      defaultTransforms
    ),
  },
  'unknown'
)

function getMainColor(state: string) {
  return state === 'muted' || state === 'unknown'
    ? 'var(--color-neutral-txt-secondary)'
    : 'var(--color-neutral-txt-primary)'
}

export const objectIcons = defineIconPack({
  vm: defineIcon([['running', 'halted', 'suspended', 'paused', 'muted']], state => [
    {
      icon: faDesktop,
      color: getMainColor(state),
    },
    { icon: getStatusIcon(state) },
  ]),
  host: defineIcon([['running', 'halted', 'disabled', 'muted', 'unknown']], state => [
    {
      icon: faServer,
      color: getMainColor(state),
    },
    { icon: getStatusIcon(state) },
  ]),
  sr: defineIcon([['connected', 'partially-connected', 'disconnected', 'muted']], state => [
    {
      icon: faDatabase,
      color: getMainColor(state),
    },
    { icon: getStatusIcon(state) },
  ]),
  network: defineIcon([['connected', 'disconnected']], state => [
    {
      icon: faNetworkWired,
      color: getMainColor(state),
    },
    { icon: getStatusIcon(state) },
  ]),
  'backup-repository': defineIcon([['connected', 'disconnected']], state => [
    {
      icon: faWarehouse,
      color: getMainColor(state),
    },
    { icon: getStatusIcon(state) },
  ]),
})
