import V2vMappingCardSection from '@/modules/v2v/components/mapping/V2vMappingCardSection.vue'
import { findPanelCardTitles } from '@/test/find-card-title.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { countDividers } from '@/test/v2v-mapping-card.ts'
import { mount } from '@vue/test-utils'

const ROWS = [
  { key: 'disk-1', source: 'Hard disk 1', target: 'sr-a' },
  { key: 'disk-2', source: 'Hard disk 2', target: 'sr-b' },
]

function mountSection(rows = ROWS) {
  return mount(V2vMappingCardSection<(typeof ROWS)[number]>, {
    props: { label: 'Disks', rows },
    slots: {
      key: `<template #key="{ row }">{{ row.source }}</template>`,
      value: `<template #value="{ row }">{{ row.target }}</template>`,
    },
    global: createGlobalTestConfig(),
  })
}

it('sets itself apart, under its title', () => {
  const wrapper = mountSection()

  expect([countDividers(wrapper), findPanelCardTitles(wrapper)]).toEqual([1, ['Disks']])
})

it('shows each row as the key and the value it renders', () => {
  expect(findCardLabelledValues(mountSection())).toEqual({ 'Hard disk 1': 'sr-a', 'Hard disk 2': 'sr-b' })
})

it('shows nothing, not even its divider, without rows', () => {
  expect(mountSection([]).html()).toBe('<!--v-if-->')
})
