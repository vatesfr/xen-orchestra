<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('actions').arr('string').required().widget().preset(actions).help('Actions shown in the head bar, in order'),
      slot()
        .prop('isInline', 'Partial<Record<TAction, boolean>>')
        .help(
          'Receives which actions fit in the head bar, the others are meant to go in a menu. VtsActionButton components rendered as buttons hide their loader and stay disabled while busy'
        ),
    ]"
  >
    <UiHeadBar>
      VM name with a long label
      <template #actions>
        <VtsHeadBarActions v-slot="{ isInline }" v-bind="properties">
          <template v-for="action in properties.actions" :key="action">
            <VtsActionButton v-if="isInline[action]" variant="tertiary" accent="brand" :icon="ICONS[action]">
              {{ action }}
            </VtsActionButton>
          </template>
          <VtsActionsMenu label="More actions" size="medium" no-section-title>
            <template v-for="action in properties.actions" :key="action">
              <VtsActionButton v-if="!isInline[action]" variant="tertiary" accent="brand" :icon="ICONS[action]">
                {{ action }}
              </VtsActionButton>
            </template>
          </VtsActionsMenu>
        </VtsHeadBarActions>
      </template>
    </UiHeadBar>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import type { IconName } from '@core/icons'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import VtsHeadBarActions from '@core/components/head-bar/VtsHeadBarActions.vue'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

const actions = ['Shutdown', 'Reboot', 'Migrate', 'Snapshot']

const ICONS: Record<string, IconName> = {
  Shutdown: 'action:shutdown',
  Reboot: 'action:reboot',
  Migrate: 'action:migrate',
  Snapshot: 'action:snapshot',
}
</script>
