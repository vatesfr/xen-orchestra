<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('error').bool().widget().preset(false),
      prop('closable').bool().widget().preset(true),
      iconProp('closeIcon')
        .preset('action:close-cancel-clear')
        .default('action:close-cancel-clear')
        .help('The close icon (can be different on mobile)'),
      event('close').args({}).help('Emitted when the user clicks the close button'),
      slot(),
      slot('header').help('Meant to receive text or other information'),
      slot('actions').help('For the main action buttons, moved into the more actions menu when they do not fit'),
      slot('more-actions').help('For other action buttons, shown in a dropdown menu'),
      slot('corner-actions').help('For action icon buttons, like the pin button on VtsSidePanel'),
      setting('headerText').widget(text()),
      setting('forceMaxWidth').widget(boolean()).preset(true).help('Simulate the side panel\'s default width'),
      setting('showButtons').widget(boolean()).preset(true),
      setting('showMoreButtons').widget(boolean()).preset(false),
      setting('showHero').widget(boolean()).preset(true),
      setting('heroType')
        .widget(choice(...STATE_HERO_TYPES))
        .preset('no-selection'),
    ]"
  >
    <VtsPanel v-bind="properties" :class="{ 'force-max-width': settings.forceMaxWidth }">
      <template v-if="settings.headerText" #header>
        <span>{{ settings.headerText }}</span>
      </template>
      <template v-if="settings.showButtons" #actions>
        <VtsActionButton variant="tertiary" accent="brand" icon="action:edit">Edit</VtsActionButton>
        <VtsActionButton variant="tertiary" accent="danger" icon="action:delete">Delete</VtsActionButton>
      </template>
      <template v-if="settings.showMoreButtons" #more-actions>
        <MenuItem accent="warning" icon="action:disconnect">
          Disconnect<UiCounter value="3" accent="warning" variant="primary" size="small" />
        </MenuItem>
        <MenuItem accent="neutral" icon="action:copy">Copy</MenuItem>
        <MenuItem accent="neutral" icon="action:download">Download</MenuItem>
      </template>
      <template #default>
        <VtsStateHero v-if="settings.showHero" format="card" :type="settings.heroType" size="medium" />
        <UiPanelCard v-else>
          <div>Card Content</div>
        </UiPanelCard>
      </template>
    </VtsPanel>
  </ComponentStory>
</template>

<script setup lang="ts">
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, iconProp, prop, setting, slot } from '@/libs/story/story-param.ts'
import { boolean, choice, text } from '@/libs/story/story-widget.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import VtsPanel from '@core/components/panel/VtsPanel.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { STATE_HERO_TYPES } from '@core/types/state-hero.type.ts'
</script>

<style scoped lang="postcss">
.force-max-width {
  max-width: 40rem;
  margin: 0 auto;
}
</style>
