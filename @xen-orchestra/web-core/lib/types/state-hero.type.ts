export const STATE_HERO_TYPES = [
  'busy',
  'no-result',
  'under-construction',
  'no-data',
  'no-selection',
  'error',
  'not-found',
  'offline',
  'all-good',
  'all-done',
  'creating',
] as const

export type StateHeroType = (typeof STATE_HERO_TYPES)[number]

export type StateHeroFormat = 'page' | 'card' | 'panel' | 'table'

export type StateHeroSize = 'extra-small' | 'small' | 'medium' | 'large'
