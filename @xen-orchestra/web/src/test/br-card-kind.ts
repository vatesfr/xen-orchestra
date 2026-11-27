import { findCardLabelledValues, findLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel, findTitleLabel } from '@/test/find-titles.ts'
import { t } from '@/test/i18n.ts'
import type { VueWrapper } from '@vue/test-utils'

// Where a card of a backup repository shows: `detail`, the detail page; `panel`, the side panel of the list
export type BrCardKind = 'detail' | 'panel'

// How the title and the rows of a backup repository card read, by where it shows
export const BR_CARD_READERS = {
  detail: { findTitle: findTitleLabel, findValues: findLabelledValues },
  panel: { findTitle: findPanelCardTitleLabel, findValues: findCardLabelledValues },
}

// The writing and reading speeds a speed card of a backup repository shows, by where it shows
export function findBrSpeeds(wrapper: VueWrapper, kind: BrCardKind) {
  const values = BR_CARD_READERS[kind].findValues(wrapper)

  return { write: values[t('writing-speed')], read: values[t('reading-speed')] }
}
