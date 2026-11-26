import { findCardLabelledValues, findLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel, findTitleLabel } from '@/test/find-titles.ts'

// Where a card of a backup repository shows: `detail`, the detail page; `panel`, the side panel of the list
export type BrCardKind = 'detail' | 'panel'

// How the title and the rows of a backup repository card read, by where it shows
export const BR_CARD_READERS = {
  detail: { findTitle: findTitleLabel, findValues: findLabelledValues },
  panel: { findTitle: findPanelCardTitleLabel, findValues: findCardLabelledValues },
}
