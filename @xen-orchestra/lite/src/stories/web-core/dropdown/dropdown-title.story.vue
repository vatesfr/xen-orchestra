<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      iconProp('icon'),
      prop('selected').default('none').enum('none', 'some', 'all').widget(),
      event('toggleSelectAll').args({ value: 'boolean' }),
      slot(),
      setting('defaultSlotContent').preset('Dropdown title').widget(text()).help('Content for default slot'),
    ]"
  >
    <DropdownList checkbox>
      <template v-for="x in 2" :key="x">
        <DropdownTitle v-bind="properties">{{ settings.defaultSlotContent }}</DropdownTitle>
        <DropdownItem v-for="y in 3" :key="y" :selected="isSelected(y, properties as any)">Item label</DropdownItem>
      </template>
    </DropdownList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param'
import { text } from '@/libs/story/story-widget'
import DropdownItem from '@core/components/dropdown/DropdownItem.vue'
import DropdownList from '@core/components/dropdown/DropdownList.vue'
import DropdownTitle from '@core/components/dropdown/DropdownTitle.vue'

const isSelected = (n: number, props: { selected: 'all' | 'some' | 'none' }) => {
  return props.selected === 'all' || (props.selected === 'some' && n % 2 === 0)
}
</script>
