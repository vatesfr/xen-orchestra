<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('actions').arr('ActionItem').required().widget().preset(actions)]"
    :presets
  >
    <MenuList>
      <VtsActionItems v-bind="properties" />
    </MenuList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'

function onClick() {
  return new Promise(resolve => setTimeout(resolve, 1000))
}

const actions: ActionItem[] = [
  { label: 'Edit', icon: 'action:edit', onClick },
  { label: 'Copy', icon: 'action:copy', hint: 'Clipboard', onClick },
  { label: 'Disabled', icon: 'action:duplicate', disabled: true, onClick },
  { label: 'Busy', icon: 'action:download', busy: true, onClick },
  { label: 'Delete', icon: 'action:delete', accent: 'danger', separator: true, onClick },
]

const nestedActions: ActionItem[] = [
  { label: 'Edit', icon: 'action:edit', onClick },
  {
    label: 'More',
    icon: 'action:add',
    children: [
      { label: 'Copy', icon: 'action:copy', onClick },
      { label: 'Delete', icon: 'action:delete', accent: 'danger', separator: true, onClick },
    ],
  },
]

const presets = {
  'Flat list': { props: { actions } },
  'With submenu': { props: { actions: nestedActions } },
}
</script>
